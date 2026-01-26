const readRows = require('./lib/readRows')
const getTransactions = require('./lib/getTransactions')
const getAccounts = require('./lib/getAccounts')
const getAssets = require('./lib/getAssets')

const main = async function () {
  const rows = await readRows('transaction-history.csv')

  const transactions = getTransactions(rows)
  const accounts = getAccounts(transactions)
  const assets = getAssets(transactions)

  console.log(accounts)
  console.log(assets)
}

main()
