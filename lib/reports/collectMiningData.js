module.exports = function (accounts, events, year) {
  // Collect data of mining income for annual reporting.
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
  //   an array of mining asset report objects
  //
  const miningEvents = events.findByYear('mining', year)
  const reportData = []

  miningEvents.forEach(ev => {
    const miningData = ev.getReportData()
    miningData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
