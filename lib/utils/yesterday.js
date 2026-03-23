module.exports = function (date) {
  // Compute the date string of the previous day.
  //
  // Parameters:
  //   date
  //     an ISO date string
  //
  // Return
  //   a string, an ISO date string
  //
  if (typeof date !== 'string' || date.length !== 10) {
    throw new Error('Invalid date string. Must be a valid ISO date.')
  }

  const d = new Date(date + 'T00:00:00Z')

  // Rolls the date back by one day. Rolls month and year if needed.
  d.setUTCDate(d.getUTCDate() - 1)

  return d.toISOString().slice(0, 10)
}
