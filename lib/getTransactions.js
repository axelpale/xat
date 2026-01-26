const Transaction = require('./Transaction')

module.exports = function (rows) {
  // Convert rows to transactions.
  //

  // Process rows in chronological order.
  const timeline = rows.toReversed()

  // Collect transactions.
  const txs = []

  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]
    const tx = new Transaction(row)
    txs.push(tx)
  }

  return txs
}
