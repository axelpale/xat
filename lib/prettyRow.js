const BigNumber = require('big.js')

module.exports = function (row) {
  // Print the row in human-readable and JSON-friendly format.
  //
  let str = '{\n'

  const keys = Object.keys(row)
  const len = keys.length
  for (let i = 0; i < len; i++) {
    const key = keys[i]
    const val = row[key]
    str += '  ' + key + ': '
    if (typeof val === 'string') {
      str += '\'' + val + '\''
    } else if (val instanceof BigNumber) {
      str += val.toFixed(8)
    } else if (Array.isArray(val)) {
      str += '[' + val.join(', ') + ']'
    } else {
      str += val
    }

    if (i + 1 < len) {
      str += ','
    }
    str += '\n'
  }

  str += '}'

  return str
}
