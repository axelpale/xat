const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const EventCollection = require('./lib/EventCollection')
const getRowsBeforeDate = require('./lib/getRowsBeforeDate')
const processRows = require('./lib/processRows')
const printReport = require('./lib/printReport')
const config = require('./lib/readConfig')

const main = async function () {
  const rows = await readRows('data/transaction-history.csv')

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

  const success = processRows(accounts, events, rowBatch)
  if (success || config.DISPLAY_REPORT_ALWAYS) {
    printReport(accounts, events)
  }
}

main()
