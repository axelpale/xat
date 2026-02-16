const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const Reward = function (
  date,
  receivedAssets
) {
  // A reward event happens when a reward is received for staked or
  // otherwise allocated assets.
  // The acquisition cost is zero.
  //
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid reward date. Must be a string.')
  }
  if (!Array.isArray(receivedAssets)) {
    throw new Error('Invalid received assets. Must be an array.')
  }
  if (receivedAssets.length < 1) {
    throw new Error('No received assets. Must have at least one asset.')
  }
  const hasSameUnit = receivedAssets.every(asset => {
    return asset.unit === receivedAssets[0].unit
  })
  if (!hasSameUnit) {
    throw new Error('Unexpected received assets. Must have identical unit.')
  }

  this.date = date
  this.receivedAssets = receivedAssets
  this.receivedUnit = receivedAssets[0].unit
}

module.exports = Reward
const proto = Reward.prototype

proto.getGainEur = function () {
  // Compute the capital gain. Negative value means capital loss.
  //
  // Return
  //   a BigNumber.
  //
  let total = ZERO

  const len = this.receivedAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.receivedAssets[i]
    total = total.plus(asset.getPurchasePriceEur())
  }

  return total
}

proto.getAmount = function () {
  // Compute the total amount of the unit received.
  //
  // Return
  //   a BigNumber.
  //
  let total = ZERO

  const len = this.receivedAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.receivedAssets[i]
    total = total.plus(asset.amount)
  }

  return total
}

proto.getAssetRewards = function () {
  return this.receivedAssets.map(asset => {
    const price = asset.getPurchasePriceEur()
    return {
      date: this.date,
      amount: asset.amount,
      unit: asset.unit,
      receivedFrom: asset.purchaseOrigin,
      priceEur: price,
      capitalGain: price,
      capitalLoss: ZERO
    }
  })
}
