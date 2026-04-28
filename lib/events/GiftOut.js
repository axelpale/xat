const BigNumber = require('big.js')
const unique = require('../utils/unique')

const GiftOut = function (
  id,
  date,
  documents,
  receiver,
  givenAssets,
  giftUnitPriceEur
) {
  // An event for recording which assets were given as a gift.
  //
  // Parameters:
  //   id
  //     an integer
  //   date
  //     a string
  //   documents
  //     an array of strings
  //   receiver
  //     a string, the name of the person receiving the gift.
  //   givenAssets
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
  if (typeof receiver !== 'string' || receiver.length < 1) {
    throw new Error('Invalid receiver name. Must be a string.')
  }
  if (!Array.isArray(givenAssets)) {
    throw new Error('Invalid assets. Must be an array.')
  }
  if (givenAssets.length < 1) {
    throw new Error('No assets specified. Must have at least one asset.')
  }
  if (!(giftUnitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid unit price. Must be a BigNumber.')
  }
  if (giftUnitPriceEur.lt(0)) {
    throw new Error('Unexpected unit price. Must be zero or positive.')
  }

  this.id = id
  this.date = date
  this.documents = documents
  this.receiver = receiver
  this.givenAssets = givenAssets
  this.giftUnitPriceEur = giftUnitPriceEur
}

module.exports = GiftOut
const proto = GiftOut.prototype
proto.type = 'giftout'

proto.getPriceEur = function () {
  // Compute the total acquisition price of the given assets.
  //
  // Return
  //   a BigNumber.
  //

  let total = new BigNumber(0)

  const len = this.givenAssets.length
  for (let i = 0; i < len; i++) {
    const asset = this.givenAssets[i]
    total = total.plus(asset.getAcquisitionPriceEur(this.date))
  }

  return total
}

proto.getReportData = function () {
  // Export data for casualty report.
  //
  return this.givenAssets.map(asset => {
    const acquisitionPrice = asset.getAcquisitionPriceEur(this.date)

    const giftPrice = asset.amount.times(this.giftUnitPriceEur)

    // Merge documents. Do not repeat same docs.
    const documents = unique([].concat(this.documents, asset.documents))

    return {
      id: this.id,
      date: this.date,
      documents: documents.join(';'),
      amountGiven: asset.amount,
      unit: asset.unit,
      giftReceiver: this.receiver,
      giftPriceWhenGivenEur: giftPrice,
      acquisitionId: asset.acquisitionId,
      acquisitionDate: asset.acquisitionDate,
      acquisitionCostEur: acquisitionPrice,
      acquisitionOrigin: asset.origin
    }
  })
}
