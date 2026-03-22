module.exports = function (accounts, events, beginDate, endDate) {
  // Collect data of airdrops for the given date range.
  // The range is inclusive for the begin date and exclusive for the end date.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   beginDate
  //     an ISO date string. Inclusive.
  //   endDate
  //     an ISO date string. Exclusive.
  //
  // Return
  //   an array of airdrop report objects
  //
  const evs = events.findByDateRange('airdrop', beginDate, endDate)
  const reportData = []

  evs.forEach(ev => {
    const assetData = ev.getReportData()
    assetData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
