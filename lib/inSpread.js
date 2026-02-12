const BigNumber = require('big.js')

module.exports = function (num, expected, spread) {
  // Check if a number is within given spread from the expected number.
  // For example, a spread of 0.02 allows numbers that differ from the
  // expected value by less than or exactly two percent.
  //
  // Parameters
  //   num
  //     a BigNumber
  //   expected
  //     a BigNumber
  //   spread
  //     a BigNumber
  //
  // Return
  //   a boolean
  //
  if (!(num instanceof BigNumber)) {
    num = new BigNumber(num)
  }
  if (!(expected instanceof BigNumber)) {
    expected = new BigNumber(expected)
  }
  if (!(spread instanceof BigNumber)) {
    spread = new BigNumber(spread)
  }

  let margin
  // Pick margin from the number of greatest magnitude.
  if (num.abs().gt(expected.abs())) {
    margin = num.times(spread)
  } else {
    margin = expected.times(spread)
  }

  // Normalize margin
  margin = margin.abs()

  const min = expected.minus(margin)
  const max = expected.plus(margin)

  return num.gte(min) && num.lte(max)
}
