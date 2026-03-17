const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const diffDays = require('./utils/diffDays')

const Asset = function (
  amount,
  unit,
  origin,
  acquisitionDate,
  acquisitionUnitPriceEur
) {
  // Asset is a mutable representation of a held financial asset.
  // The asset always has only single unit and an acquisition date.
  //
  // Parameters:
  //   amount
  //     numerical value, without expenses i.e. expenses removed if any.
  //   unit
  //     a string, the ticker like 'EUR', 'BTC'.
  //     Will be converted to upper case, for example 'eur' is read as 'EUR'.
  //   origin
  //     a string. The name of the person or organization from where the
  //     asset was bought.
  //   acquisitionDate
  //     a string
  //   acquisitionUnitPriceEur
  //     a number
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount. Must be a BigNumber.')
  }
  if (amount.lte(0)) {
    throw new Error('Asset amount cannot be zero or negative.')
  }
  if (typeof unit !== 'string') {
    throw new Error('Invalid unit. Unit must be a string.')
  }
  if (unit.length < 2) {
    throw new Error('Invalid unit: ' + unit)
  }
  if (typeof origin !== 'string') {
    throw new Error('Invalid asset origin. Must be a string.')
  }
  if (origin.length < 2) {
    throw new Error('Unexpected asset origin ' + origin + '. ' +
      'Must be a long enough string. (' + acquisitionDate + ')')
  }
  if (typeof acquisitionDate !== 'string') {
    throw new Error('Invalid acquisitionDate. Must be a string.')
  }
  if (acquisitionDate.length < 10) {
    throw new Error('Unexpected acquisitionDate string. Must be an ISO date.')
  }
  if (!(acquisitionUnitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid asset unit price. Must be a BigNumber.')
  }
  if (acquisitionUnitPriceEur.lt(0)) {
    throw new Error('Unexpected asset unit price. Must be zero or positive.')
  }

  this.amount = amount
  this.unit = unit.toUpperCase()

  // Carry acquisition event data to splits.
  this.origin = origin
  this.acquisitionDate = acquisitionDate
  this.acquisitionUnitPriceEur = acquisitionUnitPriceEur

  // Track expenses and distribute in splits.
  this.expenses = []

  // Vouchers for the purchase and expenses.
  this.vouchers = []
}

Asset.createFromReceived = function (row) {
  // Create an Asset object from row
  // Note that expenses must be added explicitly.
  //

  return new Asset(
    row.receivedAmount,
    row.receivedUnit,
    row.protocol,
    row.date,
    row.receivedUnitPriceEur
  )
}

module.exports = Asset
const proto = Asset.prototype

proto.addExpenseEur = function (date, amount) {
  // Add expenses related to the asset.
  //
  // Parameters:
  //   date
  //     a string, the date of the expense.
  //     Will affect is the expense treated as purchase or sale expense or
  //     at all.
  //   amount
  //     a BigNumber, the expense in EUR.
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount (' + amount + ')')
  }
  if (amount.lt(ZERO)) {
    throw new Error('Unexpected amount (' + amount + '). ' +
      'Must be zero or positive.')
  }

  const ageInDays = diffDays(this.acquisitionDate, date)
  if (ageInDays < 0) {
    throw new Error('Unexpected expense date: ' +
      'cannot be earlier than the purchase of the asset.')
  }

  this.expenses.push({ date, amount })
}

proto.copy = function () {
  // Create a copy of the asset.
  // Useful when the asset is passed to read-only purposes such as
  // tax reporting in order to avoid subsequent splits or other events
  // affecting the asset amount or expenses.
  //
  const asset = new Asset(
    this.amount,
    this.unit,
    this.origin,
    this.acquisitionDate,
    this.acquisitionUnitPriceEur
  )

  // Copy expenses
  asset.expenses = this.expenses.map(expense => {
    return Object.assign({}, expense)
  })

  return asset
}

proto.getAgeInDays = function (toDate) {
  // Return the age of the asset in days.
  //
  // Parameters:
  //   toDate
  //     a ISO date string in format YYYY-MM-DD
  //
  // Return
  //   an integer number, the age in days, rounded down.
  //
  const ageDays = diffDays(this.acquisitionDate, toDate)
  return Math.floor(ageDays)
}

proto.getAgeInYears = function (toDate) {
  // Return the age of the asset in years.
  //
  // Parameters:
  //   toDate
  //     a ISO date string in format YYYY-MM-DD
  //
  // Return
  //   an integer number, the age in years, rounded down.
  //
  const ageDays = diffDays(this.acquisitionDate, toDate)
  const DAYS_PER_YEAR = 365.24219
  return Math.floor(ageDays / DAYS_PER_YEAR)
}

proto.getAcquisitionPriceEur = function () {
  // Compute total acquisition price in EUR.
  // Does not include acquisition expenses.
  //
  // Return
  //   a BigNumber
  //
  return this.amount.times(this.acquisitionUnitPriceEur)
}

proto.split = function (amount) {
  // Split the asset into two.
  // The original is modified in place
  // and the new one contains the given amount.
  //
  // Parameters:
  //   amount
  //     a BigNumber, the amount to take out from the asset.
  //
  // Return
  //   an Asset, the new asset.
  //
  if (!(amount instanceof BigNumber)) {
    throw new Error('Invalid amount. Must be a BigNumber.')
  }
  if (amount.lte(ZERO)) {
    throw new Error('Amount to split cannot be zero or negative.')
  }
  if (amount.gte(this.amount)) {
    throw new Error('Amount to split cannot be equal to or greater than ' +
      'the original amount')
  }

  // Split amount
  const originalAmount = this.amount
  this.amount = originalAmount.minus(amount)

  // Split expenses
  const ratioToSplit = amount.div(originalAmount)
  const giveExpenses = []
  const keepExpenses = []

  this.expenses.forEach(expense => {
    const giveAmount = expense.amount.times(ratioToSplit)
    const keepAmount = expense.amount.minus(giveAmount)
    giveExpenses.push({
      date: expense.date,
      amount: giveAmount
    })
    keepExpenses.push({
      date: expense.date,
      amount: keepAmount
    })
  })

  this.expenses = keepExpenses

  const splittedAsset = new Asset(
    amount,
    this.unit,
    this.origin,
    this.acquisitionDate,
    this.acquisitionUnitPriceEur
  )

  splittedAsset.expenses = giveExpenses

  return splittedAsset
}
