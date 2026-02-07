const fs = require('fs')

const pretty = (x) => {
  // Get pretty string from x
  //
  if (!x) {
    return ''
  }
  if (typeof x === 'string') {
    return '"' + x + '"'
  }
  if (typeof x === 'object') {
    if (x.toFixed) {
      return x.toFixed(8)
    }
    if (x.toString) {
      return '"' + x.toString() + '"'
    }
  }
  if (typeof x === 'number') {
    return x.toFixed(8)
  }
  return ''
}

module.exports = function (rows, filepath) {
  // Write rows into a CSV file.
  //
  const len = rows.length
  if (rows.length < 1) {
    throw new Error('Unexpected empty array of rows.')
  }

  const firstRow = rows[0]
  const lastRow = rows[len - 1]

  const columnNames = Object.keys(firstRow)
  const labelLine = columnNames.join(',')

  // Detect chronological order. Flip so that the most recent are first.
  let orderedRows = rows
  if (firstRow.date < lastRow.date) {
    orderedRows = rows.toReversed()
  }

  // Render text lines
  const fileString = orderedRows.reduce((acc, r) => {
    return acc + columnNames.map(k => pretty(r[k])).join(',') + '\n'
  }, labelLine + '\n')

  // Write the file
  fs.writeFileSync('ledger-history.csv', fileString)
}
