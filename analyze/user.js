const getTweets = require('../fetching/get-tweets');
const getTickers = require('../helpers/get-tickers');
const analyzeRec = require('./recommendation');
const getDateStr = require('../helpers/get-datestr');
const { avg } = require('../helpers/array-math');

const { uniq } = require('underscore');

const MIN_DAY_AGE = 9;

module.exports = async (username, count = 120) => {

  console.log('analyze', { username });
  const response = await getTweets(username, 1000);
  if (!response) return {};
  const { data } = response;
  // console.log(response);

  const oldTweets = data.filter(
    hist => new Date(hist.created_at) < Date.now() - 1000 * 60 * 60 * 24 * MIN_DAY_AGE
  );

  const withTickers = oldTweets.map(obj => ({
    createdAt: new Date(obj.created_at),
    dateStr: getDateStr(obj.created_at),
    id: obj.id,
    text: obj.text,
    tickers: getTickers(obj.text, true)
  }));
  withTickers.reverse();

  // strlog({withTickers})
  
  if (!withTickers.length) {
    return null;
  }
  const sliced = withTickers
    .filter(tweet => tweet.tickers.length === 1)
    .slice(0, count);
  strlog({
    withTickers: withTickers.length,
    sliced: sliced.length
  });


  const tweetsAnalyzed = await sliced.asyncMap(1, async obj => {
    await new Promise(resolve => setTimeout(resolve, 3));
    return {
      ...obj,
      tickers: (await obj.tickers.asyncMap(1, async ticker => ({
        ticker,
        analysis: await analyzeRec(ticker, obj.createdAt)
      }))).filter(ticker => ticker.analysis)
    };
  });

  // strlog({tweetsAnalyzed})
  const tickersAnalyzed = tweetsAnalyzed.reduce((acc, tweet) => [
    ...acc,
    ...tweet.tickers.map(ticker => ({
      ticker: ticker.ticker,
      dateStr: tweet.dateStr,
      ...ticker.analysis.perfs,
      ...ticker.analysis.prices,
    }))
  ], []);


  const uniqTickAndDates = uniq(tickersAnalyzed, ticker => 
    [ticker.ticker, ticker.dateStr].join()
  ).filter(ticker => ticker.trendToHigh < 350);

  // strlog({uniqTickAndDates});

  console.table(uniqTickAndDates);

  const perfKeys = Object.keys(tweetsAnalyzed[0].tickers[0].analysis.perfs);
  
  const overallPerfAnalysis = perfKeys.reduce((acc, key) => ({
    ...acc,
    [key]: avg(
      uniqTickAndDates.map(perf => perf[key])
    )
  }), {});

  strlog({ overallPerfAnalysis });

  return overallPerfAnalysis;
};