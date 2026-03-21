module.exports = function (accounts, events, year) {
  // Collect data of received gifts for annual reporting.
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
  //   an array of gift asset report objects
  //
  const gifts = events.findByYear('gift', year)
  const reportData = []

  gifts.forEach(gift => {
    const giftAssetData = gift.getReportData()
    giftAssetData.forEach(assetDatum => {
      reportData.push(assetDatum)
    })
  })

  return reportData
}
