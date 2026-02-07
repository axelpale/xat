module.exports = function (arr, columns) {
  // Keep only the object properties listed in columns.
  return arr.map(x => {
    const y = {}
    columns.forEach(c => {
      y[c] = x[c]
    })
    return y
  })
}
