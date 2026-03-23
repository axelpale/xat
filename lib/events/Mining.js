const BigNumber = require('big.js')

const Mining = function (
  id,
  date,
  receivedAssets
) {
  // A mining income event. Treated as ordinary income in Finland.
  // The assets are valued at the time of receiving.
  // Received assets are subject to ordinary income tax.
  //
  // Parameters:
  //   id
  //     an integer
  //   date
  //     a string
  //   receivedAssets
  //     an array of Asset.
  //
  if (typeof id !== 'number') {
    throw new Error('Invalid row ID for mining income. Must be an integer.')
  }
  if (id !== parseInt(id)) {
    throw new Error('Unexpected row ID for mining income. Must be an integer.')
  }
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid income date. Must be a string.')
  }
  if (!Array.isArray(receivedAssets)) {
    throw new Error('Invalid received assets. Must be an array.')
  }
  if (receivedAssets.length < 1) {
    throw new Error('No assets received. Must have at least one asset.')
  }
  if (receivedAssets.some(a => a.acquisitionId !== id)) {
    throw new Error('Unexpected asset acquisition ID. Must equal the event ID.')
  }

  this.id = id
  this.date = date
  this.receivedAssets = receivedAssets
}

module.exports = Mining
const proto = Mining.prototype
proto.type = 'mining'

proto.getIncomeEur = function () {
  // Compute the total income from the assets.
  //
  // Return
  //   a BigNumber.
  //

  let total = new BigNumber(0)

  const len = this.receivedAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.receivedAssets[i]
    total = total.plus(asset.getAcquisitionPriceEur(this.date))
  }

  return total
}

proto.getReportData = function () {
  // Export data for tax report.
  //
  return this.receivedAssets.map(asset => {
    const totalPrice = asset.amount.times(asset.acquisitionUnitPriceEur)
    return {
      id: asset.acquisitionId,
      date: this.date,
      documents: asset.documents.join(';'),
      amount: asset.amount,
      unit: asset.unit,
      origin: asset.origin,
      unitPriceAtDateEur: asset.acquisitionUnitPriceEur,
      totalPriceAtDateEur: totalPrice
    }
  })
}
