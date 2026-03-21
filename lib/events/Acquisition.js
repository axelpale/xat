const Acquisition = function (
  id,
  date,
  acquisitionMethod,
  receivedAssets
) {
  // Acquisition happens when an asset is received regardless of how.
  // The event records the date, amount, and origin of the asset.
  //
  // Parameters:
  //   id
  //     an integer
  //   date
  //     a string
  //   acquisitionMethod
  //     a string, the acquisition method (row type)
  //   receivedAssets
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
  if (!acquisitionMethod || typeof acquisitionMethod !== 'string') {
    throw new Error('Invalid acquisition method. Must be a string.')
  }
  if (!Array.isArray(receivedAssets)) {
    throw new Error('Invalid received assets. Must be an array.')
  }
  if (receivedAssets.length < 1) {
    throw new Error('No assets received. Must have at least one asset.')
  }

  this.id = id
  this.date = date
  this.acquisitionMethod = acquisitionMethod
  this.receivedAssets = receivedAssets
}

module.exports = Acquisition
const proto = Acquisition.prototype
proto.type = 'acquisition'

proto.getReportData = function () {
  // Export data for tax report.
  //
  return this.receivedAssets.map(asset => {
    return {
      id: this.id,
      date: this.date,
      amount: asset.amount,
      unit: asset.unit,
      origin: asset.origin,
      acquisitionMethod: this.acquisitionMethod
    }
  })
}
