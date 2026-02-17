module.exports = function (accounts, events, year) {
  // Collect data for a tax report for the given year.
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
  //   an object { salesData, rewardsData }
  //
  const sales = events.findByYear('sale', year)
  const rewards = events.findByYear('reward', year)

  const saleReportData = []
  const rewardReportData = []

  sales.forEach(sale => {
    const assetSales = sale.getAssetSales()
    assetSales.forEach(assetSale => {
      saleReportData.push(assetSale)
    })
  })

  rewards.forEach(reward => {
    const assetRewards = reward.getAssetRewards()
    assetRewards.forEach(assetReward => {
      rewardReportData.push(assetReward)
    })
  })

  return {
    salesData: saleReportData,
    rewardsData: rewardReportData
  }
}
