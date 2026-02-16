const fs = require('fs')
const csv = require('csv-parser')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
// Avoid scientific notation with small currency amounts.
// NE: negative exponent until exponential notation.
BigNumber.NE = -16

const isValidRawRow = function (raw) {
  if (typeof raw['Date UTC'] !== 'string' || raw['Date UTC'].length < 1) {
    return false
  }

  if (typeof raw.Type !== 'string' || raw.Type.length < 1) {
    return false
  }

  return true
}

const parseNumber = (x, d) => {
  // Fancy parseFloat with default value d.
  //
  // Return
  //   a BigNumber
  //
  let y
  try {
    y = new BigNumber(x)
  } catch (err) {
    return d
  }
  return y
}

const normalizeRawRow = function (raw) {
  let date = ('' + raw['Date UTC']).trim()
  let voucher = ('' + raw.Voucher).trim()
  const type = ('' + raw.Type).trim()
  const desc = ('' + raw.Description).trim()
  const protocol = ('' + raw.Protocol).trim()
  const txid = ('' + raw.ID).trim()
  const fromAddress = ('' + raw['From Address']).trim()
  const toAddress = ('' + raw['To Address']).trim()
  const fromAccount = ('' + raw['From Account']).trim()
  const toAccount = ('' + raw['To Account']).trim()
  const sentAmount = parseNumber(raw.Sent, null)
  const sentUnit = ('' + raw['Sent Unit']).trim().toUpperCase()
  let sentUnitPriceEur = parseNumber(raw['Sent Unit Value EUR'], null)
  const receivedAmount = parseNumber(raw.Received, null)
  const receivedUnit = ('' + raw['Received Unit']).trim().toUpperCase()
  let receivedUnitPriceEur = parseNumber(raw['Received Unit Value EUR'], null)
  let feeAccount = ('' + raw['Fee Account']).trim()
  const feeAmount = parseNumber(raw.Fee, ZERO)
  const feeUnit = ('' + raw['Fee Unit']).trim().toUpperCase()
  let feeUnitPriceEur = parseNumber(raw['Fee Unit Price EUR'], null)
  const exchangeRate = parseNumber(raw['Exchange Rate'], null)
  const exchangeRateUnit = ('' + raw['ExRate Unit']).trim().toUpperCase()
  const rateUsdEur = parseNumber(raw['USD/EUR Exchange Rate'], null)
  const senderBalance = parseNumber(raw['Sender Balance'], null)
  const receiverBalance = parseNumber(raw['Receiver Balance'], null)

  // Normalize datetimes to dates.
  if (date.length > 10) {
    const dateParts = date.split(/[ T_]/)
    date = dateParts[0]
  }

  // Convert vouchers to array.
  if (voucher.length < 1) {
    voucher = []
  } else {
    voucher = voucher.split(/[;:,]/)
  }

  // Fill in implicit data.

  // Copy moved unit price between sent and received.
  if (type === 'move') {
    if (sentUnitPriceEur !== null && receivedUnitPriceEur === null) {
      receivedUnitPriceEur = sentUnitPriceEur
    } else if (receivedUnitPriceEur !== null && sentUnitPriceEur === null) {
      sentUnitPriceEur = receivedUnitPriceEur
    }
  }

  // Derive fee unit price from sent or received asset unit price.
  if (feeUnitPriceEur === null) {
    if (sentUnit !== '' && feeUnit === sentUnit) {
      feeUnitPriceEur = sentUnitPriceEur
    } else if (receivedUnit !== '' && feeUnit === receivedUnit) {
      feeUnitPriceEur = receivedUnitPriceEur
    } else if (feeUnit) {
      // Fee unit does not match sent or received unit.
      console.warn('Cannot determine fee unit price (' + date + ').')
    }
  }

  // Derive fee account from sent or received asset account.
  if (feeAccount === '') {
    if (sentUnit !== '' && feeUnit === sentUnit && fromAccount !== '') {
      feeAccount = fromAccount
    } else if (receivedUnit !== '' && feeUnit === receivedUnit) {
      feeAccount = toAccount
    }
  }

  return {
    date,
    voucher,
    type,
    desc,
    protocol,
    txid,
    fromAddress,
    toAddress,
    fromAccount,
    toAccount,
    sentAmount,
    sentUnit,
    sentUnitPriceEur,
    receivedAmount,
    receivedUnit,
    receivedUnitPriceEur,
    feeAccount,
    feeAmount,
    feeUnit,
    feeUnitPriceEur,
    exchangeRate,
    exchangeRateUnit,
    rateUsdEur,
    senderBalance,
    receiverBalance
  }
}

module.exports = async function (filepath) {
  // Read valid transactional rows from the file.
  // Skip empty lines. Maintain the row order.
  // Normalize column names to camelCase properties.
  //
  // Return
  //   a Promise, resolve an array of normalized rows.
  //
  if (typeof filepath !== 'string') {
    console.warn('Invalid filepath.')
    return []
  }

  return new Promise((resolve, reject) => {
    const rows = []
    let numInvalid = 0

    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (rawrow) => {
        // Each rawrow is an object.
        // Skip empty and malformed.
        if (isValidRawRow(rawrow)) {
          // Simplify the property names.
          const row = normalizeRawRow(rawrow)
          // Collect
          rows.push(row)
        } else {
          numInvalid += 1
          if (rawrow.Description) {
            const d = rawrow.Description
            console.warn('Invalid row with a description: ' + d)
          }
        }
      })
      .on('end', () => {
        console.log('Transaction history CSV file successfully processed.')
        console.log(rows.length + ' transaction rows found.')
        console.log(numInvalid + ' rows skipped.')
        console.log()

        // Resolve
        resolve(rows)
      })
      .on('error', (err) => {
        console.error('Error reading transaction history CSV:', err)

        // Reject
        reject(err)
      })
  })
}
