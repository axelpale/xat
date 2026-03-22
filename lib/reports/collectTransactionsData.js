module.exports = function (accounts, events, beginDate, endDate) {
  // Collect data of transactions for the given date range.
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
  const txs = events.findByDateRange('transaction', beginDate, endDate)
  const reportData = txs.map(tx => tx.getReportData())

  return reportData
}
