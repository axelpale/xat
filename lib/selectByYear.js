module.exports = function selectByYear (evs, datePropName, selectedYear) {
  // Select events by year.
  //
  // Parameters:
  //   evs
  //     an array of event objects with some kind of date property.
  //   datePropName
  //     a string, the date property name
  //   selectedYear
  //     an integer
  //
  const selected = []

  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i]
    const date = ev[datePropName]
    if (typeof date === 'string' && date.length >= 4) {
      const yearStr = date.substring(0, 4)
      const yearInt = parseInt(yearStr)
      if (!isNaN(yearInt)) {
        if (yearInt === selectedYear) {
          selected.push(ev)
        }
      }
    }
  }

  return selected
}
