const Asset = require('../Asset')

const sumAmount = (assets) => {
  return assets.reduce((acc, s) => acc + s.amount, 0)
}

module.exports = function (row, accounts, events) {
  // Move assets from an account to another.
  // This does not trigger capital gain but adds to purchase expenses.
  //

  // find the source account
  const sourceName = row.fromAccount
  const sourceUnit = row.sentUnit
  const sourceAccount = accounts.findAccount(sourceName, sourceUnit)

  if (!sourceAccount) {
    throw new Error('Account not found: ' + sourceName)
  }

  // create or find the target account
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // remove or slice asset from the source account
  const sentAmount = row.sentAmount
  const sentAssets = sourceAccount.popAssets(sentAmount)

  if (sentAssets.length < 1) {
    throw new Error('Unexpected empty set of sent assets.')
  }

  // add acquisition cost to the asset that matures next.
  sentAssets[0].addExpenseEur(row.feeValueEur)

  // TODO fee shard: take the fee from where?
  // fee matures thus triggers capital gain
  // TODO events.saleEvents.push(sale)

  // ensure the sent amounts match
  const sentAssetAmount = sumAmount(sentAssets)
  if (sentAmount !== sentAssetAmount) {
    throw new Error('Sent amount does not match assets.')
  }

  // ensure the sent assets and the received assets match.
  const receivedAsset = Asset.createFromReceived(row)
  if (sentAmount !== receivedAsset.amount) {
    throw new Error('Sent and received amounts do not match.')
  }

  // add sent assets to the target account
  targetAccount.pushAssets(sentAssets)
}
