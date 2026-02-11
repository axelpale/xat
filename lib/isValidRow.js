const BigNumber = require('big.js')
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
  if (typeof row.date !== 'string' || row.date.length < 10) {
    return false
  }

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

  // Check that if units are the same, then the unit price is the same.
  if (row.sentUnit && row.receivedUnit && row.sentUnit === row.receivedUnit) {
    if (row.sentUnitPriceEur && row.receivedUnitPriceEur) {
      const sentUnitPrice = row.sentUnitPriceEur
      const recUnitPrice = row.receivedUnitPriceEur
      if (!sentUnitPrice.eq(recUnitPrice)) {
        return false
      }
    }
  }

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

  return true
}
