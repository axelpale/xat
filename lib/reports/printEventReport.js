const path = require('path')
const arrayToCsv = require('./arrayToCsv')

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
  if (typeof reportLabel !== 'string' || reportLabel.length < 1) {
    throw new Error('Invalid report file label. Must be a non-empty string.')
  }

  const reportData = events.collectReport(eventType, beginDate, endDate)

  if (reportData.length > 0) {
    const rangeLabel = beginDate + '_' + endDate
    const filename = reportLabel + '_' + rangeLabel + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(reportData, filepath)
  }
}
