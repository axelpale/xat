const fs = require('fs')
const csv = require('csv-parser')

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
  const y = parseFloat(x)
  if (isNaN(y)) {
    return d
  }
  return y
}

const normalizeRawRow = function (raw) {
  const date = ('' + raw.Date).trim()
  const voucher = raw.Voucher.trim()
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
  const feeAmount = parseNumber(raw.Fee, null)
  const feeUnit = ('' + raw['Fee Unit']).trim().toUpperCase()
  const feeValueEur = parseNumber(raw['Fee Value EUR'], 0)
  const exchangeRate = parseNumber(raw['Exchange Rate'], null)
  const exchangeRateUnit = ('' + raw['ExRate Unit']).trim().toUpperCase()
  const rateUsdEur = parseNumber(raw['ExRate USDEUR'], null)

  // Fill in implicit data.
  // Copy moved unit price between sent and received.
  if (type === 'move') {
    if (sentUnitPriceEur !== null && !receivedUnitPriceEur) {
      receivedUnitPriceEur = sentUnitPriceEur
    } else if (receivedUnitPriceEur !== null && !sentUnitPriceEur) {
      sentUnitPriceEur = receivedUnitPriceEur
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
    feeAmount,
    feeUnit,
    feeValueEur,
    exchangeRate,
    exchangeRateUnit,
    rateUsdEur
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
