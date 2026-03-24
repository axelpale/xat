const handlers = require('../handlers')
const config = require('../readConfig')
const validateRow = require('./validateRow')
const prettyRow = require('./prettyRow')

const FIFO_SCHEME = config.FIFO_SCHEME
const INFO_ROW_TYPES = ['info']

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
    const msg = 'Unexpected computed balance (' + computedBalance.toFixed(8) +
      ' ' + unit + ') in account (' + accountName + '). ' +
      'Recorded balance is (' + knownBalance.toFixed(8) + ' ' +
      unit + '). Difference is (' + diff.toFixed(8) + ' ' +
      unit + ').'

    throw new Error(msg)
  }
}

const checkBalance = function (accounts, row) {
  // If the row has a recorded balance, check the account to ensure.
  //

  // Skip balance checking if global or custom FIFO is used.
  if (FIFO_SCHEME !== 'account') {
    return
  }

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
  // Assumes the rows to be in chronological order, oldest first.
  //
  // Parameters
  //   accounts
  //     an AccountCollection
  //   events
  //     an EventCollection
  //   rows
  //     an array of normalized transaction rows
  //
  // Return
  //   a boolean, isSuccess, true if no errors, false if there was errors.
  //

  // Process rows in chronological order.
  const timeline = rows

  // Track errors.
  let isSuccess = true
  // Track date progression.
  let prevDate = null

  // Handle rows one by one.
  // Handlers modify the accounts and populate events.
  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]

    try {
      // Check that the row is well formed.
      validateRow(row)
    } catch (err) {
      console.warn('WARNING ' + row.date + ': ' + err.message)
    }

    // Check that the date progression matches the processing order.
    // Do not care for the info rows because they are grouped differently.
    if (!INFO_ROW_TYPES.includes(row.type)) {
      if (prevDate) {
        if (prevDate > row.date) {
          console.warn('WARNING ' + row.date + ': Unexpected date order. ' +
            'The date should be later than ' + prevDate)
        }
      }
      // Init or update
      prevDate = row.date
    }

    try {
      if (handlers[row.type]) {
        handlers[row.type](row, accounts, events)
        checkBalance(accounts, row)
      } else {
        console.warn('Unexpected row type: ' + row.type)
      }
    } catch (err) {
      isSuccess = false
      if (config.DISPLAY_ERROR_TRACE) {
        // Full error with trace.
        console.log(row.date, err)
      } else {
        // Prettier, dense error.
        console.log(row.date, 'Error', err.message)
      }
      if (config.DISPLAY_ERROR_ROW) {
        console.log('Row:')
        console.log(prettyRow(row))
      }
      if (config.STOP_AFTER_FIRST_ERROR) {
        break
      }
      // otherwise continue to next row
    }
  }

  return isSuccess
}
