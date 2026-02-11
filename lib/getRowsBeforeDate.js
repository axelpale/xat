const getDateFromDateTime = require('./ledger/getDateFromDateTime')

module.exports = function (rows, untilDate) {
  // Find all rows before the given date.
  // Rows on the given date and after are excluded.
  // Maintain the row order.
  //
  // Parameters:
  //   rows
  //     an array of row objects
  //   untilDate
  //     a string, ISO date
  //
  // Return
  //   an array of row objects
  //

  if (!rows || !Array.isArray(rows)) {
    throw new Error('Invalid rows.')
  }
  if (rows.length < 1) {
    return []
  }
  if (typeof untilDate !== 'string') {
    throw new Error('Invalid date: ' + untilDate)
  }
  if (untilDate.length < 10) {
    throw new Error('Unexpected ISO date: ' + untilDate)
  }

  const result = []

  // Ensure only date part is compared
  const stopDate = getDateFromDateTime(untilDate)

  const len = rows.length
  let i, row, rowDate
  for (i = 0; i < len; i++) {
    row = rows[i]
    // Ensure only date part is compared
    rowDate = getDateFromDateTime(row.date)

    if (rowDate < stopDate) {
      result.push(row)
    }
  }

  return result
}
