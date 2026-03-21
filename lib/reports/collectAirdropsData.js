module.exports = function (accounts, events, year) {
  // Collect data of airdrops for annual reporting.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //
  // Return
  //   an array of airdrop report objects
  //
  const evs = events.findByYear('airdrop', year)
  const reportData = []

  evs.forEach(ev => {
    const assetData = ev.getReportData()
    assetData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
