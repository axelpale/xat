const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const EventCollection = require('./lib/EventCollection')
const getRowsBeforeDate = require('./lib/getRowsBeforeDate')
const getYearFromDateTime = require('./lib/utils/getYearFromDateTime')
const groupRowsByYear = require('./lib/utils/groupRowsByYear')
const processRows = require('./lib/processRows')
const printAnnualReport = require('./lib/reports/printAnnualReport')
const printSummaryReport = require('./lib/reports/printSummaryReport')
const printBalanceReport = require('./lib/reports/printBalanceReport')
const printAssetsReport = require('./lib/reports/printAssetsReport')
const printSalesReport = require('./lib/reports/printSalesReport')
const printRewardsReport = require('./lib/reports/printRewardsReport')
const printTransactionsReport = require('./lib/reports/printTransactionsReport')
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
  let i, batch
  for (i = 0; i < batches.length; i += 1) {
    batch = batches[i]
    success = processRows(accounts, events, batch)

    if (!success) {
      break
    }
    if (batch.length < 1) {
      continue
    }

    const firstDate = batch[0].date
    const year = getYearFromDateTime(firstDate)

    printSalesReport(accounts, events, year)
    printRewardsReport(accounts, events, year)
    printTransactionsReport(accounts, events, year)

    const endOfYear = `${year}-12-31`
    printBalanceReport(accounts, endOfYear)
    printAssetsReport(accounts, endOfYear)

    // TODO balance report per currency total
    // TODO transaction report with computed and known balances
    // TODO acquisition events report
    // TODO mining income report
    // TODO airdrops income report
    // TODO gift income report
  }

  if (success || config.DISPLAY_REPORT_ALWAYS) {
    printAnnualReport(accounts, events)
    printSummaryReport(accounts, events)
  }
}

main()
