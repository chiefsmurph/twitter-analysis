const analyze = require('./analyze');
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

module.exports = async () => {
  const analyzed = await usersOfInterest.asyncMap(1, async username => ({
    username,
    ...await analyze(username)
  }));

  const sorted = analyzed.sort((a, b) => b.trendToHigh - a.trendToHigh);
  console.table(sorted);
  strlog(sorted);
};