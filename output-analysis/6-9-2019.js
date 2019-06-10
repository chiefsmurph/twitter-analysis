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
  const getStats = subset => 
    statKeys.reduce((acc, key) => ({
      ...acc,
      [key]: avg(subset.map(result => result[key]))
    }), {
      uniqCount: subset.length,
      ...[20, 30, 60, 100].reduce((acc, limit) => ({
        ...acc,
        [`limit${limit}Playout`]: avg(
          subset.map(
            result => limitPlayout(result.allCloses, 20)
          )
        )
      }), {})
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
  
  const newSubset = (
    collection,
    filterFn,
    skipCountFilter
  ) => {
    return collection
      .map(obj => ({
        ...obj,
        stats: getStats(
          json.filter(rec => 
            filterFn(rec, obj)
          )
        )
      }))
      .filter(({ stats }) => skipCountFilter || stats.uniqCount > 5)
      .sort((a, b) => b.stats.trendToHigh - a.stats.trendToHigh);
  }

  // BY USERNAME
  const allUsernames = uniq(json.map(result => result.usernames).flatten());
  response.byUsername = newSubset(
    allUsernames.map(username => ({ username })),
    (rec, { username }) => rec.usernames.includes(username),
    true  // skip uniqCount filter
  );

  // BY USERNAME PERMUTATIONS
  const allPerms = [];
  const addNum = num => {
    cmb = Combinatorics.combination(allUsernames, num);
    while (a = cmb.next()) allPerms.push(a);
  };
  [2, 3].forEach(addNum);
  // console.log(allPerms);
  response.usernamePerms = newSubset(
    allPerms.map(usernamePerm => ({ usernamePerm })),
    (rec, { usernamePerm }) => 
      usernamePerm.every(username => 
        rec.usernames.includes(username)
      )
  );


  
  // BY TICKER


  const tickers = uniq(json, 'ticker').map(result => result.ticker);
  response.byTicker = newSubset(
    tickers.map(ticker => ({ ticker })),
    (rec, { ticker }) => rec.ticker === ticker
  );

  return response;
};