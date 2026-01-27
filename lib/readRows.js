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
    sentAmount: parseFloat(raw.Sent),
    sentUnit: raw['Sent Unit'],
    sentUnitPriceEur: parseFloat(raw['Sent Unit Value EUR']),
    receivedAmount: parseFloat(raw.Received),
    receivedUnit: raw['Received Unit'],
    receivedUnitPriceEur: parseFloat(raw['Received Unit Value EUR']),
    feeAmount: parseFloat(raw.Fee),
    feeUnit: raw['Fee Unit'],
    feeValueEur: parseFloat(raw['Fee Value EUR']),
    exchangeRate: parseFloat(raw['Exchange Rate']),
    exchangeRateUnit: raw['ExRate Unit'],
    rateUsdEur: parseFloat(raw['ExRate USDEUR'])
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
        }
      })
      .on('end', () => {
        console.log('CSV file successfully processed.')
        console.log(rows.length + ' rows found.')

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
