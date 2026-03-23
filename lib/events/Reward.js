const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const Reward = function (
  id,
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
  //   id
  //     an integer
  //   date
  //     a string
  //   receivedAssets
  //     an array of Asset.
  //   expensesEur
  //     a BigNumber
  //
  if (typeof id !== 'number') {
    throw new Error('Invalid row ID for reward. Must be an integer.')
  }
  if (id !== parseInt(id)) {
    throw new Error('Unexpected row ID for reward. Must be an integer.')
  }
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
  this.id = id
  this.date = date
  this.receivedAssets = receivedAssets
  this.receivedUnit = receivedAssets[0].unit
  this.expensesEur = expensesEur
}

module.exports = Reward
const proto = Reward.prototype
proto.type = 'reward'

proto.getIncomeEur = function () {
  // Compute the capital income.
  //
  // Return
  //   a BigNumber.
  //
  let total = ZERO

  const len = this.receivedAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.receivedAssets[i]
    total = total.plus(asset.getAcquisitionPriceEur(this.date))
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
    const incomeEur = asset.getAcquisitionPriceEur(this.date)
    const incomeBeforeExpensesEur = incomeEur.plus(expensePerAsset)
    return {
      id: this.id,
      date: this.date,
      documents: asset.documents.join(';'),
      amount: asset.amount,
      unit: asset.unit,
      receivedFrom: asset.origin,
      capitalIncomeBeforeExpensesEur: incomeBeforeExpensesEur,
      expensesEur: expensePerAsset,
      capitalIncomeEur: incomeEur
    }
  })
}
