const Asset = require('../Asset')
const Sale = require('../Sale')

const sumAmount = (assets) => {
  return assets.reduce((acc, s) => acc + s.amount, 0)
}

module.exports = function (row, accounts, events) {
  // Move assets from an account to another.
  // This does not trigger capital gain but adds to purchase expenses.
  //

  // Find the source account
  const sourceName = row.fromAccount
  const sourceUnit = row.sentUnit
  const sourceAccount = accounts.findAccount(sourceName, sourceUnit)

  if (!sourceAccount) {
    throw new Error('Account not found: ' + sourceName)
  }

  const feeAmount = row.feeAmount
  const feeUnit = row.feeUnit
  const feePriceEur = row.feeValueEur

  // The fee matures first. No need to mature zero fee or EUR fee.
  if (feeUnit === sourceUnit && feeAmount > 0 && feeUnit !== 'EUR') {
    const feeAssets = sourceAccount.popAssets(feeAmount)

    if (feeAssets.length < 1) {
      throw new Error('Unexpected empty set of fee assets.')
    }

    const feeSale = new Sale(row.date, feeAssets, feePriceEur, 0)
    events.saleEvents.push(feeSale)
  }

  // TODO What if the fee unit is something else, like ETH in
  // ERC-20 token transfers?

  // Remove or slice the sent asset from the source account
  const sentAmount = row.sentAmount
  const sentAssets = sourceAccount.popAssets(sentAmount)

  if (sentAssets.length < 1) {
    throw new Error('Unexpected empty set of sent assets.')
  }

  // Create or find the target account
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Add acquisition cost to the asset that matures next.
  sentAssets[0].addExpenseEur(feePriceEur)

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
