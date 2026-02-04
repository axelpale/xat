const fs = require('fs')
const csv = require('csv-parser')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const isValidRawRow = function (raw) {
  if (typeof raw.Date !== 'string' || raw.Date.length < 1) {
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
  const date = ('' + raw.Date).trim()
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
  let feeUnitValueEur = parseNumber(raw['Fee Unit Value EUR'], null)
  const feeValueEur = parseNumber(raw['Fee Value EUR'], ZERO)
  const exchangeRate = parseNumber(raw['Exchange Rate'], null)
  const exchangeRateUnit = ('' + raw['ExRate Unit']).trim().toUpperCase()
  const rateUsdEur = parseNumber(raw['ExRate USDEUR'], null)
  const knownBalance = parseNumber(raw['Known Balance After Transaction'], null)
  const knownBalanceUnit = parseNumber(raw['Balance Unit'], null)

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
  if (feeUnitValueEur === null) {
    if (sentUnit !== '' && feeUnit === sentUnit) {
      feeUnitValueEur = sentUnitPriceEur
    } else if (receivedUnit !== '' && feeUnit === receivedUnit) {
      feeUnitValueEur = receivedUnitPriceEur
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
    feeUnitValueEur,
    feeValueEur,
    exchangeRate,
    exchangeRateUnit,
    rateUsdEur,
    knownBalance,
    knownBalanceUnit
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
        console.log('CSV file successfully processed.')
        console.log(rows.length + ' rows found.')
        console.log(numInvalid + ' invalid rows found.')
        console.log()

        // Resolve
        resolve(rows)
      })
      .on('error', (err) => {
        console.error('Error reading CSV:', err)

        // Reject
        reject(err)
      })
  })
}
