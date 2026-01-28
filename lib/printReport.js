const findYearRange = require('./findYearRange')
const selectByYear = require('./selectByYear')

const printByYear = function (evs, dateProp, title) {
  const range = findYearRange(evs, dateProp)

  if (range.max - range.min > 100000) {
    throw new Error('Invalid year range.')
  }

  const annualData = []
  for (let year = range.minYear; year <= range.maxYear; year += 1) {
    const yearEvs = selectByYear(evs, dateProp, year)

    let yearTotal = 0
    for (let i = 0; i < yearEvs.length; i++) {
      const ev = yearEvs[i]
      const evEur = ev.getIncomeEur()
      yearTotal += evEur
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

module.exports = function (events) {
  // Print a readable report about the annual income and tax.

  // For income tax.
  const incomeEvents = events.incomeEvents
  printByYear(incomeEvents, 'incomeDate', 'Ordinary Income by Year')

  // For received gifts.
  const giftInEvents = events.giftInEvents
  printByYear(giftInEvents, 'incomeDate', 'Gift Income by Year')
}
