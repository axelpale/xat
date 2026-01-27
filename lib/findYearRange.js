module.exports = function findYearRange (evs, datePropName) {
  // Find the year extremes in the set of events.
  //
  // Parameters:
  //   evs
  //     an array of event objects with some date property.
  //   datePropName
  //     a string, the date property name
  //
  // Return
  //   an object { minYear, maxYear }
  //
  let minYear = Infinity
  let maxYear = -Infinity

  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i]
    const date = ev[datePropName]
    if (typeof date === 'string' && date.length >= 4) {
      const yearStr = date.substring(0, 4)
      const year = parseInt(yearStr)
      if (!isNaN(year)) {
        if (year < minYear) {
          minYear = year
        }
        if (year > maxYear) {
          maxYear = year
        }
      }
    }
  }

  return { minYear, maxYear }
}
