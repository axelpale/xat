const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const Transaction = function (
  row,
  computedSenderBalance,
  computedReceiverBalance
) {
  // A transaction.
  //
  // Parameters:
  //   row
  //     an object
  //   computedSenderBalance
  //     a BigNumber, the computed balance of the sending account after tx.
  //   computedReceiverBalance
  //     a BigNumber, the computed balance of the receiving account after tx.
  //
  if (typeof row !== 'object') {
    throw new Error('Invalid row. Must be an object.')
  }
  if (typeof row.id !== 'number') {
    throw new Error('Unexpected row. Must have an ID.')
  }
  if (typeof row.date !== 'string') {
    throw new Error('Unexpected row. Must have a date.')
  }

  if (row.sentAmount) {
    if (!(computedSenderBalance instanceof BigNumber)) {
      throw new Error('Invalid computed sender balance.')
    }
  }
  if (row.receivedAmount) {
    if (!(computedReceiverBalance instanceof BigNumber)) {
      throw new Error('Invalid computed receiver balance.')
    }
  }

  this.id = row.id
  this.date = row.date // to support find queries in event collection.
  this.row = row
  this.computedSenderBalance = computedSenderBalance
  this.computedReceiverBalance = computedReceiverBalance
}

module.exports = Transaction
const proto = Transaction.prototype
proto.type = 'transaction'

proto.getReportData = function () {
  // Represent the transaction in a plain object suitable for reporting.
  //
  // Return
  //   an array of transaction data objects
  //

  const fromAccount = this.row.fromAccount
  const toAccount = this.row.toAccount
  const sentAmount = this.row.sentAmount
  const sentUnit = this.row.sentUnit
  const sentUnitPrice = this.row.sentUnitPriceEur
  const receivedAmount = this.row.receivedAmount
  const receivedUnit = this.row.receivedUnit
  const receivedUnitPrice = this.row.receivedUnitPriceEur
  const feeAmount = this.row.feeAmount
  const feeUnit = this.row.feeUnit
  const feeUnitPrice = this.row.feeUnitPriceEur

  let sentAmountPreFee = null
  if (fromAccount && sentAmount) {
    if (feeUnit === sentUnit) {
      sentAmountPreFee = sentAmount.plus(feeAmount)
    } else {
      // Fee taken from the received unit or from a third unit.
      sentAmountPreFee = sentAmount
    }
  }

  let receivedAmountPreFee = null
  if (toAccount && receivedAmount) {
    if (feeUnit === receivedUnit && receivedUnit !== sentUnit) {
      receivedAmountPreFee = receivedAmount.plus(feeAmount)
    } else {
      // Fee taken from the sent unit or from a third unit.
      receivedAmountPreFee = receivedAmount
    }
  }

  let volumeEur = ZERO
  if (sentAmountPreFee) {
    // Get volume from sent assets.
    if (feeUnit !== sentUnit && feeUnit !== receivedUnit) {
      // Fee in a third unit
      const priceEur = sentAmount.times(sentUnitPrice)
      const feeEur = feeAmount.times(feeUnitPrice)
      volumeEur = priceEur.plus(feeEur)
    } else {
      volumeEur = sentAmountPreFee.times(sentUnitPrice)
    }
  } else if (receivedAmountPreFee) {
    // Get volume from received assets.
    if (feeUnit !== sentUnit && feeUnit !== receivedUnit) {
      // Fee in a third unit
      const priceEur = receivedAmount.times(receivedUnitPrice)
      const feeEur = feeAmount.times(feeUnitPrice)
      volumeEur = priceEur.plus(feeEur)
    } else {
      volumeEur = receivedAmountPreFee.times(receivedUnitPrice)
    }
  }

  return {
    id: this.row.id,
    date: this.row.date,
    type: this.row.type,
    description: this.row.desc,
    protocol: this.row.protocol,
    // txid: this.row.txid,
    // fromAddress: this.row.fromAddress,
    // toAddress: this.row.toAddress,
    fromAccount: this.row.fromAccount,
    toAccount: this.row.toAccount,
    sentAmountPreFee,
    sentAmountPostFee: this.row.sentAmount,
    sentUnit: this.row.sentUnit,
    receivedAmountPreFee,
    receivedAmountPostFee: this.row.receivedAmount,
    receivedUnit: this.row.receivedUnit,
    feeAccount: this.row.feeAccount,
    feeAmount: this.row.feeAmount,
    feeUnit: this.row.feeUnit,
    volumeEur,
    computedSenderBalance: this.computedSenderBalance,
    knownSenderBalance: this.row.senderBalance,
    computedReceiverBalance: this.computedReceiverBalance,
    knownReceiverBalance: this.row.receiverBalance
  }
}
