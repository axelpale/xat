const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const tok = require('../i18n').translateObjectKeys
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (data, basename) {
  // Print a readable report in CSV file. If data array is empty, nothing.
  //
  // Parameters:
  //   data
  //     an array of plain objects
  //   basename
  //     a string, the filename without extension
  //
  if (!Array.isArray(data)) {
    throw new Error('Invalid data for report. Must be an array.')
  }
  if (typeof basename !== 'string' || basename.length < 1) {
    throw new Error('Invalid basename for report. Must be non-empty string.')
  }

  // Translate the keys
  const localizedData = data.map(row => tok(row))

  // Write the file
  if (localizedData.length > 0) {
    const filename = basename + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(localizedData, filepath)
  }
}
