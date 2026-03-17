const BigNumber = require('big.js')

const Airdrop = function (
  date,
  receivedAssets
) {
  // Airdropped income event. Treated as ordinary income in Finland.
  // The assets are valued at the time of receiving.
  // Received assets are subject to ordinary income tax.
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

module.exports = Airdrop
const proto = Airdrop.prototype
proto.type = 'airdrop'

proto.getGainEur = function () {
  // Compute the total value of the assets.
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
