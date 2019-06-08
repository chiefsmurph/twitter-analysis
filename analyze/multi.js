const analyzeUser = require('./user');
const usersOfInterest = [
  'magicmiketrader',
  'SniperTradesOTC',
  'i_like_bb_stock',
  'friends23134',
  'stockguru2020',
  'KickoStocks',
  'DomBuckz',
  'aaaamhim',
  'stock_hacker',
  'GoldMemberOTC',
  'OCDrises',
  'WishfulTH1NKin',
  'OCMillionaire',
  'i_am_andrew84',
  'TradeNeverMarry',
  'Jcazz17',
  'ShortSqueezed1',
  'stockballa',


  
    "gaslitwit",
    "dlz2355",
    "thewarshark",
    "crazyholdemdave",
    "bnp3116",
    "MarketRider76",
    "kreegs_23",
    "Shabanng",
    "zee4130",
    "Bark0Lounger",
    "jared_genest",
    "GeneLyons14",
    "Fitz10061",
    "face_goose",
    "I_Am_Ram_OTC",
    "StoxUs",
    "PennySlapper",
    "BinDaddys",
    "SexySexysamir",
    "robertmendoza22",
    "New_Era_Trading",
    "notoriousmurph"
];

// const MS_IN_DAY = 1000 * 60 * 60 * 24;
const MIN_DAY_AGE = 7;
const MAX_DAY_AGE = 30;
const MAX_DAYS_TO_CONSIDER = 5;

module.exports = async (
  minDayAge = MIN_DAY_AGE,
  maxDayAge = MAX_DAY_AGE,
  maxDaysToConsider = MAX_DAYS_TO_CONSIDER
) => {

  console.log(`considering tweets between ${minDayAge} and ${maxDayAge} days old`);
  console.log(`...and then seeing how those stock picks performed if you were to buy at open the following day`)
  console.log(`...and hold for a maximum of ${maxDaysToConsider} days.`);

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

  const sorted = analyzed.sort((a, b) => b.trendToHigh - a.trendToHigh);
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
};