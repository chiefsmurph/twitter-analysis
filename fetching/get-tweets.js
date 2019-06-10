const Twitter = require("twitter-promise");
const { twitter: credentials } = require('../config');

const tw = new Twitter(credentials);


const getDateStr = require('../helpers/get-datestr');
const getTickers = require('../helpers/get-tickers');

const fetchTweets = async params => {
  try {
    const response = await tw.get({
      path: "statuses/user_timeline",
      params
    });
    return response;
  } catch (e) {
    console.log('error', e);
    return null;
  }
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;
module.exports = async (username, daysBack = 20) => {
  console.log(`getting tweets for ${username}`);
  let lastTweetId;
  let tweets = [];

  const hasReachedDaysBack = () => !!tweets.find(tweet => 
    new Date(tweet.created_at).getTime() < new Date().getTime() - MS_IN_DAY * daysBack
  );

  let n = 1;
  while (!hasReachedDaysBack()) {
    console.log(`fetching page ${n} of tweets`);
    const response = await fetchTweets({
      screen_name: username,
      max_id: lastTweetId,
      count: 200,
      exclude_replies: true,
      // include_rts: false,
      trim_user: true,
    });
    if (!response) {
      return null;
    }
    // console.log(response);
    const { data } = response;
    if (!data || data.length <= 1) {
      return tweets;
    }
    // strlog(data);
    await new Promise(resolve => setTimeout(resolve, 100));
    lastTweetId = data[data.length - 1].id;
    tweets = [
      ...tweets,
      ...data
    ];
    n++;
  }

  tweets.reverse();

  return tweets
    .map(obj => ({
      createdAt: new Date(obj.created_at),
      dateStr: getDateStr(obj.created_at),
      id: obj.id,
      text: obj.text,
      tickers: getTickers(obj.text, true)
    }))
    .filter(tweet => 
      tweet.createdAt >= new Date().getTime() - MS_IN_DAY * daysBack
    );
  
};