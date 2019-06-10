let json = require('../output/allPicks/6-9-2019');
const { avg } = require('../helpers/array-math');

const { uniq, omit, groupBy, mapObject } = require('underscore');
const Combinatorics = require('js-combinatorics');

module.exports = () => {

  const response = {};

  
  json = json.filter(r => r.ticker !== 'LEAS');

  const limitPlayout = (closes, limit = 20) => {
    // console.log({ closes })
    for (let n of closes) {
      if (Math.abs(n) > limit) {
        // console.log('hit limit', n, limit);
        return 100 + n;
      }
    }
    return 100 + closes[closes.length - 1];
  };

  const statKeys = ['trendToHigh', 'highMinusLow', 'trendToCloses', 'percHit20Up', 'percHit30Up'];
  const getStats = subset => statKeys.reduce((acc, key) => ({
    ...acc,
    [key]: avg(subset.map(result => result[key]))
  }), {
    uniqCount: subset.length,
    limit20Playout: (() => {
      const playouts = subset.map(
        result => limitPlayout(result.allCloses, 20)
      );
      // strlog(playouts)
      return avg(
        playouts
      );
    })(),
    limit30Playout: (() => {
      const playouts = subset.map(
        result => limitPlayout(result.allCloses, 30)
      );
      // strlog(playouts)
      return avg(
        playouts
      );
    })(),
    limit60Playout: (() => {
      const playouts = subset.map(
        result => limitPlayout(result.allCloses, 60)
      );
      // strlog(playouts)
      return avg(
        playouts
      );
    })(),
    limit100Playout: (() => {
      const playouts = subset.map(
        result => limitPlayout(result.allCloses, 100)
      );
      // strlog(playouts)
      return avg(
        playouts
      );
    })()
  });


  const top12users = [
    "SniperTradesOTC",
    "stockballa", 
    "DomBuckz", 
    "Percy34453450", 
    "sally37045980", 
    "Vestor7", 
    "GeneLyons14", 
    "notoriousmurph", 
    "mrpenny12", 
    "KickoStocks", 
    "robertmendoza22", 
    "NedBillsen"
  ];

  

  const subsets = {
    all: () => true,
    // noLEAS: result => result.ticker !== 'LEAS',
    everyTop12: result => result.usernames.every(username => top12users.includes(username)),
    someTop12: result => result.usernames.some(username => top12users.includes(username)),
    top12MultipleRecs: (result, index, arr) => {
      // const top12 = result.usernames.every(username => top12users.includes(username));
      const multiple = result.usernames.length === 6;
      return multiple;
    },
    top12SingleRec: (result, index, arr) => {
      const top12 = result.usernames.every(username => top12users.includes(username));
      const single = result.usernames.length == 1;
      return top12 && single;
    },
    
  };




  // console.log(json);
  // console.log(getStats(json));





  response.customSubsets = Object.keys(subsets).reduce((acc, key) => ({
    ...acc,
    [key]: getStats(
      json.filter(
        rec => subsets[key](rec)
      )
    )
  }), {});


  // console.log('--------------------------');

  // BY USERNAME
  const allUsernames = uniq(json.map(result => result.usernames).flatten());
  response.byUsername = allUsernames.map(username => ({
    username,
    stats: getStats(
      json.filter(result => 
        result.usernames.includes(username)
      )
    )
  })).sort((a, b) => b.stats.trendToHigh - a.stats.trendToHigh);


  // BY USERNAME PERMUTATIONS
  const allPerms = [];
  const addNum = num => {
    cmb = Combinatorics.combination(allUsernames, num);
    while (a = cmb.next()) allPerms.push(a);
  };
  [2, 3].forEach(addNum);
  // console.log(allPerms);

  const usernamePerms = allPerms.map(usernamePerm => ({
    usernamePerm,
    stats: getStats(
      json.filter(result =>
        usernamePerm.every(username => 
          result.usernames.includes(username)
        )
      )
    )
  })).filter(({ stats }) => stats.uniqCount > 5)
  .sort((a, b) => b.stats.trendToHigh - a.stats.trendToHigh);
  response.usernamePerms = usernamePerms;



  
  // BY TICKER


  const tickers = uniq(json, 'ticker').map(result => result.ticker);
  // const byTickerCount = mapObject(byTicker, arr => arr.length);
  // strlog(tickers);

  response.byTicker = tickers.map(ticker => ({
    ticker,
    stats: getStats(
      json.filter(result =>
        result.ticker === ticker
      )
    )
  })).filter(({ stats }) => stats.uniqCount > 5)
  .sort((a, b) => b.stats.trendToHigh - a.stats.trendToHigh);


  return response;
};