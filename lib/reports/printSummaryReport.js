const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const path = require('path')
const arrayToCsv = require('./arrayToCsv')
const collectTaxReport = require('./collectTaxReport')

const DATA_DIR = path.resolve(__dirname, '..', '..', 'data')

const summarize = (year, reportData) => {
  const { salesData, rewardsData } = reportData

  const purchasePrice = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.purchasePriceEur)
  }, ZERO)

  const salePrice = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.salePriceEur)
  }, ZERO)

  const purchaseExp = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.purchaseExpensesEur)
  }, ZERO)

  const saleExp = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.saleExpensesEur)
  }, ZERO)

  const gain = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.capitalGainEur)
  }, ZERO)

  const loss = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.capitalLossEur)
  }, ZERO)

  const rewards = rewardsData.reduce((acc, assetReward) => {
    return acc.plus(assetReward.capitalIncomeEur)
  }, ZERO)

  const total = gain.minus(loss).plus(rewards)

  return {
    year,
    acquisitionCostOfSalesEur: purchasePrice.plus(purchaseExp),
    salesEur: salePrice,
    saleExpensesEur: saleExp,
    capitalGain: gain,
    capitalLoss: loss,
    incomeFromStaking: rewards,
    totalCapitalIncome: total
  }
}

module.exports = function (accounts, events) {
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

  // Find year range for the summary
  const yearRange = events.findYearRangeAny()

  const summaryRows = []

  for (let y = yearRange.minYear; y <= yearRange.maxYear; y++) {
    const report = collectTaxReport(accounts, events, y)
    const summaryRow = summarize(y, report)
    summaryRows.push(summaryRow)
  }

  if (summaryRows.length > 0) {
    const rangeStr = `${yearRange.minYear}-${yearRange.maxYear}`
    const filename = 'tax_report_summary_' + rangeStr + '.csv'
    const filepath = path.join(DATA_DIR, filename)
    arrayToCsv(summaryRows, filepath, 2)
  }
}
