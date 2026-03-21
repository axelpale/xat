const handleFee = require('./fee')
const Acquisition = require('../events/Acquisition')
const Transaction = require('../events/Transaction')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const sumAmount = (assets) => {
  // Return
  //   a BigNumber
  //
  return assets.reduce((acc, s) => acc.plus(s.amount), ZERO)
}

module.exports = function (row, accounts, events) {
  // Convert assets from an account to another upon a protocol migration.
  // The unit may change.
  // This does not trigger capital gain but might add to purchase expenses.
  // The original acquisition cost is carried to the new account.
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
  const feeUnitPriceEur = row.feeUnitPriceEur

  let feePriceEur = ZERO
  if (feeUnit && feeAmount.gt(0)) {
    feePriceEur = feeAmount.times(feeUnitPriceEur)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent or received unit.
  handleFee(row, accounts, events)

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
  sentAssets[0].addExpenseEur(row.date, feePriceEur)

  // Ensure the sent amounts match
  const sentAssetAmount = sumAmount(sentAssets)
  if (!sentAmount.eq(sentAssetAmount)) {
    throw new Error('Sent amount does not match assets.')
  }

  // Ensure the sent assets and the received assets match.
  const receivedAmount = row.receivedAmount
  if (!sentAmount.eq(receivedAmount)) {
    throw new Error('Sent and received amounts do not match.')
  }

  // Because of the migration, the unit usually changes.
  // Therefore, copy and discard the sent and update the unit of the copy.
  // Expenses are carreid to the copy by the copy method.
  const receivedAssets = sentAssets.map(x => {
    const y = x.copy()
    y.unit = targetUnit.toUpperCase()
    return y
  })

  // Add received assets to the target account
  targetAccount.pushAssets(receivedAssets)

  // Record acquisition of migrated assets.
  const recordedAssets = receivedAssets.map(x => x.copy())
  const aev = new Acquisition(row.id, row.date, row.type, recordedAssets)
  events.pushEvent(aev)

  // Record a transaction event.
  const tx = new Transaction(
    row,
    sourceAccount.getBalance(),
    targetAccount.getBalance()
  )
  events.pushEvent(tx)
}
