// Historical prices.
// Each price data is a mapping from dates to prices.
//
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const BigNumber = require('big.js')
const getDateFromDateTime = require('../ledger/getDateFromDateTime')

// A mapping from unit string to a price history.
const priceHistoryCache = {}

const readPriceData = async function (filepath) {
  // Read a price history from a filepath.
  // The reads are cached so that subsequent calls with the same
  // filepath are return immediately from cache.
  //
  // Only rows that have datetime and price available, are processed.
  //
  // Return
  //   a Promise of price history which is a mapping from date to price.
  //

  // Read once.
  if (priceHistoryCache[filepath]) {
    return priceHistoryCache[filepath]
  }

  const promise = new Promise((resolve, reject) => {
    // Create a mapping from date to price.
    const prices = {}
    let numValid = 0
    let numTotal = 0

    // Begin read
    console.log('Loading price data ' + filepath + '...')

    const cleanupOnError = (err) => {
      delete priceHistoryCache[filepath] // allow retry
      reject(err)
    }

    const fullpath = path.resolve(__dirname, filepath)
    const readStream = fs.createReadStream(fullpath)

    readStream.on('error', cleanupOnError)

    const stream = readStream.pipe(csv())

    stream.on('data', (pricerow) => {
      // Each rawrow is an object.
      numTotal += 1

      // Skip empty and malformed.
      const datetime = pricerow.datetime
      const priceStr = pricerow.price

      if (
        typeof datetime !== 'string' ||
        datetime.length < 10 ||
        typeof priceStr !== 'string' ||
        priceStr.length === 0
      ) {
        return
      }

      const date = getDateFromDateTime(datetime)
      if (!date) return

      try {
        const price = new BigNumber(priceStr)

        // Valid date-price pair.
        prices[date] = price
        numValid += 1
      } catch (err) {
        console.warn('Invalid number for a price. ' + err.message)
      }
    })

    stream.on('end', () => {
      const numSkipped = numTotal - numValid
      console.log(filepath + ': ' +
        `${numValid} dates found, ${numSkipped} rows skipped.`)

      // Cache the result for the further calls.
      priceHistoryCache[filepath] = prices

      // Resolve
      resolve(prices)
    })

    stream.on('error', cleanupOnError)
  })

  // Cache immediately
  priceHistoryCache[filepath] = promise

  return promise
}

exports.getPriceEur = async function (unit, date) {
  // Get unit price in EUR at the given date.
  // Null if the data is not available.
  //
  // Parameters:
  //   unit
  //     a string, the currency unit.
  //   date
  //     a string with ISO date
  //
  // Return
  //   a Promise or null
  //

  if (typeof unit !== 'string') {
    throw new Error('Invalid unit')
  }
  if (typeof date !== 'string') {
    throw new Error('Invalid date')
  }

  const file = `${unit.toLowerCase()}-eur.csv`

  let priceData = null
  try {
    priceData = await readPriceData(file)
  } catch (err) {
    console.warn('Error reading a price history CSV:', err.message)
    return null
  }

  if (priceData && priceData[date]) {
    return priceData[date]
  }

  return null
}
