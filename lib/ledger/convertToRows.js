const convertSingleToRow = require('./convertSingleToRow')
const convertSetToRow = require('./convertSetToRow')

module.exports = function (ledgerRows) {
  // Process the ledger rows. Chronological order. Connect by reference id.
  //
  // Parameters:
  //   ledgerRows
  //     an array of ledger rows
  //
  // Return
  //   an array of transaction rows.
  //

  // Collect references.
  const referenceOrder = []
  const references = {}
  const len = ledgerRows.length
  for (let i = 0; i < len; i++) {
    const lrow = ledgerRows[i]
    const refid = lrow.refid
    const referenceSet = references[refid]
    if (referenceSet) {
      // Already exists, this is the second or later reference.
      referenceSet.push(lrow)
    } else {
      // First reference. Create a reference set.
      references[refid] = [lrow]
      // Add to the order. The first reference sets the order.
      referenceOrder.push(refid)
    }
  }

  // Arrange the reference sets in chronological order.
  const referenceTimeline = referenceOrder.map(refid => references[refid])

  // Map reference sets to transaction rows.
  const rows = referenceTimeline.map(refSet => {
    const numRefs = refSet.length

    if (numRefs < 1) {
      throw new Error('Unexpected empty reference set.')
    }

    if (numRefs === 1) {
      return convertSingleToRow(refSet[0])
    }

    return convertSetToRow(refSet)
  })

  return rows
}
