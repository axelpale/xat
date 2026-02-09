const convertSingleToRow = require('./convertSingleToRow')
const convertSetToRow = require('./convertSetToRow')
const isJoinableSet = require('./isJoinableSet')
const prettyRow = require('../prettyRow')
const getRowType = require('./getRowType')

module.exports = function (ledgerRows) {
  // Process the ledger rows. Chronological order.
  // Group by reference id and type.
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
    const lrowType = getRowType(lrow.type, lrow.subtype)
    const setId = lrow.refid + '_' + lrowType
    const referenceSet = references[setId]
    if (referenceSet) {
      // Already exists, this is the second or later member of the reference.
      referenceSet.push(lrow)
    } else {
      // First reference. Create a reference set.
      references[setId] = [lrow]
      // Add to the order. The first reference sets the order.
      referenceOrder.push(setId)
    }
  }

  // Arrange the reference sets in chronological order.
  const referenceTimeline = referenceOrder.map(setId => references[setId])

  // Map reference sets to transaction rows.
  const rows = []

  referenceTimeline.forEach(refSet => {
    const numRefs = refSet.length

    if (numRefs < 1) {
      throw new Error('Unexpected empty reference set.')
    }

    try {
      // Find if the set needs multiple rows.
      const isJoinable = isJoinableSet(refSet)

      if (isJoinable && numRefs > 1) {
        // Join
        const row = convertSetToRow(refSet)
        rows.push(row)
      } else {
        // Keep single
        refSet.forEach(lrow => {
          const row = convertSingleToRow(lrow)
          rows.push(row)
        })
      }
    } catch (err) {
      console.log('Problematic row set:')
      refSet.forEach(row => {
        console.log(prettyRow(row))
      })
      throw err
    }
  })

  return rows
}
