const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const EventCollection = require('./lib/EventCollection')
const getRowsBeforeDate = require('./lib/getRowsBeforeDate')
const processRows = require('./lib/processRows')
const printAnnualReport = require('./lib/reports/printAnnualReport')
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

  let rowBatch = rows
  if (config.STOP_BEFORE_DATE) {
    console.log('Processing rows before ' + config.STOP_BEFORE_DATE + '.')
    rowBatch = getRowsBeforeDate(rows, config.STOP_BEFORE_DATE)
  }

  // Preload price history data.
  await prices.loadPriceHistory('BTC')
  await prices.loadPriceHistory('ETH')

  const success = processRows(accounts, events, rowBatch)
  if (success || config.DISPLAY_REPORT_ALWAYS) {
    printAnnualReport(accounts, events)

    printTaxReport(accounts, events, 2025)
  }
}

main()
