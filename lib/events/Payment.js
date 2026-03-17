const BigNumber = require('big.js')

const Payment = function (
  date,
  receivedAssets
) {
  // An ordinary income received via payment event.
  // Received assets are subject to ordinary income tax.
  //
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid income date. Must be a string.')
  }
  if (!Array.isArray(receivedAssets)) {
    throw new Error('Invalid received assets. Must be an array.')
  }
  if (receivedAssets.length < 1) {
    throw new Error('No assets received. Must have at least one asset.')
  }

  this.date = date
  this.receivedAssets = receivedAssets
}

module.exports = Payment
const proto = Payment.prototype

proto.getGainEur = function () {
  // Compute the total income from the assets.
  //
  // Return
  //   a BigNumber.
  //

  let total = new BigNumber(0)

  const len = this.receivedAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.receivedAssets[i]
    total = total.plus(asset.getPurchasePriceEur())
  }

  return total
}
