module.exports = (rowType, rowSubtype) => {
  // Normalize row type.
  //
  // Parameters:
  //   rowType
  //     a string or null
  //   rowSubtype
  //     a string or null
  //
  // Return
  //   a string
  //
  // Throws
  //   if both the type and subtype are null
  //
  if (rowType) {
    if (rowSubtype) {
      return `${rowType}_${rowSubtype}`
    }
    return `${rowType}`
  }
  if (rowSubtype) {
    return `${rowSubtype}`
  }
  throw new Error('Invalid ledger row type.')
}
