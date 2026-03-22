module.exports = function (accounts, events, beginDate, endDate) {
  // Collect rewards data for the given date range.
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
  //   an array of reward report objects
  //
  const evs = events.findByDateRange('reward', beginDate, endDate)
  const reportData = []

  evs.forEach(ev => {
    const assetData = ev.getAssetRewards()
    assetData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
