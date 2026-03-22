module.exports = function (accounts, events, beginDate, endDate) {
  // Collect data of received gifts for the given date range.
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
  //   an array of gift asset report objects
  //
  const gifts = events.findByDateRange('gift', beginDate, endDate)
  const reportData = []

  gifts.forEach(gift => {
    const giftAssetData = gift.getReportData()
    giftAssetData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
