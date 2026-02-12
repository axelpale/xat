const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const ONE = new BigNumber(1)
const inRange = require('./inRange')
const inSpread = require('./inSpread')

const ALLOWED_PRICE_SPREAD = new BigNumber('0.02') // two percent
const ALLOWED_PRICE_SPREAD_THRESHOLD = new BigNumber('0.0001') // EUR

module.exports = function (row) {
  // This is a test that the row is well formed and that
  // the row normalization was executed as expected.
  // Throws upon an issue.
  //
  // Parameters:
  //   row
  //     a row object
  //
  // Throws:
  //   if an issue was detected with the row.
  //

  // Check that the date is valid.
  if (typeof row.date !== 'string' || row.date.length < 10) {
    throw new Error('Invalid row date: ' + row.date)
  }

  // Check that the type is valid.
  if (typeof row.type !== 'string' || row.type.length < 2) {
    throw new Error('Invalid row type: ' + row.type)
  }
  if (row.type.toLowerCase().trim() !== row.type) {
    throw new Error('Row type should be in lower case: ' + row.type)
  }

  // Check that prices, if given, are valid numbers.
  if (row.sentUnitPriceEur !== null) {
    if (!(row.sentUnitPriceEur instanceof BigNumber)) {
      throw new Error('Invalid sent unit price.')
    }
  }
  if (row.receivedUnitPriceEur !== null) {
    if (!(row.receivedUnitPriceEur instanceof BigNumber)) {
      throw new Error('Invalid received unit price.')
    }
  }
  if (row.feeUnitPriceEur !== null) {
    if (!(row.feeUnitPriceEur instanceof BigNumber)) {
      throw new Error('Invalid fee unit price.')
    }
  }

  // Check that amounts are given if units are given.
  if (row.sentUnit) {
    if (!(row.sentAmount instanceof BigNumber)) {
      throw new Error('Invalid sent amount.')
    }
    if (row.sentAmount.lt(ZERO)) {
      throw new Error('Unexpected negative sent amount.')
    }
  }
  if (row.receivedUnit) {
    if (!(row.receivedAmount instanceof BigNumber)) {
      throw new Error('Invalid received amount.')
    }
    if (row.receivedAmount.lt(ZERO)) {
      throw new Error('Unexpected negative received amount.')
    }
  }
  if (row.feeUnit) {
    if (!(row.feeAmount instanceof BigNumber)) {
      throw new Error('Invalid fee amount.')
    }
    if (row.feeAmount.lt(ZERO)) {
      throw new Error('Unexpected negative fee amount.')
    }
  }

  // Check that if the units are the same, then the unit price is the same.
  if (row.sentUnit && row.receivedUnit && row.sentUnit === row.receivedUnit) {
    if (row.sentUnitPriceEur && row.receivedUnitPriceEur) {
      const sentUnitPrice = row.sentUnitPriceEur
      const recUnitPrice = row.receivedUnitPriceEur
      if (!sentUnitPrice.eq(recUnitPrice)) {
        throw new Error('Unexpected unit price difference for the same unit.')
      }
    }
  }

  // Check that trades always record the units, amounts, and fees.
  if (row.type === 'trade') {
    if (!row.sentUnit || row.sentUnit.length < 2) {
      throw new Error('Unexpected sent unit for a trade.')
    }
    if (!row.receivedUnit || row.receivedUnit.length < 2) {
      throw new Error('Unexpected received unit for a trade.')
    }
    if (!row.feeUnit || row.feeUnit.length < 2) {
      throw new Error('Unexpected fee unit for a trade.')
    }
    if (!row.sentAmount || !(row.sentAmount instanceof BigNumber)) {
      throw new Error('Unexpected sent amount for a trade.')
    }
    if (!row.receivedAmount || !(row.receivedAmount instanceof BigNumber)) {
      throw new Error('Unexpected received amount for a trade.')
    }
    if (!row.feeAmount || !(row.feeAmount instanceof BigNumber)) {
      throw new Error('Unexpected fee amount for a trade.')
    }
  }

  // Check that values of sent and received roughly match.
  if (row.sentAmount && row.receivedAmount) {
    if (row.sentUnitPriceEur && row.receivedUnitPriceEur) {
      if (row.feeUnit === row.sentUnit) {
        // Fee was taken before transfer.
        const sentValue = row.sentAmount.times(row.sentUnitPriceEur)
        const recValue = row.receivedAmount.times(row.receivedUnitPriceEur)
        // Allowed to differ only within limits.
        if (!inSpread(sentValue, recValue, ALLOWED_PRICE_SPREAD)) {
          // Do not care about tiny values.
          if (sentValue.gt(ALLOWED_PRICE_SPREAD_THRESHOLD) ||
            recValue.gt(ALLOWED_PRICE_SPREAD_THRESHOLD)) {
            throw new Error('Sent and received assets differ too much ' +
              'in value: ' + sentValue.toFixed(2) + ' EUR vs ' +
              recValue.toFixed(2) + ' EUR.')
          }
        }
      } else if (row.feeUnit === row.receivedUnit) {
        // Fee was taken after transfer.
        const sentValue = row.sentAmount.times(row.sentUnitPriceEur)
        const recAmount = row.receivedAmount.plus(row.feeAmount)
        const recValue = recAmount.times(row.receivedUnitPriceEur)
        // Allowed to differ only within limits.
        if (!inSpread(sentValue, recValue, ALLOWED_PRICE_SPREAD)) {
          // Do not care about tiny values
          if (sentValue.gt(ALLOWED_PRICE_SPREAD_THRESHOLD) ||
            recValue.gt(ALLOWED_PRICE_SPREAD_THRESHOLD)) {
            throw new Error('Sent and received assets differ too much ' +
              'in value: ' + sentValue.toFixed(2) + ' EUR vs ' +
              recValue.toFixed(2) + ' EUR.')
          }
        }
      }
    }
  }

  // Check that if the unit is USD, USDT, or USDC, then the EUR price
  // is near 1.
  if (row.sentUnitPriceEur) {
    if (row.sentUnit.startsWith('USD')) {
      if (!inRange(row.sentUnitPriceEur, '0.7', '1.1')) {
        throw new Error('Unexpected sent unit price for a USD-pegged asset.')
      }
    }
  }
  if (row.receivedUnitPriceEur) {
    if (row.receivedUnit.startsWith('USD')) {
      if (!inRange(row.receivedUnitPriceEur, '0.7', '1.1')) {
        throw new Error('Unexpected rec. unit price for a USD-pegged asset.')
      }
    }
  }

  if (row.sentUnit === 'EUR') {
    if (row.sentUnitPriceEur) {
      if (!row.sentUnitPriceEur.eq(ONE)) {
        throw new Error('Unexpected unit price for a sent EUR asset.')
      }
    }
  }

  if (row.receivedUnit === 'EUR') {
    if (row.receivedUnitPriceEur) {
      if (!row.receivedUnitPriceEur.eq(ONE)) {
        throw new Error('Unexpected unit price for a received EUR asset.')
      }
    }
  }

  // all ok
}
