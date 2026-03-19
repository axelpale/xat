const getYearFromDateTime = require('../utils/getYearFromDateTime')

module.exports = (rows) => {
  // Split rows into annual batches.
  //
  // Parameters:
  //   rows
  //     an array of row objects
  //
  // Return:
  //   an array of array of row objects
  //
  const batches = []
  let batch = []
  let year = 0

  rows.forEach(row => {
    const rowYear = getYearFromDateTime(row.date)

    if (rowYear !== year) {
      // Different year than previously.
      // Commit the old batch if any.
      if (batch.length > 0) {
        batches.push(batch)
      }
      // Init the batch.
      batch = [row]
      year = rowYear
    } else {
      // Same year. Just add to the batch.
      batch.push(row)
    }
  })

  // Finish the last batch.
  if (batch.length > 0) {
    batches.push(batch)
    batch = null
  }

  return batches
}
