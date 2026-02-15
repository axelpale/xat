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

  const taxData = []

  sales.forEach(sale => {
    const gain = sale.getGainEur()
    let capitalGain, capitalLoss
    if (gain.gte(0)) {
      capitalGain = gain
      capitalLoss = ZERO
    } else {
      capitalGain = ZERO
      capitalLoss = gain.neg()
    }

    // TODO Create a tax row for each asset separately
    // TODO Report the purchase price with the acquisition cost assumption.

    const taxDatum = {
      date: sale.date,
      transactionId: sale.transactionId,
      amountSold: sale.getSaleAmount(),
      unitSold: sale.soldUnit,
      purchaseDate: sale.getPurchaseDate(),
      assetOrigin: sale.getPurchaseOrigin(),
      soldTo: sale.saleOrigin,
      totalPurchasePriceEur: sale.getPurchasePriceEur(),
      totalSalePriceEur: sale.getSalePriceEur(),
      purchaseExpensesEur: sale.getPurchaseExpensesEur(),
      saleExpensesEur: sale.saleExpensesEur,
      capitalGain,
      capitalLoss
    }

    taxData.push(taxDatum)
  })

  const filename = 'tax_report_sales_' + year + '.csv'
  const filepath = path.resolve(__dirname, '..', 'data', filename)
  arrayToCsv(taxData, filepath)
}
