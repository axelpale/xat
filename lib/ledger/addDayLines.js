const getDateFromDateTime = require('./getDateFromDateTime')

module.exports = function (rows) {
  const linedRows = []

  let prevDay = null
  rows.forEach(row => {
    // Skip empty rows.
    if (typeof row !== 'object') {
      return
    }

    // Decide if an empty line is needed between this row and the previous.
    const d = getDateFromDateTime(row.date)

    // Init prev day.
    if (!prevDay) {
      prevDay = d
    } else {
      // If the day changes, add an empty line.
      if (prevDay !== d) {
        linedRows.push('\n')
        prevDay = d
      }
    }

    // Then push the row.
    linedRows.push(row)
  })

  return linedRows
}
