const BigNumber = require('big.js')

const Gift = function (
  date,
  receivedAssets
) {
  // Income received from gifts.
  //
  // Received assets are subject to gift tax if the amount
  // per giver within 3 years exceeds limits:
  // - 5000 EUR before 2026
  // - 7500 EUR since 2026
  //
  // Upon selling, the acquistion cost depends on how long the gift is hold:
  // - less than a year: the original acquisition cost
  // - year or more: the list price when the gift was received.
  //
  // Parameters:
  //   date
  //     a string
  //   receivedAssets
  //     an array of Asset.
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

module.exports = Gift
const proto = Gift.prototype
proto.type = 'gift'

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
    total = total.plus(asset.getAcquisitionPriceEur())
  }

  return total
}
