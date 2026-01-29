const BigNumber = require('big.js')
const handlers = require('./handlers')

const prettyRow = function (row) {
  // Print row in human-readable format.
  //
  let str = '{\n'

  const keys = Object.keys(row)
  const len = keys.length
  for (let i = 0; i < len; i++) {
    const key = keys[i]
    const val = row[key]
    str += '  ' + key + ': '
    if (typeof val === 'string') {
      str += val
    } else if (val instanceof BigNumber) {
      str += val.toFixed(8)
    } else {
      str += val
    }

    if (i + 1 < len) {
      str += ','
    }
    str += '\n'
  }

  str += '}'

  return str
}

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
      console.log(err)
      console.log('Row:')
      console.log(prettyRow(row))
      break
      // TODO continue to next row
    }
  }

  return events
}
