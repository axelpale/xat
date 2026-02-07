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
  const accountName = `${ref.asset} ${ref.wallet}`
  return {
    date: ref.time,
    voucher: [],
    type: `${ref.type}_${ref.subtype}`,
    desc: `${ref.type} ${ref.subtype} ${ref.asset} ${ref.wallet}`,
    protocol: 'Exchange',
    txid: ref.txid,
    fromAddress: '',
    toAddress: '',
    fromAccount: '',
    toAccount: accountName,
    sentAmount: null,
    sentUnit: '',
    receivedAmount: ref.amount,
    receivedUnit: ref.asset,
    feeAmount: ref.fee,
    feeUnit: ref.asset,
    feeAccount: accountName,
    exchangeRate: null,
    exchangeRateUnit: null,
    rateUsdEur: null,
    sentUnitPriceEur: null,
    receivedUnitPriceEur: null,
    feeUnitPriceEur: null,
    senderBalance: null,
    receiverBalance: ref.balance
  }
}
