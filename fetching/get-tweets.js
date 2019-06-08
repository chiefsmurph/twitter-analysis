const Twitter = require("twitter-promise");
const { twitter: credentials } = require('../config');

const tw = new Twitter(credentials);



const fetchTweets = async params => {
  try {
    const response = await tw.get({
      path: "statuses/user_timeline",
      params: { 
        ...params,
        exclude_replies: true,
        // include_rts: false,
        trim_user: true,
        count: 200
      }
    });
    return response;
  } catch (e) {
    console.log('error', e);
    return null;
  }
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;
module.exports = async (username, daysBack = 20) => {


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
      max_id: lastTweetId
    });
    if (!response) {
      return null;
    }
    const { data } = response;
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
  return tweets.filter(tweet => 
    new Date(tweet.created_at).getTime() >= new Date().getTime() - MS_IN_DAY * daysBack
  );
  
};