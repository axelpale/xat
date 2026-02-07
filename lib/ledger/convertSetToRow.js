const BigNumber = require('big.js')
const chalk = require('chalk').default
const pickCommon = require('./pickCommon')
const getRowType = require('./getRowType')
const ZERO = new BigNumber(0)

module.exports = function (refSet) {
  // Convert two or more references into a single row.
  //
  // Parameters:
  //   refSet
  //     an array of ledger rows with the same refid.
  //
  const firstRef = refSet[0]

  const senders = refSet.filter(ref => {
    return ref.amount.lt(0)
  })
  const receivers = refSet.filter(ref => {
    return ref.amount.gte(0)
  })

  if (senders.length < 1) {
    throw new Error('Unexpectedly no sender in a multi-reference set.')
  }
  if (receivers.length < 1) {
    throw new Error('Unexpectedly no receiver in a multi-reference set.')
  }

  const sentUnit = senders.reduce(pickCommon('asset'), null)
  const recUnit = receivers.reduce(pickCommon('asset'), null)

  const sentAmount = senders.reduce((acc, x) => {
    return acc.plus(x.amount)
  }, ZERO).abs()
  const recAmount = receivers.reduce((acc, x) => {
    return acc.plus(x.amount)
  }, ZERO)

  const sentFee = senders.reduce((acc, x) => {
    return acc.plus(x.fee.abs())
  }, ZERO)
  const recFee = receivers.reduce((acc, x) => {
    return acc.plus(x.fee.abs())
  }, ZERO)

  if (sentFee.gt(0) && recFee.gt(0)) {
    console.log(chalk.orange('warning:') + ' multi-unit fee')
  }
  let feeUnit = null
  let feeAmount = null
  if (sentFee.gt(0)) {
    feeUnit = sentUnit
    feeAmount = sentFee
  } else if (recFee.gt(0)) {
    feeUnit = recUnit
    feeAmount = recFee
  } else {
    feeUnit = sentUnit
    feeAmount = ZERO
  }

  // Follow the exchange habit: sent amount already after fee.
  const sentAmountLessFee = sentAmount
  // Received amount before fee by default.
  let recAmountLessFee = recAmount
  if (recFee.gt(0)) {
    recAmountLessFee = recAmount.minus(recFee)
  }

  const senderWallet = senders.reduce(pickCommon('wallet'), null)
  const receiverWallet = receivers.reduce(pickCommon('wallet'), null)
  const senderAccount = `${senderWallet} ${sentUnit}`
  const receiverAccount = `${receiverWallet} ${recUnit}`

  const refType = refSet.reduce(pickCommon('type'), null)
  const refSubType = refSet.reduce(pickCommon('subtype'), null)

  const lastRef = (arr) => arr[arr.length - 1]
  const senderBalance = lastRef(senders).balance
  const receiverBalance = lastRef(receivers).balance

  const rowType = getRowType(refType, refSubType)

  let desc
  if (refSubType) {
    desc = `${refType} ${refSubType} from ${sentUnit} to ${recUnit}`
  } else {
    desc = `${refType} from ${sentUnit} to ${recUnit}`
  }

  return {
    date: firstRef.time,
    voucher: [],
    type: rowType,
    desc,
    protocol: 'Exchange',
    txid: firstRef.txid,
    fromAddress: '',
    toAddress: '',
    fromAccount: senderAccount,
    toAccount: receiverAccount,
    sentAmount: sentAmountLessFee,
    sentUnit,
    receivedAmount: recAmountLessFee,
    receivedUnit: recUnit,
    feeAmount,
    feeUnit,
    feeAccount: null,
    exchangeRate: null,
    exchangeRateUnit: null,
    rateUsdEur: null,
    sentUnitPriceEur: null,
    receivedUnitPriceEur: null,
    feeUnitPriceEur: null,
    senderBalance,
    receiverBalance
  }
}
