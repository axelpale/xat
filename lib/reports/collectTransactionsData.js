module.exports = function (accounts, events, year) {
  // Collect data of transactions for annual reporting.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of financial events
  //   year
  //     a string or integer
  //
  // Return
  //   an array of sale report objects
  //
  const txs = events.findByYear('transaction', year)
  const reportData = txs.map(tx => tx.getReportData())

  return reportData
}
