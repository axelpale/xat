module.exports = function (accounts, events, beginDate, endDate) {
  // Collect data of asset casualties for the given date range.
  // The range is inclusive for the begin date and exclusive for the end date.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of financial events
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //
  // Return
  //   an array of sale report objects
  //
  const evs = events.findByDateRange('casualty', beginDate, endDate)
  const reportData = []

  evs.forEach(ev => {
    const evData = ev.getReportData()
    evData.forEach(datum => {
      reportData.push(datum)
    })
  })

  return reportData
}
