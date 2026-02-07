const prettyRow = require('../prettyRow')

const dateTimeToSec = (time) => {
  const msFromEpoch = (new Date(time)).getTime()
  return Math.floor(msFromEpoch / 1000)
}

const timeDiffInSeconds = (time0, time1) => {
  const sec0 = dateTimeToSec(time0)
  const sec1 = dateTimeToSec(time1)
  return Math.abs(sec0 - sec1)
}

const isSimilar = (ar, rr) => {
  // Test if rows are similar enough to be joined.
  //

  // Are same type?
  if (ar.type.trim() !== rr.type.trim()) {
    return false
  }

  // Are allowed type?
  const unjoinableTypes = ['deposit', 'withdrawal']
  if (unjoinableTypes.includes(ar.type)) {
    return false
  }

  // Are same protocol?
  if (ar.protocol !== rr.protocol) {
    return false
  }

  // Are accounts the same?
  if (ar.fromAccount !== rr.fromAccount) {
    return false
  }
  if (ar.toAccount !== rr.toAccount) {
    return false
  }

  // Are units the same (should be if accounts the same)
  if (ar.sentUnit !== rr.sentUnit) {
    return false
  }
  if (ar.receivedUnit !== rr.receivedUnit) {
    return false
  }

  // Is the fee unit the same?
  if (ar.feeUnit !== rr.feeUnit) {
    return false
  }

  // Are close enough in time?
  const dsec = timeDiffInSeconds(ar.date, rr.date)
  if (dsec > 10 * 60) {
    return false
  }

  // Close enough
  return true
}

const joinValue = (ar, rr, prop, separator) => {
  const aval = ar[prop]
  const rval = rr[prop]
  if (aval === rval) {
    return aval
  }
  // Else join
  return aval + separator + rval
}

const joinRows = (ar, rr) => {
  // Join the rows into one.
  //
  // Parameters:
  //   ar
  //     an object, the previous accumulated row
  //   rr
  //     an object, the row to join
  //
  // Returns
  //   an object, the new joined row
  //

  // Pick the latest time.
  let isLeftLatest = false
  if (dateTimeToSec(ar.date) > dateTimeToSec(rr.date)) {
    isLeftLatest = true
  }

  const date = isLeftLatest ? ar.date : rr.date

  // Join descriptions if not equal.
  const desc = joinValue(ar, rr, 'desc', '; ')
  // Join transaction IDs if not equal.
  const txid = joinValue(ar, rr, 'txid', ';')
  // Join addresses if not equal.
  const fromAddress = joinValue(ar, rr, 'fromAddress', ';')
  const toAddress = joinValue(ar, rr, 'toAddress', ';')
  // Join accounts if not equal (should be equal)
  const fromAccount = joinValue(ar, rr, 'fromAccount', ';')
  const toAccount = joinValue(ar, rr, 'toAccount', ';')
  const feeAccount = joinValue(ar, rr, 'feeAccount', ';')

  // Sum amounts
  const sentAmount = ar.sentAmount.plus(rr.sentAmount)
  const receivedAmount = ar.receivedAmount.plus(rr.receivedAmount)
  const feeAmount = ar.feeAmount.plus(rr.feeAmount)

  // Join units if not equal (should be equal)
  const sentUnit = joinValue(ar, rr, 'sentUnit', ';')
  const receivedUnit = joinValue(ar, rr, 'receivedUnit', ';')
  const feeUnit = joinValue(ar, rr, 'feeUnit', ';')

  // Use most recent balances
  const senderBalance = isLeftLatest ? ar.senderBalance : rr.senderBalance
  const receiverBalance = isLeftLatest ? ar.receiverBalance : rr.receiverBalance

  return {
    date,
    voucher: [].concat(ar.voucher, rr.voucher),
    type: ar.type,
    desc,
    protocol: ar.protocol,
    txid,
    fromAddress,
    toAddress,
    fromAccount,
    toAccount,
    sentAmount,
    sentUnit,
    receivedAmount,
    receivedUnit,
    feeAmount,
    feeUnit,
    feeAccount,
    exchangeRate: null, // TODO
    exchangeRateUnit: null, // TODO
    rateUsdEur: null,
    sentUnitPriceEur: null,
    receivedUnitPriceEur: null,
    feeUnitPriceEur: null,
    senderBalance,
    receiverBalance
  }
}

module.exports = function (rows) {
  // Join rows that look like they result from a single decision.
  //
  // Parameters:
  //   rows
  //     an array of rows, oldest first.
  //
  // Return:
  //   an array of joined rows.
  //

  const denseRows = []
  const len = rows.length
  let i, row
  let accRow = null

  for (i = 0; i < len; i++) {
    row = rows[i]
    if (!accRow) {
      // Init
      accRow = row
      continue
    }

    try {
      if (isSimilar(accRow, row)) {
        accRow = joinRows(accRow, row)
      } else {
        // Not similar. Flush the accumulated.
        denseRows.push(accRow)
        accRow = row
      }
    } catch (err) {
      console.log(err)
      console.log('Row:')
      console.log(prettyRow(row))
      break
    }
  }

  // Flush the last if any.
  if (accRow) {
    denseRows.push(accRow)
  }

  return denseRows
}
