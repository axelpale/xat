const BigNumber = require('big.js')

const Airdrop = function (
  id,
  date,
  receivedAssets
) {
  // Airdropped income event. Treated as capital income in Finland
  // if tokens are received for holding other assets.
  // The assets are valued at the time of receiving.
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
    throw new Error('Invalid row ID for event. Must be an integer.')
  }
  if (id !== parseInt(id)) {
    throw new Error('Unexpected row ID for event. Must be an integer.')
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

  this.id = id
  this.date = date
  this.receivedAssets = receivedAssets
}

module.exports = Airdrop
const proto = Airdrop.prototype
proto.type = 'airdrop'

proto.getIncomeEur = function () {
  // Compute the total value of the assets.
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
    const incomeEur = asset.getAcquisitionPriceEur(this.date)
    return {
      id: asset.acquisitionId,
      date: this.date,
      amount: asset.amount,
      unit: asset.unit,
      receivedFrom: asset.origin,
      capitalIncomeEur: incomeEur
    }
  })
}
