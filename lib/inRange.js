const BigNumber = require('big.js')

module.exports = function (num, min, max) {
  // Test if the number is in the inclusive range [min, max].
  //
  if (!(num instanceof BigNumber)) {
    num = new BigNumber(num)
  }

  // Hard error if happens.
  if (max < min) {
    throw new Error('Unexpected max value smaller than min value.')
  }

  const MIN = new BigNumber(min)
  const MAX = new BigNumber(max)
  return num.gte(MIN) && num.lte(MAX)
}
