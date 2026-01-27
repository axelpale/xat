const readRows = require('./lib/readRows')
const AccountCollection = require('./AccountCollection')
const processRows = require('./lib/processRows')

const main = async function () {
  const rows = await readRows('transaction-history.csv')

  const accounts = new AccountCollection()
  processRows(accounts, rows)

  console.log(accounts)
}

main()
