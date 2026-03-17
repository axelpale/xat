const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const Reward = function (
  date,
  receivedAssets,
  expensesEur
) {
  // A reward event happens when a reward is received for staked or
  // otherwise allocated assets.
  // No acquisition cost assumption can be used
  // therefore the acquisition cost is zero.
  //
  // Parameters:
  //   date
  //     a string
  //   receivedAssets
  //     an array of Asset.
  //   expensesEur
  //     a BigNumber
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
  if (!(expensesEur instanceof BigNumber)) {
    throw new Error('Invalid expenses. Must be a BigNumber.')
  }

  this.date = date
  this.receivedAssets = receivedAssets
  this.receivedUnit = receivedAssets[0].unit
  this.expensesEur = expensesEur
}

module.exports = Reward
const proto = Reward.prototype
proto.type = 'reward'

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
    total = total.plus(asset.getAcquisitionPriceEur())
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
  // Export data for tax report.
  //
  const numAssets = this.receivedAssets.length
  const expensePerAsset = this.expensesEur.div(numAssets)

  return this.receivedAssets.map(asset => {
    const incomeEur = asset.getAcquisitionPriceEur()
    const totalIncomeEur = incomeEur.plus(expensePerAsset)
    return {
      date: this.date,
      amount: asset.amount,
      unit: asset.unit,
      receivedFrom: asset.origin,
      capitalIncomeBeforeExpensesEur: totalIncomeEur,
      expensesEur: expensePerAsset,
      capitalIncomeEur: incomeEur
    }
  })
}
