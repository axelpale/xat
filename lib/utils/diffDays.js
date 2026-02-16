const MS_PER_DAY = 24 * 60 * 60 * 1000

module.exports = function (date0, date1) {
  // Compute how many days from the first date to the second date.
  // Will return negative days if the second date is earlier than the first.
  //
  // Parameters:
  //   date0
  //     a string, YYYY-MM-DD format
  //   date1
  //     a string, YYYY-MM-DD format
  //
  // Return
  //   a number, the decimal days between the two dates.
  //

  if (!date0 || typeof date0 !== 'string' || date0.length < 10) {
    throw new Error('Invalid date string: ' + date0)
  }
  if (!date1 || typeof date1 !== 'string' || date1.length < 10) {
    throw new Error('Invalid date string: ' + date1)
  }

  // Cut out the time part if any.
  const parts0 = date0.split(/[_ T]/)
  const parts1 = date1.split(/[_ T]/)

  const [y0, m0, d0] = parts0[0].split('-').map(Number)
  const [y1, m1, d1] = parts1[0].split('-').map(Number)

  if (isNaN(y0) || isNaN(m0) || isNaN(d0)) {
    throw new Error('Invalid date: ' + date0)
  }
  if (isNaN(y1) || isNaN(m1) || isNaN(d1)) {
    throw new Error('Invalid date: ' + date1)
  }

  const utc1 = Date.UTC(y0, m0 - 1, d0)
  const utc2 = Date.UTC(y1, m1 - 1, d1)

  return (utc2 - utc1) / MS_PER_DAY
}
