const BigNumber = require('big.js')

module.exports = function (arr) {
  // Find min and max values of the array.
  //
  // Parameters:
  //   arr
  //     an array of BigNumber
  //
  // Return
  //   { min, max }
  //
  if (arr.length < 1) {
    throw new Error('Cannot find min and max values in an empty array.')
  }

  const barr = arr.map(n => {
    if (typeof n === 'number') {
      return new BigNumber(n)
    }
    if (n instanceof BigNumber) {
      return n
    }
    throw new Error('Invalid array. Must contain only number or BigNumber')
  })

  let min = barr[0]
  let max = barr[0]

  let i, x
  for (i = 1; i < barr.length; i++) {
    x = barr[i]
    if (x.lt(min)) {
      min = x
    }
    if (x.gt(max)) {
      max = x
    }
  }

  return { min, max }
}
