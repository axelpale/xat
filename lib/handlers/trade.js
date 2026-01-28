const Asset = require('../Asset')
const Sale = require('../Sale')

module.exports = function (row, accounts, events) {
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

  // remove sent assets from the source account
  const sentAmount = row.sentAmount
  const sentAssets = sourceAccount.popAssets(sentAmount)

  // add capital_gain if applicable
  if (sourceUnit !== 'EUR') {
    const salePrice = sentAmount * row.sentUnitPriceEur
    const saleExpenses = row.feeValueEur
    const sale = new Sale(row.date, sentAssets, salePrice, saleExpenses)
    events.saleEvents.push(sale)
  }

  // add received assets to the target account
  const receivedAsset = Asset.createFromReceived(row)
  targetAccount.pushAsset(receivedAsset)

  // TODO handle capital gain or loss from the fee asset.
}
