const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const ONE = new BigNumber(1)
const inRange = require('./inRange')

module.exports = function (row) {
  // This is a test that the row is well formed and that
  // the row normalization was executed as expected.
  //
  // Parameters:
  //   row
  //     a row object
  //
  // Return
  //   a boolean
  //

  // Check that the date is valid.
  if (typeof row.date !== 'string' || row.date.length < 10) {
    return false
  }

  // Check that the type is valid.
  if (typeof row.type !== 'string' || row.type.length < 2) {
    return false
  }
  if (row.type.toLowerCase().trim() !== row.type) {
    return false
  }

  // Check that prices, if given, are valid numbers.
  if (row.sentUnitPriceEur !== null) {
    if (!(row.sentUnitPriceEur instanceof BigNumber)) {
      return false
    }
  }
  if (row.receivedUnitPriceEur !== null) {
    if (!(row.receivedUnitPriceEur instanceof BigNumber)) {
      return false
    }
  }
  if (row.feeUnitPriceEur !== null) {
    if (!(row.feeUnitPriceEur instanceof BigNumber)) {
      return false
    }
  }

  // Check that amounts are given if units are given.
  if (row.sentUnit) {
    if (!(row.sentAmount instanceof BigNumber)) {
      return false
    }
    if (row.sentAmount.lt(ZERO)) {
      return false
    }
  }
  if (row.receivedUnit) {
    if (!(row.receivedAmount instanceof BigNumber)) {
      return false
    }
    if (row.receivedAmount.lt(ZERO)) {
      return false
    }
  }

  // Check that if the units are the same, then the unit price is the same.
  if (row.sentUnit && row.receivedUnit && row.sentUnit === row.receivedUnit) {
    if (row.sentUnitPriceEur && row.receivedUnitPriceEur) {
      const sentUnitPrice = row.sentUnitPriceEur
      const recUnitPrice = row.receivedUnitPriceEur
      if (!sentUnitPrice.eq(recUnitPrice)) {
        return false
      }
    }
  }

  // Check that trades always record the units, amounts, and fees.
  if (row.type === 'trade') {
    if (!row.sentUnit || row.sentUnit.length < 2) {
      return false
    }
    if (!row.receivedUnit || row.receivedUnit.length < 2) {
      return false
    }
    if (!row.feeUnit || row.feeUnit.length < 2) {
      return false
    }
    if (!row.sentAmount || !(row.sentAmount instanceof BigNumber)) {
      return false
    }
    if (!row.receivedAmount || !(row.receivedAmount instanceof BigNumber)) {
      return false
    }
    if (!row.feeAmount || !(row.feeAmount instanceof BigNumber)) {
      return false
    }
  }

  // TODO Check that values of sent and received roughly match.

  // Check that if the unit is USD, USDT, or USDC, then the EUR price
  // is near 1.
  if (row.sentUnitPriceEur) {
    if (row.sentUnit.startsWith('USD')) {
      if (!inRange(row.sentUnitPriceEur, '0.7', '1.1')) {
        return false
      }
    }
  }
  if (row.receivedUnitPriceEur) {
    if (row.receivedUnit.startsWith('USD')) {
      if (!inRange(row.receivedUnitPriceEur, '0.7', '1.1')) {
        return false
      }
    }
  }

  if (row.sentUnit === 'EUR') {
    if (row.sentUnitPriceEur) {
      if (!row.sentUnitPriceEur.eq(ONE)) {
        return false
      }
    }
  }

  if (row.receivedUnit === 'EUR') {
    if (row.receivedUnitPriceEur) {
      if (!row.receivedUnitPriceEur.eq(ONE)) {
        return false
      }
    }
  }

  return true
}
