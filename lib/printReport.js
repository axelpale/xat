const findYearRange = require('./findYearRange')
const selectByYear = require('./selectByYear')

module.exports = function (events) {
  // Print a readable report about the annual income and tax.

  // For income tax.
  const incomeEvents = events.incomeEvents
  const range = findYearRange(incomeEvents, 'incomeDate')

  if (range.max - range.min > 100000) {
    throw new Error('Invalid year range.')
  }

  const annualData = []
  for (let year = range.minYear; year <= range.maxYear; year += 1) {
    const yearEvs = selectByYear(incomeEvents, 'incomeDate', year)

    let yearTotal = 0
    for (let i = 0; i < yearEvs.length; i++) {
      const incomeEvent = yearEvs[i]
      const incomeEur = incomeEvent.getIncomeEur()
      yearTotal += incomeEur
    }

    annualData.push({ year, yearTotal })
  }

  // Print income tax data
  console.log('Ordinary Income by Year:')
  annualData.forEach((yearData) => {
    const prettyTotal = yearData.yearTotal.toFixed(2)
    const padLen = Math.max(0, 10 - prettyTotal.length)
    const pad = ' '.repeat(padLen)
    console.log(`  ${yearData.year}: ${pad}${prettyTotal} EUR`)
  })

  console.log()
}
