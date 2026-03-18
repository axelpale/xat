module.exports = function (accounts, events, year) {
  // Collect data of sales for annual reporting.
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
  //   an array of sale report objects
  //
  const sales = events.findByYear('sale', year)
  const reportData = []

  sales.forEach(sale => {
    const assetSales = sale.getAssetSales()
    assetSales.forEach(assetSale => {
      reportData.push(assetSale)
    })
  })

  return reportData
}
