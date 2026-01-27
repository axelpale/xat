const Account = function (name) {
  this.name = name
  this.assets = []
}

const proto = Account.prototype
module.exports = Account

proto.addAsset = function (asset) {
  // Add a recent asset.
  this.assets.unshift(asset)
}

proto.popAsset = function (name, amount) {
  // Find oldest available assets, remove and return them.
  // Throw error if not enough assets available.
}
