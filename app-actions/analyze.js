const getTweets = require('../fetching/get-tweets');
const getTickers = require('../helpers/get-tickers');
const analyzeRec = require('../helpers/analyze-rec');

const { avg } = require('../helpers/array-math');

const MIN_DAY_AGE = 5;

module.exports = async (username, count = 10) => {

  console.log('analyze', { username });
  const response = await getTweets(username, 800);
  const { data } = response;

  const oldTweets = data.filter(
    hist => new Date(hist.created_at) < Date.now() - 1000 * 60 * 60 * 24 * MIN_DAY_AGE
  );

  const withTickers = oldTweets.map(obj => ({
    createdAt: new Date(obj.created_at),
    id: obj.id,
    text: obj.text,
    tickers: getTickers(obj.text, true)
  }));
  withTickers.reverse();
  // strlog({withTickers})
  
  const sliced = withTickers
    .filter(tweet => tweet.tickers.length)
    .slice(0, count);
  strlog({
    withTickers: withTickers.length,
    sliced: sliced.length
  })
  const tweetsAnalyzed = await sliced.asyncMap(1, async obj => {
    await new Promise(resolve => setTimeout(resolve, 3));
    return {
      ...obj,
      tickers: await obj.tickers.asyncMap(1, async ticker => ({
        ticker,
        analysis: await analyzeRec(ticker, obj.createdAt)
      }))
    };
  });

  // strlog({tweetsAnalyzed})
  const allPerfs = tweetsAnalyzed.reduce((acc, tweet) => [
    ...acc,
    ...tweet.tickers.map(ticker => ticker.analysis.perfs)
  ], []);

  strlog({allPerfs});
  const perfKeys = Object.keys(allPerfs[0]);
  
  const overallPerfAnalysis = perfKeys.reduce((acc, key) => ({
    ...acc,
    [key]: avg(
      allPerfs.map(perf => perf[key])
    )
  }), {});

  strlog({ overallPerfAnalysis });
};