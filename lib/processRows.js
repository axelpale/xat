const handlers = require('./handlers')

module.exports = function (accounts, rows) {
  // Convert rows to accounts, assets, income, gains, and losses.
  // Modifies the given account collection.
  //
  // Parameters
  //   accounts
  //     an AccountCollection
  //   rows
  //     an array of normalized transaction rows
  //
  // Return
  //   events
  //

  // Process rows in chronological order.
  const timeline = rows.toReversed()

  // Collect financial events. Separate by type and tax consequences.
  const events = {
    incomeEvents: [],
    giftInEvents: [],
    giftOutEvents: [],
    saleEvents: []
  }

  // Handle rows one by one.
  // Handlers modify the accounts and populate events.
  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]

    try {
      if (handlers[row.type]) {
        handlers[row.type](row, accounts, events)
      } else {
        console.warn('Unexpected row type: ' + row.type)
      }
    } catch (err) {
      console.warn('WARNING: ' + err.message)
      console.log(row)
      break
      // TODO continue to next row
    }
  }

  return events
}
