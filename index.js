const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const processRows = require('./lib/processRows')
const printReport = require('./lib/printReport')

const main = async function () {
  const rows = await readRows('transaction-history.csv')

  const accounts = new AccountCollection()
  const events = processRows(accounts, rows)

  printReport(events)
}

main()
