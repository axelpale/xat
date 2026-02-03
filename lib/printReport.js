const BigNumber = require('big.js')
const findYearRange = require('./findYearRange')
const selectByYear = require('./selectByYear')

const printByYear = function (evs, dateProp, gainProp, title) {
  const range = findYearRange(evs, dateProp)

  if (range.max - range.min > 100000) {
    throw new Error('Invalid year range.')
  }

  const annualData = []
  for (let year = range.minYear; year <= range.maxYear; year += 1) {
    const yearEvs = selectByYear(evs, dateProp, year)

    let yearTotal = new BigNumber(0)
    for (let i = 0; i < yearEvs.length; i++) {
      const ev = yearEvs[i]
      const evEur = ev[gainProp]()
      yearTotal = yearTotal.plus(evEur)
    }

    annualData.push({ year, yearTotal })
  }

  // Print income tax data
  console.log(title + ':')
  annualData.forEach((yearData) => {
    const prettyTotal = yearData.yearTotal.toFixed(2)
    const padLen = Math.max(0, 10 - prettyTotal.length)
    const pad = ' '.repeat(padLen)
    console.log(`  ${yearData.year}: ${pad}${prettyTotal} EUR`)
  })
  // Empty line
  console.log()
}

const printAccounts = function (accounts, title) {
  // Print accounts with positive balance.
  //
  const accountData = []
  accounts.forEach(account => {
    const name = account.name
    const balance = account.getBalance()
    const unit = account.unit

    if (balance.gt(0)) {
      const nameLength = name.length
      const balanceLength = balance.toFixed(8).length
      accountData.push({ name, balance, unit, nameLength, balanceLength })
    }
  })

  const maxNameLen = accountData.reduce((acc, x) => {
    const l = x.nameLength
    return l > acc ? l : acc
  }, 0)
  const maxBalanceLen = accountData.reduce((acc, x) => {
    const l = x.balanceLength
    return l > acc ? l : acc
  }, 0)
  const minTotalPad = accountData.reduce((acc, x) => {
    const m = maxNameLen - x.nameLength
    const n = maxBalanceLen - x.balanceLength
    const l = m + n
    return l < acc ? l : acc
  }, 100)

  console.log(title)
  accountData.forEach(x => {
    const namePad = maxNameLen - x.nameLength
    const balancePad = maxBalanceLen - x.balanceLength
    const balanceStr = x.balance.toFixed(8)
    const pad = ' '.repeat(namePad + balancePad + 3 - minTotalPad)
    console.log('  ' + x.name + pad + balanceStr + ' ' + x.unit)
  })
  // Empty line
  console.log()
}

module.exports = function (accounts, events) {
  // Print a readable report about the annual income and tax.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //

  // For income tax.
  const incomeEvents = events.incomeEvents
  printByYear(
    incomeEvents,
    'incomeDate',
    'getIncomeEur',
    'Ordinary Income by Year'
  )

  // For received gifts.
  const giftInEvents = events.giftInEvents
  printByYear(
    giftInEvents,
    'incomeDate',
    'getIncomeEur',
    'Gift Income by Year'
  )

  // For sales
  const saleEvents = events.saleEvents
  printByYear(
    saleEvents,
    'saleDate',
    'getCapitalGainEur',
    'Capital Gain from Sales by Year'
  )

  // For rewards
  const gainEvents = events.gainEvents
  printByYear(
    gainEvents,
    'date',
    'getCapitalGainEur',
    'Capital Gain from Staking Rewards by Year'
  )

  // List accounts with positive balance.
  printAccounts(accounts, 'Accounts with Positive Balance:')
}
