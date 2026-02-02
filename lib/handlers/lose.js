module.exports = function (row, accounts, events) {
  // Loss of assets due to theft or scam does not affect capital gain
  // or ordinary income in Finland.
  //

  // Find the source account.
  const name = row.fromAccount
  const unit = row.sentUnit
  const account = accounts.findAccount(name, unit)
  if (!account) {
    throw new Error('Account not found: ' + name)
  }

  // Remove the lost asset. This ensures the account has enough assets.
  const amount = row.sentAmount
  account.popAssets(amount)
}
