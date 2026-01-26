const Transaction = function () {
  this.dateTime = Date.now()
  this.vouchers = []
  this.transactionId = '0'
  this.network = 'Bitcoin Network'
  this.account = 'Wallet name'

  this.inputs = [
    {
      amount: 0.0001,
      unit: 'BTC',
      unitValueEur: 10000
    }
  ]

  this.outputs = [
    {
      amount: 0.001,
      unit: 'ETH',
      unitValueEur: 1000
    }
  ]

  this.fees = [
    {
      amount: 0.000001,
      unit: 'BTC',
      unitValueEur: 10000
    }
  ]
}

module.exports = Transaction
