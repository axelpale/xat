const handleFee = require('./fee')

module.exports = function (row, accounts, events) {
  // Handle sending a gift that consists of assets.
  // Given gifts are not subject to capital gain tax of the sender.
  // Sending a gift does not trigger any tax for the sender in Finland.
  // The receiver must pay gift tax if the amount exceeds 7500 EUR within
  // three years. The receiver must pay capital gain tax upon selling the
  // asset. The acquisition price is the original acquisition price of
  // the sender if the receiver sells the asset within one year from
  // the reception date. If the receiver sells the asset later,
  // the effective acquistion price is the price at the moment of reception.
  //
  // Source: Tuloverolaki 47 § (1 mom)
  //

  // Find source account
  const name = row.fromAccount
  const unit = row.sentUnit
  const account = accounts.findAccount(name, unit)
  if (!account) {
    throw new Error('Account not found: ' + name)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent or received unit.
  handleFee(row, accounts, events)

  // Remove asset to ensure there is enough balance.
  const amount = row.sentAmount
  account.popAssets(amount)
}
