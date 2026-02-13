const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const ONE = new BigNumber(1)
const inRange = require('./inRange')
const inSpread = require('./inSpread')
const prices = require('./prices')

// Set how much the recorded unit price can differ from a historical price.
const UNIT_PRICE_TOLERANCE = new BigNumber('0.10') // 0.01 = one percent

// Set how much sent and received assets can differ in price.
const ALLOWED_PRICE_SPREAD = new BigNumber('0.02') // 0.01 = one percent
const ALLOWED_PRICE_SPREAD_THRESHOLD = new BigNumber('0.0001') // EUR

// Check fee to asset ratio is not too large.
const MAX_FEE_RATIOS = {
  trade: new BigNumber('0.05'), // 0.01 = one percent
  move: new BigNumber('0.08'),
  reward: new BigNumber('0.32'),
  payment_out: new BigNumber('0.08')
}
// Minimum fee price to do the ratio check.
const MAX_FEE_RATIO_THRESHOLDS = {
  trade: new BigNumber('2.00'), // EUR
  move: new BigNumber('2.00'),
  reward: new BigNumber('0.00'),
  payment_out: new BigNumber('3.00')
}

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

  // Check that fee price is sane.
  if (row.feeAmount && row.feeUnitPriceEur && MAX_FEE_RATIOS[row.type]) {
    // Find the asset price for reference.
    let assetPrice = null
    if (row.sentAmount && row.sentUnitPriceEur) {
      assetPrice = row.sentAmount.times(row.sentUnitPriceEur)
    } else if (row.receivedAmount && row.receivedUnitPriceEur) {
      if (row.feeUnit === row.receivedUnit && row.feeUnit !== row.sentUnit) {
        const totalAmount = row.receivedAmount.plus(row.feeAmount)
        assetPrice = totalAmount.times(row.receivedUnitPriceEur)
      } else {
        assetPrice = row.receivedAmount.times(row.receivedUnitPriceEur)
      }
    }
    // Check that fee price is a fraction of the asset price.
    if (assetPrice) {
      const feePrice = row.feeAmount.times(row.feeUnitPriceEur)
      const maxFeeRatio = MAX_FEE_RATIOS[row.type]
      const minFeePriceToCare = MAX_FEE_RATIO_THRESHOLDS[row.type]
      const maxFeePrice = assetPrice.times(maxFeeRatio)
      if (feePrice.gt(maxFeePrice)) {
        // Do not care about tiny fees of large ratio.
        if (feePrice.gt(minFeePriceToCare)) {
          const feeRatio = feePrice.div(assetPrice).times(100).round()
          throw new Error('Suspiciously large fee: ' +
            feeRatio + '% of the asset price.')
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

  // Check that the unit price is near the known unit prices.
  if (row.sentUnit && row.sentUnitPriceEur) {
    const ledgerUnitPrice = row.sentUnitPriceEur
    const apiUnitPrice = prices.getPriceEur(row.sentUnit, row.date)
    if (apiUnitPrice) {
      if (!inSpread(ledgerUnitPrice, apiUnitPrice, UNIT_PRICE_TOLERANCE)) {
        throw new Error('Sent unit price differs from ' +
          'the historical ' + row.sentUnit + ' price too much: ' +
          ledgerUnitPrice.toFixed(2) + ' EUR vs ' +
          apiUnitPrice.toFixed(2) + ' EUR.')
      }
    }
  }
  if (row.receivedUnit && row.receivedUnitPriceEur) {
    const ledgerUnitPrice = row.receivedUnitPriceEur
    const apiUnitPrice = prices.getPriceEur(row.receivedUnit, row.date)
    if (apiUnitPrice) {
      if (!inSpread(ledgerUnitPrice, apiUnitPrice, UNIT_PRICE_TOLERANCE)) {
        throw new Error('Received unit price differs from ' +
          'the historical ' + row.receivedUnit + ' price too much: ' +
          ledgerUnitPrice.toFixed(2) + ' EUR vs ' +
          apiUnitPrice.toFixed(2) + ' EUR.')
      }
    }
  }

  // all ok
}
