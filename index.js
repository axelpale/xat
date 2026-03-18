const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const EventCollection = require('./lib/EventCollection')
const getRowsBeforeDate = require('./lib/getRowsBeforeDate')
const groupRowsByYear = require('./lib/utils/groupRowsByYear')
const processRows = require('./lib/processRows')
const printAnnualReport = require('./lib/reports/printAnnualReport')
const printSummaryReport = require('./lib/reports/printSummaryReport')
const printTaxReport = require('./lib/reports/printTaxReport')
const prices = require('./lib/prices')
const config = require('./lib/readConfig')

const main = async function () {
  // Read rows from the input ledger
  const rows = await readRows(config.SOURCE_LEDGER)

  if (rows.length < 1) {
    throw new Error('No valid rows to process.')
  }

  // Maintain accounts.
  // Each account has a name and a basket of assets of one unit.
  const accounts = new AccountCollection()
  // Collect financial events. Separate by type and tax consequences.
  const events = new EventCollection()

  // Only include rows before a certain date if so configured.
  let selectedRows = rows
  if (config.STOP_BEFORE_DATE) {
    console.log('Processing rows before ' + config.STOP_BEFORE_DATE + '.')
    selectedRows = getRowsBeforeDate(rows, config.STOP_BEFORE_DATE)
  }

  // Preload price history data.
  await prices.loadPriceHistory('BTC')
  await prices.loadPriceHistory('ETH')

  // Split rows into annual batches.
  const batches = groupRowsByYear(selectedRows)

  // Process rows year by year.
  let success = true
  for (let i = 0; i < batches.length; i += 1) {
    success = processRows(accounts, events, batches[i])

    if (!success) {
      break
    }

    // TODO balance report per account
    // TODO balance report per currency total
    // TODO balance report per acquisition
    // TODO transaction report with computed and known balances
    // TODO acquisition events report
    // TODO sales income report (aka disposal events report)
    // TODO rewards income report
    // TODO mining income report
    // TODO airdrops income report
    // TODO gift income report
  }

  if (success || config.DISPLAY_REPORT_ALWAYS) {
    printAnnualReport(accounts, events)
    printSummaryReport(accounts, events)

    // Print the tax report for all the years.
    const yearRange = events.findYearRangeAny()
    for (let y = yearRange.minYear; y <= yearRange.maxYear; y++) {
      printTaxReport(accounts, events, y)
    }
  }
}

main()
