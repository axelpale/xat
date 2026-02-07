const dateTimeToSec = require('./dateTimeToSec')

const joinValue = (ar, rr, prop, separator) => {
  const aval = ar[prop]
  const rval = rr[prop]
  if (aval === rval) {
    return aval
  }
  if (aval && !rval) {
    return aval
  }
  if (!aval && rval) {
    return rval
  }
  // Else join
  return aval + separator + rval
}

const plusOrNull = (n, m) => {
  // Plus two numbers if possible
  if (n && m) {
    return n.plus(m)
  }
  if (n) {
    return n
  }
  if (m) {
    return m
  }
  return null
}

module.exports = (ar, rr) => {
  // Join the rows into one.
  //
  // Parameters:
  //   ar
  //     an object, the previous accumulated row
  //   rr
  //     an object, the row to join
  //
  // Returns
  //   an object, the new joined row
  //

  // Pick the latest time.
  let isLeftLatest = false
  if (dateTimeToSec(ar.date) > dateTimeToSec(rr.date)) {
    isLeftLatest = true
  }

  const date = isLeftLatest ? ar.date : rr.date

  // Join descriptions if not equal.
  const desc = joinValue(ar, rr, 'desc', '; ')
  // Join transaction IDs if not equal.
  const txid = joinValue(ar, rr, 'txid', ';')
  // Join addresses if not equal.
  const fromAddress = joinValue(ar, rr, 'fromAddress', ';')
  const toAddress = joinValue(ar, rr, 'toAddress', ';')
  // Join accounts if not equal (should be equal)
  const fromAccount = joinValue(ar, rr, 'fromAccount', ';')
  const toAccount = joinValue(ar, rr, 'toAccount', ';')
  const feeAccount = joinValue(ar, rr, 'feeAccount', ';')

  // Sum amounts
  const sentAmount = plusOrNull(ar.sentAmount, rr.sentAmount)
  const receivedAmount = plusOrNull(ar.receivedAmount, rr.receivedAmount)
  const feeAmount = plusOrNull(ar.feeAmount, rr.feeAmount)

  // Join units if not equal (should be equal)
  const sentUnit = joinValue(ar, rr, 'sentUnit', ';')
  const receivedUnit = joinValue(ar, rr, 'receivedUnit', ';')
  const feeUnit = joinValue(ar, rr, 'feeUnit', ';')

  // Use most recent balances
  const senderBalance = isLeftLatest ? ar.senderBalance : rr.senderBalance
  const receiverBalance = isLeftLatest ? ar.receiverBalance : rr.receiverBalance

  return {
    date,
    voucher: [].concat(ar.voucher, rr.voucher),
    type: ar.type,
    desc,
    protocol: ar.protocol,
    txid,
    fromAddress,
    toAddress,
    fromAccount,
    toAccount,
    sentAmount,
    sentUnit,
    receivedAmount,
    receivedUnit,
    feeAmount,
    feeUnit,
    feeAccount,
    exchangeRate: null, // TODO
    exchangeRateUnit: null, // TODO
    rateUsdEur: null,
    sentUnitPriceEur: null,
    receivedUnitPriceEur: null,
    feeUnitPriceEur: null,
    senderBalance,
    receiverBalance
  }
}
