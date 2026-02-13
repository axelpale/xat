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
  if (typeof filepath !== 'string') {
    throw new Error('Invalid filepath: ' + filepath)
  }

  const firstRow = rows[0]
  const lastRow = rows[len - 1]

  const columnNames = Object.keys(firstRow)
  const labelLine = columnNames.join(',')

  // Detect chronological order. Flip so that the oldest are first.
  let orderedRows = rows
  if (firstRow.date > lastRow.date) {
    orderedRows = rows.toReversed()
  }

  // Construct empty lines if needed
  // const numColumns = columnNames.length
  // const emptyLine = ','.repeat(numColumns - 1) + '\n'

  // Render text lines.
  const firstLine = labelLine + '\n'
  const fileString = orderedRows.reduce((acc, r) => {
    if (!r) {
      // Null line. Skip.
      return acc
    }

    if (typeof r === 'string') {
      // Skip string lines.
      return acc
    }

    // Add a line of comma separated values
    const line = columnNames.map(k => pretty(r[k])).join(',') + '\n'

    return acc + line
  }, firstLine)

  // Write the file
  fs.writeFileSync(filepath, fileString)
}
