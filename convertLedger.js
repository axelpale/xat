const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const readLedger = require('./lib/readLedger')

const main = async function () {
  const ledgerRows = await readLedger('ledger.csv')

  // Process the ledger rows. Chronological order. Connect by reference id.

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

  // Map to normal rows
  const rows = referenceTimeline.map(refSet => {
    const numRefs = refSet.length
    if (numRefs < 1) {
      throw new Error('Unexpected empty reference set.')
    }
    if (numRefs === 1) {
      const ref = refSet[0]
      const accountName = `${ref.asset} ${ref.wallet}`
      return {
        date: ref.time,
        voucher: [],
        type: '' + ref.type,
        desc: `${ref.type} ${ref.subtype} ${ref.asset} ${ref.wallet}`,
        protocol: 'Exchange',
        txid: ref.txid,
        fromAddress: '',
        toAddress: '',
        fromAccount: '',
        toAccount: accountName,
        sentAmount: null,
        sentUnit: '',
        sentUnitPriceEur: null,
        receivedAmount: ref.amount,
        receivedUnit: ref.asset,
        receivedUnitPriceEur: null,
        feeAccount: accountName,
        feeAmount: ref.fee,
        feeUnit: ref.asset,
        feeUnitValueEur: null,
        exchangeRate: null,
        exchangeRateUnit: null,
        rateUsdEur: null,
        senderBalance: null,
        receiverBalance: ref.balance
      }
    }

    // Two or more
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

    const sentAmount = senders.reduce((acc, x) => acc.plus(x.amount), ZERO)
    const recAmount = receivers.reduce((acc, x) => acc.plus(x.amount), ZERO)

    const pickCommon = (acc, x) => {
      if (!acc) {
        return x.asset
      }
      if (acc === x.asset) {
        return acc
      }
      throw new Error('Unexpected multi-unit assets in a reference set.')
    }
    const sentUnit = senders.reduce(pickCommon, null)
    const recUnit = receivers.reduce(pickCommon, null)
    const lastRef = (arr) => arr[arr.length - 1]
    const senderBalance = lastRef(senders).balance
    const receiverBalance = lastRef(receivers).balance
    return {
      date: firstRef.time,
      voucher: [],
      type: firstRef.type,
      protocol: 'Exchange',
      txid: firstRef.txid,
      fromAddress: '',
      toAddress: '',
      sentAmount,
      sentUnit,
      receivedAmount: recAmount,
      receivedUnit: recUnit,
      feeAmount: null,
      feeUnit: null,
      senderBalance,
      receiverBalance
    }
  })

  console.log(rows)
}

main()
