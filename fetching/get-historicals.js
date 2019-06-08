const request = require('request-promise');
const { tiingo: { token }} = require('../config');
const cacheThis = require('../helpers/cache-this');

module.exports = cacheThis(async ticker => {
  const url = `https://api.tiingo.com/tiingo/daily/${ticker}/prices?startDate=2018-1-1&token=${token}`;
  // strlog(url);
  const requestOptions = {
    url,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const response = await request(requestOptions);
  const parsed = JSON.parse(response);
  // parsed.reverse();
  return parsed;
});