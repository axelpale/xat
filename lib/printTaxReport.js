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

  const taxData = []

  sales.forEach(sale => {
    const assetSales = sale.getAssetSales()
    assetSales.forEach(assetSale => {
      taxData.push(assetSale)
    })
  })

  const filename = 'tax_report_sales_' + year + '.csv'
  const filepath = path.resolve(__dirname, '..', 'data', filename)
  arrayToCsv(taxData, filepath)
}
