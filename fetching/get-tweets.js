const Twitter = require("twitter-promise");
const { twitter: credentials } = require('../config');

const tw = new Twitter(credentials);

module.exports = async (username, count = 200) => {
  try {
    const response = await tw.get({
      path: "statuses/user_timeline",
      params: { 
        screen_name: username,
        exclude_replies: true,
        // include_rts: false,
        trim_user: true,
        count
      }
    });
    return response;
  } catch (e) {
    console.log('error', e);
    return null;
  }
  // const response = await 
  // console.log(response);
  // return response;
};