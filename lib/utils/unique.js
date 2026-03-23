module.exports = function (arr) {
  // Keep only unique elements of the array.
  //
  // Parameters:
  //   arr
  //     an array
  //
  // Return
  //   an array
  //

  const result = []

  let i, x
  for (i = 0; i < arr.length; i++) {
    x = arr[i]
    if (!result.includes(x)) {
      result.push(x)
    }
  }

  return result
}
