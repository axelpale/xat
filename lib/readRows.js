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
  return {
    date: ('' + raw.Date).trim(),
    voucher: raw.Voucher,
    type: ('' + raw.Type).trim(),
    desc: raw.Description,
    protocol: raw.Protocol,
    txid: raw.ID,
    fromAddress: raw['From Address'],
    toAddress: raw['To Address'],
    fromAccount: raw['From Account'],
    toAccount: raw['To Account'],
    sentAmount: parseNumber(raw.Sent, null),
    sentUnit: raw['Sent Unit'].toUpperCase(),
    sentUnitPriceEur: parseNumber(raw['Sent Unit Value EUR'], null),
    receivedAmount: parseNumber(raw.Received, null),
    receivedUnit: raw['Received Unit'].toUpperCase(),
    receivedUnitPriceEur: parseNumber(raw['Received Unit Value EUR'], null),
    feeAmount: parseNumber(raw.Fee, null),
    feeUnit: raw['Fee Unit'].toUpperCase(),
    feeValueEur: parseNumber(raw['Fee Value EUR'], 0),
    exchangeRate: parseNumber(raw['Exchange Rate'], null),
    exchangeRateUnit: raw['ExRate Unit'],
    rateUsdEur: parseNumber(raw['ExRate USDEUR'], null)
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
