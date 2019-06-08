const Twitter = require("twitter-promise");
const { twitter: credentials } = require('../config');

const tw = new Twitter(credentials);

module.exports = async (username, count = 200) => {
  const response = await tw.get({
    path: "statuses/user_timeline",
    params: { 
      screen_name: username,
      exclude_replies: true,
      include_rts: false,
      trim_user: true,
      count
    }
  });
  // console.log(response);
  return response;
};