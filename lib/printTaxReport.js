const path = require('path')
const arrayToCsv = require('./reports/arrayToCsv')

module.exports = function (accounts, events, year) {
  // Print a readable tax report for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
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

  const salesFilename = 'tax_report_sales_' + year + '.csv'
  const salesFilepath = path.resolve(__dirname, '..', 'data', salesFilename)
  arrayToCsv(saleReportData, salesFilepath)

  const rewardsFilename = 'tax_report_rewards_' + year + '.csv'
  const rewardsFilepath = path.resolve(__dirname, '..', 'data', rewardsFilename)
  arrayToCsv(rewardReportData, rewardsFilepath)
}
