const { omit, uniq } = require('underscore');
const usersOfInterest = require('../users-of-interest');
const analyzeUser = require('./user');

// const MS_IN_DAY = 1000 * 60 * 60 * 24;
const MIN_DAY_AGE = 20;
const MAX_DAY_AGE = 50;
const MAX_DAYS_TO_CONSIDER = 6;

module.exports = async (
  minDayAge = MIN_DAY_AGE,
  maxDayAge = MAX_DAY_AGE,
  maxDaysToConsider = MAX_DAYS_TO_CONSIDER
) => {

  console.log('analyzing multiple twitter users', {
    minDayAge,
    maxDayAge,
    maxDaysToConsider
  });

  let allTickerDates = [];
  const analyzed = await usersOfInterest.asyncMap(1, async username => {

    const { 
      overallAnalysis, 
      tickersAnalyzed = [] 
    } = await analyzeUser(
      username,
      minDayAge,
      maxDayAge,
      maxDaysToConsider
    ) || {};
    
    allTickerDates = [
      ...allTickerDates,
      ...tickersAnalyzed.map(tickerAnalysis => ({
        ...tickerAnalysis,
        username
      }))
    ];

    return {
      username,
      ...overallAnalysis,
      tickersRecommended: tickersAnalyzed.length
    };
    
  });

  

  console.log(`considering tweets between ${minDayAge} and ${maxDayAge} days old`);
  console.log(`...and then seeing how those stock picks performed if you were to buy at open the following day`)
  console.log(`...and hold for a maximum of ${maxDaysToConsider} days.\n`);

  const sorted = analyzed
    .filter(({ tickersRecommended }) => tickersRecommended > 0)
    .sort((a, b) => b.trendToHigh - a.trendToHigh);

  console.table(sorted);
  strlog(sorted);
  
  const withMultipleRecs = allTickerDates.filter(tickerDate => {
    const filtered = allTickerDates.filter(td => {
      return td.ticker === tickerDate.ticker && td.dateStr === tickerDate.dateStr;
    });
    return filtered.length >= 3;
  });

  const withSingleRec = allTickerDates.filter(tickerDate => {
    const filtered = allTickerDates.filter(td => {
      return td.ticker === tickerDate.ticker && td.dateStr === tickerDate.dateStr;
    });
    return filtered.length === 1;
  });

  
  [
    ['ALL', allTickerDates],
    ['WITH MULTIPLE RECS', withMultipleRecs],
    ['WITH SINGLE REC', withSingleRec],
  ].forEach(([header, results]) => {
    console.log(header);
    console.log('-----------------------------')
    console.table(
      results.sort(
        (a, b) => b.trendToHigh - a.trendToHigh
      )
    );
    console.log('\n');
  });


  console.log("\n");
  console.log("\n");

  strlog(allTickerDates)

  console.log("\n");
  console.log("\n");

  const uniqPicks = uniq(allTickerDates, result => 
    [result.ticker, result.dateStr].join(',')
  );

  const withUsernames = uniqPicks.map(result => ({
    ...omit(result, 'username'),
    usernames: allTickerDates.filter(r => 
      r.ticker === result.ticker && r.dateStr === result.dateStr
    ).map(r => r.username)
  }));
  
  strlog(withUsernames);
  
};