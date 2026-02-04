const BigNumber = require('big.js')
const handlers = require('./handlers')
const config = require('./readConfig')

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
      str += '\'' + val + '\''
    } else if (val instanceof BigNumber) {
      str += val.toFixed(8)
    } else if (Array.isArray(val)) {
      str += '[' + val.join(', ') + ']'
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

const diffBalance = function (accounts, accountName, unit, knownBalance) {
  // Check account balance
  const account = accounts.findAccount(accountName, unit)

  if (!account) {
    throw new Error('Cannot check balance of ' +
      'a missing account (' + accountName + ').')
  }

  const computedBalance = account.getBalance()
  const diff = computedBalance.minus(knownBalance).abs()

  if (diff.gt(config.BALANCE_CHECK_ERROR_MARGIN)) {
    const msg = 'Unexpected balance (' + computedBalance.toFixed(8) + ' ' +
      unit + ') in account (' + accountName + '). ' +
      'Recorded balance is (' + knownBalance.toFixed(8) + ' ' +
      unit + '). Difference is (' + diff.toFixed(8) + ' ' +
      unit + ').'

    throw new Error(msg)
  }
}

const checkBalance = function (accounts, row) {
  // If the row has a recorded balance, check the account to ensure.
  //

  if (row.senderBalance) {
    const sourceName = row.fromAccount
    const sourceUnit = row.sentUnit
    diffBalance(accounts, sourceName, sourceUnit, row.senderBalance)
  }

  if (row.receiverBalance) {
    const targetName = row.toAccount
    const targetUnit = row.receivedUnit
    diffBalance(accounts, targetName, targetUnit, row.receiverBalance)
  }
}

module.exports = function (accounts, events, rows) {
  // Convert rows to accounts, assets, income, gains, and losses.
  // Modifies the given account and event collections.
  //
  // Parameters
  //   accounts
  //     an AccountCollection
  //   events
  //     an EventCollection
  //   rows
  //     an array of normalized transaction rows
  //

  // Process rows in chronological order.
  const timeline = rows.toReversed()

  // Handle rows one by one.
  // Handlers modify the accounts and populate events.
  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]

    try {
      if (handlers[row.type]) {
        handlers[row.type](row, accounts, events)
        checkBalance(accounts, row)
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
}
