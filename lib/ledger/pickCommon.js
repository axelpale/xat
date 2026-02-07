module.exports = (prop) => {
  // Returns a reducer function that returns the property value
  // that is the same for all objects in the reduced array.
  // Errors if the value is not the same.
  //
  return (acc, x) => {
    if (!acc) {
      return x[prop]
    }
    if (acc === x[prop]) {
      return acc
    }
    throw new Error('Unexpected multi-valued ' + prop + ' property ' +
      'among array elements.')
  }
}
