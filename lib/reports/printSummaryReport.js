const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const path = require('path')
const arrayToCsv = require('./arrayToCsv')

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'reports')

const summarize = (year, salesData, rewardsData, airdropsData) => {
  // Combine income data into one row.
  //
  const purchasePrice = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.acquisitionPriceEur)
  }, ZERO)

  const salePrice = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.salePriceEur)
  }, ZERO)

  const purchaseExp = salesData.reduce((acc, assetSale) => {
    return acc.plus(assetSale.acquisitionExpensesEur)
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

  const gainTotal = gain.minus(loss)

  const rewards = rewardsData.reduce((acc, assetReward) => {
    return acc.plus(assetReward.capitalIncomeEur)
  }, ZERO)

  const airdrops = airdropsData.reduce((acc, airdropDatum) => {
    return acc.plus(airdropDatum.capitalIncomeEur)
  }, ZERO)

  const total = gain.minus(loss).plus(rewards).plus(airdrops)

  return {
    year,
    acquisitionCostOfSalesEur: purchasePrice.plus(purchaseExp),
    salesEur: salePrice,
    saleExpensesEur: saleExp,
    capitalGainEur: gain,
    capitalLossEur: loss,
    capitalGainTotalEur: gainTotal,
    incomeFromStaking: rewards,
    incomeFromAirdrops: airdrops,
    totalCapitalIncomeEur: total
  }
}

module.exports = function (accounts, events) {
  // Print a readable tax report for the given year.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of financial events
  //   year
  //     a string or integer
  //

  // Find year range for the summary
  const yearRange = events.findYearRangeAny()

  const summaryRows = []

  for (let y = yearRange.minYear; y <= yearRange.maxYear; y++) {
    const rangeBegin = `${y}-01-01`
    const rangeEnd = `${y + 1}-01-01`
    const sales = events.collectReport('sale', rangeBegin, rangeEnd)
    const rewards = events.collectReport('reward', rangeBegin, rangeEnd)
    const airdrops = events.collectReport('airdrop', rangeBegin, rangeEnd)

    const summaryRow = summarize(y, sales, rewards, airdrops)
    summaryRows.push(summaryRow)
  }

  if (summaryRows.length > 0) {
    const rangeStr = `${yearRange.minYear}-${yearRange.maxYear}`
    const filename = 'income_summary_' + rangeStr + '.csv'
    const filepath = path.join(OUTPUT_DIR, filename)
    arrayToCsv(summaryRows, filepath, 2)
  }
}
