const fs = require('fs')
const BigNumber = require('big.js')
const chalk = require('chalk').default
const ZERO = new BigNumber(0)
const readLedger = require('./lib/readLedger')

const pickCommon = (prop) => {
  // Returns a reducer function that returns the property value
  // that is the same for all objects in the reduced array.
  // Errors if the value is not the same.
  //
  return (acc, x) => {
    if (!acc) {
      return x[prop]
    }
    if (acc === x[prop]) {
      return acc
    }
    throw new Error('Unexpected multi-valued ' + prop + ' property ' +
      'among array elements.')
  }
}

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
    const senderAccount = `Exchange ${senderWallet} ${sentUnit}`
    const receiverAccount = `Exchange ${receiverWallet} ${recUnit}`

    const refType = refSet.reduce(pickCommon('type'), null)
    const lastRef = (arr) => arr[arr.length - 1]

    const senderBalance = lastRef(senders).balance
    const receiverBalance = lastRef(receivers).balance

    const description = `${refType} from ${sentUnit} to ${recUnit}`

    return {
      date: firstRef.time,
      voucher: [],
      type: `${firstRef.type}_${firstRef.subtype}`,
      desc: description,
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
  })

  // Write a CSV file.
  const firstRow = rows[0]
  const columnNames = Object.keys(firstRow)
  const labelLine = columnNames.join(',')
  const pretty = (x) => {
    if (!x) {
      return ''
    }
    if (typeof x === 'string') {
      return '"' + x + '"'
    }
    if (typeof x === 'object') {
      if (x.toFixed) {
        return x.toFixed(8)
      }
      if (x.toString) {
        return '"' + x.toString() + '"'
      }
    }
    if (typeof x === 'number') {
      return x.toFixed(8)
    }
    return ''
  }
  const reversedRows = rows.toReversed()
  const fileString = reversedRows.reduce((acc, r) => {
    return acc + columnNames.map(k => pretty(r[k])).join(',') + '\n'
  }, labelLine + '\n')
  fs.writeFileSync('ledger-history.csv', fileString)
}

main()
