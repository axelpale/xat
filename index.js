const readRows = require('./lib/rows/readRows')
const AccountCollection = require('./lib/AccountCollection')
const EventCollection = require('./lib/EventCollection')
const getRowsBeforeDate = require('./lib/rows/getRowsBeforeDate')
const getYearFromDateTime = require('./lib/utils/getYearFromDateTime')
const groupRowsByYear = require('./lib/rows/groupRowsByYear')
const processRows = require('./lib/rows/processRows')
const collectAssetsData = require('./lib/reports/collectAssetsData')
const collectBalanceData = require('./lib/reports/collectBalanceData')
const printAnnualReport = require('./lib/reports/printAnnualReport')
const printSummaryReport = require('./lib/reports/printSummaryReport')
const printAcquisitionsReport = require('./lib/reports/printAcquisitionsReport')
const printAirdropsReport = require('./lib/reports/printAirdropsReport')
const printGiftsReport = require('./lib/reports/printGiftsReport')
const printMiningReport = require('./lib/reports/printMiningReport')
const printRewardsReport = require('./lib/reports/printRewardsReport')
const printSalesReport = require('./lib/reports/printSalesReport')
const printTransactionsReport = require('./lib/reports/printTransactionsReport')
const printReport = require('./lib/reports/printReport')
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
  await prices.loadPriceHistory('SOL')
  await prices.loadPriceHistory('ADA')
  await prices.loadPriceHistory('MATIC')
  await prices.loadPriceHistory('POL')
  await prices.loadPriceHistory('MINA')
  await prices.loadPriceHistory('TRX')
  await prices.loadPriceHistory('GRT')
  await prices.loadPriceHistory('FLOW')

  // Split rows into annual batches.
  const batches = groupRowsByYear(selectedRows)

  // Collect balance data annually and produce a single balance report.
  const balanceDataEachYear = []
  // Collect asset data annually and produce a single assets report.
  const assetsDataEachYear = []

  // Process rows year by year.
  let success = true
  let i, batch
  for (i = 0; i < batches.length; i += 1) {
    batch = batches[i]
    success = processRows(accounts, events, batch)

    if (!success) {
      break // Stop on error.
    }
    if (batch.length < 1) {
      continue // Skip empty years.
    }

    const firstDate = batch[0].date
    const year = getYearFromDateTime(firstDate)
    const datestamp = `${year + 1}-01-01`

    const balanceData = collectBalanceData(accounts, datestamp)
    balanceData.forEach(datum => balanceDataEachYear.push(datum))

    const assetsData = collectAssetsData(accounts, datestamp)
    assetsData.forEach(datum => assetsDataEachYear.push(datum))

    // TODO balance report per currency total
    // TODO acquisition events report
  }

  // TODO get full range
  const rangeBegin = '2012-01-01'
  const rangeEnd = '2026-01-01'
  const rangeLabel = rangeBegin + '_' + rangeEnd

  printReport(balanceDataEachYear, 'account_balances_' + rangeLabel)
  printReport(assetsDataEachYear, 'account_assets_' + rangeLabel)

  printAcquisitionsReport(accounts, events, rangeBegin, rangeEnd)
  printAirdropsReport(accounts, events, rangeBegin, rangeEnd)
  printGiftsReport(accounts, events, rangeBegin, rangeEnd)
  printMiningReport(accounts, events, rangeBegin, rangeEnd)
  printRewardsReport(accounts, events, rangeBegin, rangeEnd)
  printSalesReport(accounts, events, rangeBegin, rangeEnd)
  printTransactionsReport(accounts, events, rangeBegin, rangeEnd)

  if (success || config.DISPLAY_REPORT_ALWAYS) {
    printAnnualReport(accounts, events)
    printSummaryReport(accounts, events)
  }
}

main()
