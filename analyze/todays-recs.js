const usersOfInterest = require('../users-of-interest');
const getTweets = require('../fetching/get-tweets');
const { uniq, groupBy, mapObject } = require('underscore');

const sixNine2019 = require('../output-analysis/6-9-2019');

module.exports = async (daysBack = 3) => {

  const { usernamePerms } = sixNine2019();
  // strlog(usernamePerms);


  const withTweets = (await usersOfInterest.asyncMap(1, async username => ({
    username,
    tweets: await getTweets(username, daysBack)
  }))).filter(({ tweets }) => tweets);

  const tweetsCombined = withTweets
    .map(({ username, tweets }) => ({
      username,
      tickers: uniq(tweets.map(tweet => tweet.tickers).flatten())
    }))
    .filter(({ tickers }) => tickers.length);

  const rejoinedUsernameAndTicker = tweetsCombined
    .map(({ username, tickers }) => 
      tickers.map(ticker => ({
        username,
        ticker
      }))
    ).flatten();

  const groupedByTicker = mapObject(
    groupBy(rejoinedUsernameAndTicker, 'ticker'),
    array => array.map(({ username }) => username)
  );

  const asArray = Object.keys(groupedByTicker).map(ticker => ({
    ticker,
    usernames: groupedByTicker[ticker]
  }));
  
  // strlog(asArray);


  return usernamePerms.map(perm => {

    const todaysRecs = asArray.filter(
      ({ usernames }) => 
        perm.usernamePerm.every(username =>
          usernames.includes(username)
        )
    );

    return {
      ...perm,
      ...todaysRecs.length && { todaysRecs }
    };

  }).filter(perm => perm.todaysRecs && perm.todaysRecs.length)
  .filter(r => 
    r.stats.percHit20Up >= 0.5 &&
    r.stats.percHit30Up >= 0.5 && 
    r.stats.limit20Playout > 105 &&
    r.todaysRecs.length === 1
  );

};