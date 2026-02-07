const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const getRowType = require('./getRowType')

module.exports = function (ref) {
  // Convert a single ledger row into a transaction row.
  //
  // Parameters:
  //   ref
  //     an object, the ledger row
  //
  // Return
  //   a transaction row
  //
  const accountName = `${ref.wallet} ${ref.asset}`
  const type = getRowType(ref.type, ref.subtype)

  const isSender = ref.amount.lt(0)
  const isReceiver = !isSender

  const amount = isSender ? ref.amount.abs() : ref.amount

  let desc
  if (isSender) {
    desc = `${ref.type} ${ref.subtype} from ${accountName}`
  } else {
    if (ref.subtype) {
      desc = `${ref.type} ${ref.subtype} to ${accountName}`
    } else {
      desc = `${ref.type} to ${accountName}`
    }
  }

  const unit = ref.asset

  if (ref.fee && ref.fee.lt(0)) {
    throw new Error('Unexpected negative fee')
  }

  const feeAmount = ref.fee || ZERO
  const feeUnit = ref.asset

  const amountLessFee = amount.minus(feeAmount)

  return {
    date: ref.time,
    voucher: [],
    type,
    desc,
    protocol: 'Exchange',
    txid: ref.txid,
    fromAddress: '',
    toAddress: '',
    fromAccount: isSender ? accountName : '',
    toAccount: isReceiver ? accountName : '',
    sentAmount: isSender ? amount : null,
    sentUnit: isSender ? unit : '',
    receivedAmount: isReceiver ? amountLessFee : null,
    receivedUnit: isReceiver ? unit : '',
    feeAmount,
    feeUnit,
    feeAccount: '',
    exchangeRate: null,
    exchangeRateUnit: null,
    rateUsdEur: null,
    sentUnitPriceEur: null,
    receivedUnitPriceEur: null,
    feeUnitPriceEur: null,
    senderBalance: isSender ? ref.balance : null,
    receiverBalance: isReceiver ? ref.balance : null
  }
}
