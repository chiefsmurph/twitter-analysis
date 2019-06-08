const getHistoricals = require('../fetching/get-historicals');
const getTrend = require('../helpers/get-trend');
const { avg } = require('../helpers/array-math');

const { mapObject } = require('underscore');

module.exports = async (ticker, date, daysToConsider = 10) => {

  console.log('analyzing rec', ticker, 'on', date);

  try {
    // const [month, day, year] = new Date(date).toLocaleDateString().split('/');
    // const formatted = [year, month, day].join('-');
    // console.log({ formatted}, new Date(date).toLocaleDateString());

    // const formatted = new Date(date).toLocaleDateString();
    const historicals = await getHistoricals(ticker);
    // strlog({ historicals });

    const followingDays = historicals.filter(hist => 
      new Date(hist.date).getTime() > new Date(date).getTime()
    ).slice(0, daysToConsider);
  
    // important prices

    // for now assume buy price is open of following day
    // TODO: get intraday historical of otc tickers
    const buyPrice = followingDays[0].adjOpen; 
    const max = Math.max(...followingDays.map(hist => hist.adjHigh));
    const low = Math.min(...followingDays.map(hist => hist.adjLow));
    const allCloses = followingDays.map(day => getTrend(buyPrice, day.adjClose)).map(n => +n.toFixed(2));

    // important trends
    const trendToHigh = getTrend(buyPrice, max);
    const trendToLow = getTrend(buyPrice, low);
    const highMinusLow = trendToHigh - Math.abs(trendToLow);
    const trendToCloses = avg(allCloses);


    // strlog({onlyFuture});
    

    return {
      prices: {
        buyPrice,
        max,
        low,
        allCloses
      },
      perfs: {
        ...mapObject({
          trendToHigh,
          trendToLow,
          highMinusLow,
          trendToCloses,
        }, n => +n.toFixed(2)),
        percHit20Up: Boolean(trendToHigh >= 20),
        percHit30Up: Boolean(trendToHigh >= 30),
      }
    };
  } catch (e) {
    return null;
  }
  
};