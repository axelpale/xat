const prettyRow = require('../rows/prettyRow')
const dateTimeToSec = require('../utils/dateTimeToSec')
const joinRows = require('./joinRows')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const timeDiffInSeconds = (time0, time1) => {
  const sec0 = dateTimeToSec(time0)
  const sec1 = dateTimeToSec(time1)
  return Math.abs(sec0 - sec1)
}

const isSimilar = (ar, rr) => {
  // Test if rows are similar enough to be joined.
  //

  // Special: spotfromstaking, stakingtospot, stakingfromspot, spottostaking
  if (
    (
      ar.type === 'transfer_spotfromstaking' &&
      rr.type === 'transfer_stakingtospot'
    ) ||
    (
      ar.type === 'transfer_stakingtospot' &&
      rr.type === 'transfer_spotfromstaking'
    ) ||
    (
      ar.type === 'transfer_spottostaking' &&
      rr.type === 'transfer_stakingfromspot'
    ) ||
    (
      ar.type === 'transfer_stakingfromspot' &&
      rr.type === 'transfer_spottostaking'
    )
  ) {
    if (
      (ar.sentAmount.gt(ZERO) && ar.sentAmount.eq(rr.receivedAmount)) ||
      (rr.sentAmount.gt(ZERO) && rr.sentAmount.eq(ar.receivedAmount))
    ) {
      if (
        ar.sentUnit === rr.receivedUnit ||
        rr.sentUnit === ar.receivedUnit
      ) {
        return true
      }
    }
    return false
  }

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
