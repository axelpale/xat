const BigNumber = require('big.js')

const Income = function (
  date,
  assets
) {
  // An Income. Received assets that count as income tax.
  //
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid income date. Must be a string.')
  }
  if (!Array.isArray(assets)) {
    throw new Error('Invalid income assets. Must be an array.')
  }
  if (assets.length < 1) {
    throw new Error('No income assets. Must have at least one asset.')
  }

  this.incomeDate = date
  this.receivedAssets = assets
}

module.exports = Income
const proto = Income.prototype

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
