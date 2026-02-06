// Read the ledger in Kraken exchange format.
//

const fs = require('fs')
const csv = require('csv-parser')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

const isValidRawRow = function (raw) {
  if (typeof raw.time !== 'string' || raw.time.length < 1) {
    return false
  }

  if (typeof raw.type !== 'string' || raw.type.length < 1) {
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

const createRow = function (raw) {
  const txid = ('' + raw.txid).trim()
  const refid = ('' + raw.refid).trim()
  const time = ('' + raw.time).trim()
  const type = ('' + raw.type).trim()
  const subtype = ('' + raw.subtype).trim()
  const aclass = ('' + raw.aclass).trim()
  const asset = ('' + raw.asset).trim()
  const wallet = ('' + raw.wallet).trim()
  const amount = parseNumber(raw.amount, ZERO)
  const fee = parseNumber(raw.fee, ZERO)
  const balance = parseNumber(raw.balance, ZERO)

  return {
    txid,
    refid,
    time,
    type,
    subtype,
    aclass,
    asset,
    wallet,
    amount,
    fee,
    balance
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
          const row = createRow(rawrow)
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
