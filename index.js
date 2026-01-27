const readRows = require('./lib/readRows')
const AccountCollection = require('./lib/AccountCollection')
const processRows = require('./lib/processRows')

const main = async function () {
  const rows = await readRows('transaction-history.csv')

  const accounts = new AccountCollection()
  const result = processRows(accounts, rows)

  console.log(result)
}

main()
