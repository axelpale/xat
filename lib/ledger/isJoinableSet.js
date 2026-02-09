const isUniform = (arr) => {
  if (arr.length < 2) {
    return true
  }
  const first = arr[0]
  return arr.every(x => x === first)
}

module.exports = function (refSet) {
  // Test if either side has more than one asset unit.
  // If no, we cannot join the rows.
  //
  // Return
  //   a boolean
  //     true if the rows can be joined.
  //     false if not enough rows to join or the rows cannot be joined
  //
  if (!refSet) {
    throw new Error('Invalid reference set of ledger rows.')
  }

  if (refSet.length < 2) {
    return false
  }

  const senderUnits = []
  const receiverUnits = []

  refSet.forEach(lrow => {
    const isSender = lrow.amount.lt(0)
    const isReceiver = lrow.amount.gte(0)

    if (isSender) {
      senderUnits.push(lrow.asset)
    }
    if (isReceiver) {
      receiverUnits.push(lrow.asset)
    }
  })

  if (senderUnits.length > 0 && !isUniform(senderUnits)) {
    return false
  }

  if (receiverUnits.length > 0 && !isUniform(receiverUnits)) {
    return false
  }

  return true
}
