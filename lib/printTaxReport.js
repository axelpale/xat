const BigNumber = require('big.js')
const path = require('path')
const arrayToCsv = require('./reports/arrayToCsv')
const ZERO = new BigNumber(0)

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

  const taxData = sales.map(sale => {
    const gain = sale.getGainEur()
    let capitalGain, capitalLoss
    if (gain.gte(0)) {
      capitalGain = gain
      capitalLoss = ZERO
    } else {
      capitalGain = ZERO
      capitalLoss = gain.neg()
    }
    return {
      date: sale.date,
      amount: sale.getSaleAmount(),
      unit: sale.soldUnit,
      purchaseOrigin: sale.getPurchaseOrigin(),
      purchaseDate: sale.getPurchaseDate(),
      totalPurchasePriceEur: sale.getPurchasePriceEur(),
      totalSalePriceEur: sale.getSalePriceEur(),
      purchaseExpensesEur: sale.getPurchaseExpensesEur(),
      saleExpensesEur: sale.saleExpensesEur,
      capitalGain,
      capitalLoss
    }
  })

  const filename = 'tax_report_sales_' + year + '.csv'
  const filepath = path.resolve(__dirname, '..', 'data', filename)
  arrayToCsv(taxData, filepath)
}
