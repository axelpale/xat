const fs = require('fs')
const addDayLines = require('./ledger/addDayLines')

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
  if (typeof filepath !== 'string') {
    throw new Error('Invalid filepath: ' + filepath)
  }

  const firstRow = rows[0]
  const lastRow = rows[len - 1]

  const columnNames = Object.keys(firstRow)
  const numColumns = columnNames.length
  const labelLine = columnNames.join(',')

  // Detect chronological order. Flip so that the most recent are first.
  let orderedRows = rows
  if (firstRow.date < lastRow.date) {
    orderedRows = rows.toReversed()
  }

  // Add empty line marks.
  const linedRows = addDayLines(orderedRows)

  // Render text lines. Add day lines at day changes.
  const emptyLine = ','.repeat(numColumns - 1) + '\n'
  const firstLine = labelLine + '\n' + emptyLine
  const fileString = linedRows.reduce((acc, r) => {
    if (!r) {
      // Null line. Skip.
      return acc
    }

    if (typeof r === 'string') {
      if (r === '\n') {
        return acc + emptyLine
      }
      // Skip otherwise
      return acc
    }

    // Add a line of comma separated values
    const line = columnNames.map(k => pretty(r[k])).join(',') + '\n'

    return acc + line
  }, firstLine)

  // Write the file
  fs.writeFileSync(filepath, fileString)
}
