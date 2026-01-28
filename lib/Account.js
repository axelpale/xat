const Account = function (name, unit) {
  // Account is a financial account for a single unit in a single wallet.
  // A wallet can contain multiple accounts.
  //
  // Parameters:
  //   name
  //     a string. The account name identifier.
  //   unit
  //     a string. The account unit. Will be converted to upper case.
  //
  if (typeof name !== 'string') {
    throw new Error('Invalid account name. Must be a string.')
  }
  if (name.length < 1) {
    throw new Error('Unexpected account name string: ' + name)
  }
  if (typeof unit !== 'string') {
    throw new Error('Invalid account unit. Must be a string.')
  }
  if (unit.length < 1) {
    throw new Error('Unexpected account unit string: ' + unit)
  }

  this.name = name
  this.unit = unit.toUpperCase()

  // Order assets the oldest first.
  this.assets = []
}

const proto = Account.prototype
module.exports = Account

proto.getBalance = function () {
  // Compute the current sum of asset amounts.
  //
  // Return
  //   a number, the total amount.
  //
  let amountSum = 0
  const len = this.assets.len
  for (let i = 0; i < len; i++) {
    amountSum += this.assets[i].amount
  }
  return amountSum
}

proto.pushAsset = function (asset) {
  // Add a recent asset.
  //
  if (!asset) {
    throw new Error('Invalid asset object.')
  }
  if (asset.unit !== this.unit) {
    throw new Error('Cannot push an asset of another unit.')
  }
  this.assets.push(asset)
}

proto.popAssets = function (amount) {
  // Take out assets for the given amount.
  // Find oldest available assets, split or remove them and return.
  // Throw error if not enough assets available.
  //
  // Parameters:
  //   amount
  //     a number
  //
  // Return
  //   an array of assets, oldest asset first.
  //
  if (typeof amount !== 'number') {
    throw new Error('Invalid amount (' + amount + '). Must be a number.')
  }
  if (amount <= 0) {
    throw new Error('Unexpected amount (' + amount + '). Must be positive.')
  }

  let amountCollected = 0
  const poppedAssets = []

  // Ensure enough balance.
  const balance = this.getBalance()
  if (balance < amount) {
    throw new Error('Cannot consume asset amount (' + amount + '). ' +
      'Not enough balance (' + balance + ').')
  }

  // Handle in FIFO order, oldest first.
  const len = this.assets.len
  for (let i = 0; i < len && amountCollected < amount; i++) {
    const asset = this.assets[i]
    const amountToCollect = amount - amountCollected
    if (asset.amount > amountToCollect) {
      // Just split.
      const splittedAsset = asset.split(amountToCollect)
      poppedAssets.push(splittedAsset)
      amountCollected += splittedAsset.amount
      // No need to remove the original asset because of the split.
    } else {
      // Asset is not enough for the full amount.
      // Take the asset in full.
      poppedAssets.push(asset)
      amountCollected += asset.amount
      // Mark for removal in the current account without changing
      // the assets array length.
      this.assets[i] = null
    }
  }

  // Remove assets that were taken in full. Maintain order.
  this.assets = this.assets.filter(item => {
    return item !== null
  })

  return poppedAssets
}
