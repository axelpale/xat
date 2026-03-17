const BigNumber = require('big.js')

const printByYear = function (events, eventType, title) {
  const range = events.findYearRange(eventType)

  if (range.max - range.min > 100000) {
    throw new Error('Invalid year range.')
  }

  const annualData = []
  for (let year = range.minYear; year <= range.maxYear; year += 1) {
    const yearEvs = events.findByYear(eventType, year)

    let yearTotal = new BigNumber(0)
    for (let i = 0; i < yearEvs.length; i++) {
      const ev = yearEvs[i]
      const evEur = ev.getGainEur()
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
  printByYear(events, 'airdrop', 'Income from Airdrops by Year')
  // For airdrops tax.
  printByYear(events, 'payment', 'Income from Payments by Year')
  // For mining.
  printByYear(events, 'mining', 'Mining Income by Year')
  // For received gifts.
  printByYear(events, 'gift', 'Received Gifts by Year')
  // For sales
  printByYear(events, 'sale', 'Capital Gain from Sales by Year')
  // For rewards
  printByYear(events, 'reward', 'Capital Gain from Staking Rewards by Year')

  // List accounts with positive balance.
  printAccounts(accounts, 'Accounts with Positive Balance:')
}
