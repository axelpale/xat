const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const unique = require('../utils/unique')

const Transfer = function (
  id,
  date,
  movedAssets,
  unitPriceEur,
  sourceAccount,
  targetAccount,
  documents
) {
  // An internal transfer between accounts.
  // A set of assets are moved from an account to another.
  // This does not trigger the capital gains tax.
  //
  // Parameters:
  //   id
  //     an integer
  //   date
  //     a string
  //   movedAssets
  //     an array of Asset.
  //   sourceAccount
  //     a string, an account name
  //   targetAccount
  //     a string, an account name
  //   documents
  //     an array of strings
  //
  if (typeof id !== 'number') {
    throw new Error('Invalid row ID. Must be an integer.')
  }
  if (id !== parseInt(id)) {
    throw new Error('Unexpected row ID. Must be an integer.')
  }
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid date. Must be a string.')
  }
  if (!Array.isArray(movedAssets)) {
    throw new Error('Invalid moved assets. Must be an array.')
  }
  if (movedAssets.length < 1) {
    throw new Error('No moved assets. Must have at least one asset.')
  }
  const hasSameUnit = movedAssets.every(asset => {
    return asset.unit === movedAssets[0].unit
  })
  if (!hasSameUnit) {
    throw new Error('Unexpected moved assets. Must have identical unit.')
  }
  if (!unitPriceEur || !(unitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid unit price for moved asset. Must be a BigNumber.')
  }
  if (typeof sourceAccount !== 'string' || sourceAccount.length < 1) {
    throw new Error('Invalid source account name. Must be a string.')
  }
  if (typeof targetAccount !== 'string' || targetAccount.length < 1) {
    throw new Error('Invalid target account name. Must be a string.')
  }
  if (!Array.isArray(documents)) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }
  if (documents.some(d => typeof d !== 'string')) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }

  this.id = id
  this.date = date
  this.movedAssets = movedAssets
  this.unitPriceEur = unitPriceEur
  this.sourceAccount = sourceAccount
  this.targetAccount = targetAccount
  this.documents = documents
}

module.exports = Transfer
const proto = Transfer.prototype
proto.type = 'transfer'

proto.getIncomeEur = function () {
  // Compute the capital gain from realizing the fee.
  // Negative value means capital loss.
  //
  // Return
  //   a BigNumber.
  //

  throw new Error('Not yet implemented')
}

proto.getVolumeEur = function () {
  // Get the total price of moved assets in eur at the time of
  // the transaction.
  //
  // Return
  //   a BigNumber
  //
  const totalAmount = this.movedAssets.reduce((acc, x) => {
    return acc.plus(x.amount)
  }, ZERO)

  return totalAmount.times(this.unitPriceEur)
}

proto.getReportData = function () {
  // Get the per-asset transfers. Use this to report which acquisitions
  // were transferred between the accounts.
  //
  // Return
  //   an array of transfer report objects
  //
  return this.movedAssets.map(asset => {
    // Merge documents. Do not repeat same docs.
    const documents = unique([].concat(this.documents, asset.documents))

    // Volume per asset.
    const volume = asset.amount.times(this.unitPriceEur)

    return {
      id: this.id,
      date: this.date,
      documents,
      amount: asset.amount,
      unit: asset.unit,
      sourceAccount: this.sourceAccount,
      targetAccount: this.targetAccount,
      acquisitionId: asset.acquisitionId,
      volumeEur: volume
      // feeAmount: ,
      // feeUnit: ,
      // feeAccount: this.feeAccount,
      // feeEur: ,
    }
  })
}
