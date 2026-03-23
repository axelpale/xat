const BigNumber = require('big.js')
const unique = require('../utils/unique')

const Casualty = function (
  id,
  date,
  documents,
  offender,
  lostAssets
) {
  // An event for losing the assets due to becoming a victim to fraud or theft.
  //
  // Parameters:
  //   id
  //     an integer
  //   date
  //     a string
  //   documents
  //     an array of strings
  //   offender
  //     a string, the name of the perpetrating person or organization.
  //   lostAssets
  //     an array of Asset.
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
  if (!Array.isArray(documents)) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }
  if (documents.some(d => typeof d !== 'string')) {
    throw new Error('Invalid documents array. Must be an array of strings.')
  }
  if (typeof offender !== 'string' || offender.length < 1) {
    throw new Error('Invalid offender name. Must be a string.')
  }
  if (!Array.isArray(lostAssets)) {
    throw new Error('Invalid assets. Must be an array.')
  }
  if (lostAssets.length < 1) {
    throw new Error('No assets specified. Must have at least one asset.')
  }

  this.id = id
  this.date = date
  this.documents = documents
  this.offender = offender
  this.lostAssets = lostAssets
}

module.exports = Casualty
const proto = Casualty.prototype
proto.type = 'casualty'

proto.getPriceEur = function () {
  // Compute the total price of the lost assets.
  //
  // Return
  //   a BigNumber.
  //

  let total = new BigNumber(0)

  const len = this.lostAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.lostAssets[i]
    total = total.plus(asset.getAcquisitionPriceEur(this.date))
  }

  return total
}

proto.getReportData = function () {
  // Export data for casualty report.
  //
  return this.lostAssets.map(asset => {
    const totalPrice = asset.getAcquisitionPriceEur(this.date)

    // Merge documents. Do not repeat same docs.
    const documents = unique([].concat(this.documents, asset.documents))

    return {
      id: this.id,
      date: this.date,
      documents: documents.join(';'),
      amountLost: asset.amount,
      unit: asset.unit,
      offender: this.offender,
      acquisitionId: asset.acquisitionId,
      acquisitionDate: asset.acquisitionDate,
      acquisitionOrigin: asset.origin,
      acquisitionCostEur: totalPrice
    }
  })
}
