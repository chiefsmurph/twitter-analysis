module.exports = (date = new Date()) => {
  const [year, month, day] = new Date(date).toLocaleDateString().split('-');
  return [month, day, year].join('-');
};