const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const i18n = require('../i18n')
const t = i18n.translate
const tok = i18n.translateObjectKeys

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

module.exports = function (events, eventType, beginDate, endDate, reportLabel) {
  // Print a readable report of selected events for the given date range.
  // The range is inclusive for the begin date and exclusive for the end date.
  //
  // Parameters:
  //   events
  //     a collection of financial events
  //   eventType
  //     a string, the selected event type
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //   reportLabel
  //     a string, the filename prefix to use for the report file.
  //
  if (typeof eventType !== 'string' || beginDate.length < 1) {
    throw new Error('Invalid event type. Must be a string.')
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

  const reportData = events.collectReport(eventType, beginDate, endDate)

  // Translate the keys
  const localizedReportData = reportData.map(row => tok(row))

  // Write the file
  if (localizedReportData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const filename = t(reportLabel) + '_' + rangeLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(localizedReportData, filepath)
  }
}
