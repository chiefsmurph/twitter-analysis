let json = require('../output/allPicks/6-9-2019');
const { avg } = require('../helpers/array-math');

const { uniq, omit, groupBy, mapObject } = require('underscore');
const Combinatorics = require('js-combinatorics');

module.exports = () => {

  json = json.filter(r => r.ticker !== 'LEAS');

  const uniqPicks = uniq(json, result => 
    [result.ticker, result.dateStr].join(',')
  );
  console.log({
    json: json.length,
    uniqPicks: uniqPicks.length
  });

  const withUsernames = uniqPicks.map(result => ({
    ...omit(result, 'username'),
    usernames: json.filter(r => 
      r.ticker === result.ticker && r.dateStr === result.dateStr
    ).map(r => r.username)
  }));

  strlog(withUsernames)
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
      const top12 = result.usernames.every(username => top12users.includes(username));
      const multiple = result.usernames.length == 3;
      return top12 && multiple;
    },
    top12SingleRec: (result, index, arr) => {
      const top12 = result.usernames.every(username => top12users.includes(username));
      const single = result.usernames.length == 1;
      return top12 && single;
    },
    
  };

  // console.log(json);
  console.log(getStats(withUsernames));


  Object.keys(subsets).forEach(key => {
    const filterFn = subsets[key];
    const filtered = withUsernames.filter(filterFn);
    // strlog(filtered);
    console.log('SUBSET: ', key);
    console.log(getStats(filtered));
    if (key !== 'all') {
      // strlog(filtered)
    }
  });


  console.log('--------------------------');


  // BY USERNAME PERMUTATIONS
  const allUsernames = uniq(withUsernames.map(result => result.usernames).flatten());
  const allUserPerms = Combinatorics.power(allUsernames).filter(perm => perm.length);
  console.log(allUserPerms);

  allUserPerms.forEach(perm => {

    const filtered = withUsernames.filter(result => {
      // console.log(
      //   result.usernames.sort().toString(),
      //   perm.sort().toString()
      // )
      return perm.every(username => 
        result.usernames.includes(username)
      );
    });

    const stats = getStats(filtered);
    if (
      filtered.length <= 2 ||
      // stats.limit30Playout < 120 ||
      // stats.trendToHigh < 30 ||
      stats.percHit20Up < 0.8 ||
      stats.percHit30Up < 0.8
    ) return;
    console.log('SUBSET: ', perm);
    console.log(stats);
  });
  console.log('--------------------------');



  
  // BY TICKER


  const tickers = uniq(withUsernames, 'ticker').map(result => result.ticker);
  // const byTickerCount = mapObject(byTicker, arr => arr.length);
  strlog(tickers);


  tickers.forEach(ticker => {
    // console.log(ticker, 't');

    const filtered = withUsernames.filter(result => {
      return result.ticker === ticker
    });
    // console.log(withUsernames)
    const stats = getStats(filtered);
    if (
      filtered.length <= 15
      // stats.limit30Playout < 120 ||
      // stats.trendToHigh < 30 ||
      // stats.percHit20Up < 0.8 ||
      // stats.percHit30Up < 0.8
    ) return;
    console.log('SUBSET: ', ticker);
    console.log(stats);
  });
};