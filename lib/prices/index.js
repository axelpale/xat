// Historical prices.
//
// Functions to preload price data asynchronously and then query it in sync.
//
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const BigNumber = require('big.js')
const getDateFromDateTime = require('../ledger/getDateFromDateTime')

// A mapping from unit string to a price history.
const priceHistoryCache = {}

const loadPriceHistory = async function (unit) {
  // Read a price history for unit.
  // The reads are cached so that subsequent calls with the same
  // unit are return immediately from cache.
  //
  // Only rows that have datetime and price available, are processed.
  //
  // Return
  //   a Promise of price history which is a mapping from date to price.
  //

  // Read once.
  if (priceHistoryCache[unit]) {
    return priceHistoryCache[unit]
  }

  const promise = new Promise((resolve, reject) => {
    // Create a mapping from date to price.
    const prices = {}
    let numValid = 0
    let numTotal = 0

    // Begin read
    const filepath = `${unit.toLowerCase()}-eur.csv`
    console.log('Loading price data ' + filepath + '...')

    const cleanupOnError = (err) => {
      delete priceHistoryCache[unit] // allow retry
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
        `${numValid} date prices found, ${numSkipped} rows skipped.`)

      // Cache the result for the further calls.
      priceHistoryCache[unit] = prices

      // Resolve
      resolve(prices)
    })

    stream.on('error', cleanupOnError)
  })

  // Cache immediately
  priceHistoryCache[unit] = promise

  return promise
}

exports.loadPriceHistory = loadPriceHistory

exports.getPriceEur = function (unit, date) {
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
  //   a BigNumber or null
  //

  if (typeof unit !== 'string') {
    throw new Error('Invalid unit')
  }
  if (typeof date !== 'string') {
    throw new Error('Invalid date')
  }

  const priceData = priceHistoryCache[unit]
  if (!priceData) {
    return null
  }

  const price = priceData[date]
  if (!price) {
    return null
  }

  return price
}
