const getTweets = require('../fetching/get-tweets');
const getTickers = require('../helpers/get-tickers');
const analyzeRec = require('./recommendation');
const getDateStr = require('../helpers/get-datestr');
const { avg } = require('../helpers/array-math');

const { uniq, omit, pick } = require('underscore');

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const MIN_DAY_AGE = 7;
const MAX_DAY_AGE = 30;
const MAX_DAYS_TO_CONSIDER = 5;

module.exports = async (
  username,
  minDayAge = MIN_DAY_AGE,
  maxDayAge = MAX_DAY_AGE,
  maxDaysToConsider = MAX_DAYS_TO_CONSIDER
) => {

  console.log('analyzing twitter user', {
    username,
    minDayAge,
    maxDayAge,
    maxDaysToConsider
  });
  const tweets = await getTweets(username, maxDayAge);
  if (!tweets) return null;
  // console.log(response);

  
  const oldTweets = tweets.filter(
    hist => new Date(hist.created_at) < Date.now() - MS_IN_DAY * minDayAge
      && new Date(hist.created_at) > Date.now() - MS_IN_DAY * maxDayAge
  );

  const withTickers = oldTweets.map(obj => ({
    createdAt: new Date(obj.created_at),
    dateStr: getDateStr(obj.created_at),
    id: obj.id,
    text: obj.text,
    tickers: getTickers(obj.text, true)
  }));

  const tickerDates = withTickers
    .filter(obj => obj.tickers.length === 1)  // only tweets recommending exactly one ticker
    .reduce((acc, obj) => [
      ...acc,
      {
        ticker: obj.tickers[0],
        ...pick(obj, 'dateStr')
      }
    ], []);

  const uniqTickerDates = uniq( // combine multiple tweets for the same ticker on the same day
    tickerDates,
    ({ ticker, dateStr }) => [ticker, dateStr].join(',')
  );

  if (!uniqTickerDates.length) return null;

  // strlog(uniqTickerDates)

  strlog({
    tweets: tweets.length,
    oldTweets: oldTweets.length,
    uniqTickerDates: uniqTickerDates.length,
  });


  const recsAnalyzed = await uniqTickerDates.asyncMap(1, async obj => {
    await new Promise(resolve => setTimeout(resolve, 3));
    return {
      ...obj,
      analysis: await analyzeRec(obj.ticker, obj.dateStr, maxDaysToConsider)
    };
  });
  // strlog({recsAnalyzed})
  
  const onlyQuality = recsAnalyzed
    .filter(rec => rec.analysis)
    .filter(rec => rec.analysis.prices.buyPrice >= .0005);

  if (!onlyQuality.length) return null;

  const tickersAnalyzed = onlyQuality.map(rec => ({
    ...omit(rec, 'analysis'),
    ...rec.analysis.perfs,
    ...rec.analysis.prices
  }));

  console.table(tickersAnalyzed);

  const perfKeys = Object.keys(onlyQuality[0].analysis.perfs);

  const overallAnalysis = perfKeys.reduce((acc, key) => ({
    [key]: avg(
      tickersAnalyzed.map(perf => perf[key])
    ),
    ...acc,
  }), {});

  strlog({ overallAnalysis });

  return {
    overallAnalysis,
    tickersAnalyzed
  };
};