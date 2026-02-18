const fs = require('fs')

const pretty = (x, precision) => {
  // Get pretty string from x
  //
  if (typeof precision !== 'number') {
    precision = 8
  }
  if (x === null) {
    return ''
  }
  if (typeof x === 'boolean') {
    return x ? 'yes' : 'no'
  }
  if (typeof x === 'string') {
    return '"' + x + '"'
  }
  if (typeof x === 'object') {
    if (x.toFixed) {
      return x.toFixed(precision)
    }
    if (x.toString) {
      return '"' + x.toString() + '"'
    }
  }
  if (typeof x === 'number') {
    return x.toFixed(precision)
  }
  return ''
}

module.exports = function (rows, filepath, precision) {
  // Write rows into a CSV file.
  //
  // Parameters:
  //   rows
  //     an array of objects. The first one determines the columns
  //   filepath
  //     a string, relative filepath
  //   precision
  //     optional integer
  //
  const len = rows.length
  if (rows.length < 1) {
    throw new Error('Unexpected empty array of rows.')
  }
  if (typeof filepath !== 'string') {
    throw new Error('Invalid filepath: ' + filepath)
  }
  if (typeof precision !== 'number') {
    precision = 8
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
    const values = columnNames.map(k => pretty(r[k], precision))
    const line = values.join(',') + '\n'

    return acc + line
  }, firstLine)

  // Write the file
  fs.writeFileSync(filepath, fileString)
}
