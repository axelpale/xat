const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const i18n = require('../i18n')
const t = i18n.translate
const tok = i18n.translateObjectKeys
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (data, beginDate, endDate, reportLabel) {
  // Print a readable report in CSV file. If data array is empty, nothing.
  //
  // Parameters:
  //   data
  //     an array of plain objects
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //   reportLabel
  //     a string, the filename prefix to use for the report file.
  //
  if (!Array.isArray(data)) {
    throw new Error('Invalid data for report. Must be an array.')
  }
  if (typeof beginDate !== 'string' || beginDate.length < 10) {
    throw new Error('Invalid begin date. Must be an ISO date string.')
  }
  if (typeof endDate !== 'string' || endDate.length < 10) {
    throw new Error('Invalid end date. Must be an ISO date string.')
  }
  if (typeof reportLabel !== 'string' || reportLabel.length < 1) {
    throw new Error('Invalid report file label. Must be a non-empty string.')
  }

  // Translate the keys
  const localizedData = data.map(row => tok(row))

  // Write the file
  if (localizedData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const basename = t(reportLabel) + '_' + rangeLabel
    const filename = basename + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(localizedData, filepath)
  }
}
