/*
 * Copyright 2026 Akseli Palén
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 *limitations under the License.
 */
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
const printEventReport = require('./lib/reports/printEventReport')
const printReport = require('./lib/reports/printReport')
const prices = require('./lib/prices')
const config = require('./lib/readConfig')

const main = async function () {
  // Read rows from the input ledger
  const rows = await readRows(config.SOURCE_LEDGER)

  if (rows.length < 1) {
    throw new Error('No valid rows to process.')
  }

  // Preload price history data.
  console.log('Load historical prices:')
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
  console.log()

  // Maintain accounts.
  // Each account has a name and a basket of assets of one unit.
  const accounts = new AccountCollection()
  // Collect financial events. Separate by type and tax consequences.
  const events = new EventCollection()

  // Only include rows before a certain date if so configured.
  let selectedRows = rows
  if (config.STOP_BEFORE_DATE) {
    console.log(`Processing transactions until ${config.STOP_BEFORE_DATE}...`)
    selectedRows = getRowsBeforeDate(rows, config.STOP_BEFORE_DATE)
  }

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
    const timestamp = `${year + 1}-01-01 00:00:00`

    const balanceData = collectBalanceData(accounts, timestamp)
    balanceData.forEach(datum => balanceDataEachYear.push(datum))

    const assetsData = collectAssetsData(accounts, timestamp)
    assetsData.forEach(datum => assetsDataEachYear.push(datum))
  }

  // Print reports for full year range
  const yearRange = events.findYearRangeAny()
  const rangeBegin = `${yearRange.minYear}-01-01`
  const rangeEnd = `${yearRange.maxYear + 1}-01-01`

  printReport(balanceDataEachYear, rangeBegin, rangeEnd, 'balances')
  printReport(assetsDataEachYear, rangeBegin, rangeEnd, 'assets')

  printEventReport(events, 'acquisition', rangeBegin, rangeEnd, 'acquisitions')
  printEventReport(events, 'airdrop', rangeBegin, rangeEnd, 'airdrops')
  printEventReport(events, 'casualty', rangeBegin, rangeEnd, 'casualties')
  printEventReport(events, 'gift', rangeBegin, rangeEnd, 'gifts')
  printEventReport(events, 'mining', rangeBegin, rangeEnd, 'mining')
  printEventReport(events, 'reward', rangeBegin, rangeEnd, 'rewards')
  printEventReport(events, 'sale', rangeBegin, rangeEnd, 'sales')
  printEventReport(events, 'transaction', rangeBegin, rangeEnd, 'transactions')
  printEventReport(events, 'transfer', rangeBegin, rangeEnd, 'transfers')

  if (success || config.DISPLAY_REPORT_ALWAYS) {
    console.log()
    printAnnualReport(accounts, events)
    printSummaryReport(accounts, events)
  }
}

main()
