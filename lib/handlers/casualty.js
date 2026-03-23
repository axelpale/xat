const Casualty = require('../events/Casualty')
const Transaction = require('../events/Transaction')
const handleFee = require('./fee')

module.exports = function (row, accounts, events) {
  // Casualty is the loss of assets due to theft or scam.
  // Casualty does not affect capital gain or ordinary income in Finland.
  // Assets are considered spent without gain.
  //

  // Find the source account.
  const name = row.fromAccount
  const unit = row.sentUnit
  const account = accounts.findAccount(name, unit)
  if (!account) {
    throw new Error('Account not found: ' + name)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent unit.
  handleFee(row, accounts, events)

  // Remove the lost asset. This ensures the account has enough assets.
  const amount = row.sentAmount
  const lostAssets = account.popAssets(amount)

  // Record a casualty event
  const recordedAssets = lostAssets.map(a => a.copy())
  const ev = new Casualty(
    row.id,
    row.date,
    row.documents,
    row.protocol,
    recordedAssets
  )
  events.pushEvent(ev)

  // Add transaction event.
  const tx = new Transaction(row, account.getBalance(), null)
  events.pushEvent(tx)
}
