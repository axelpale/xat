# xat

![Logo](doc/xat_logo.png)

Asset bookkeeping software designed to help in Finnish cryptocurrency taxation and reporting.

### Disclaimer

The software is provides as-is and without any warranty. General correctness cannot be quaranteed. Always validate the results with your own calculations. I wrote his software to help me to compute my taxes in my specific case. Your case might differ.

### Features

- Double-entry accounting
- High-precision decimal representation of financial numbers ([big.js](https://github.com/mikemcl/big.js/))
- Configurable FIFO ordering for global, per-account, and per-market FIFO pools.
- Process transaction journal file into assets, accounts, and tax events.
- Compute account balances at any given time.
- Automatic error detection of negative balance and balance mismatch.
- Support checking against known balance with configurable error-tolerance.
- Generate annual reports of sales, rewards, transactions, and balances.
- Realize transaction fees that were charged in crypto.
- Carry transaction fees into associated sales for tax deduction.
- Uses CoinGecko.com data for default asset price retrieval.
- Comprehensive sanity checks of recorded values and prices.
- Readable error messages that help in correcting the books.
- Configurable run mode: stop after the first error or just skip and continue.


# Installation

Download the source code and install dependencies. Installation and running requires [Node.js](https://nodejs.org/). Node.js v25 is supported, although the program will likely run on other versions too.

```
$ npm install
```

Create and adjust the configuration file.

```
$ cp config-sample.json config.json
```

Provide your transactions in a `journal.csv` and place it under `data` directory. See `config.json` to use different filepath. See [Journal Format](#journal-format) below for the required column labels.

```
$ npm start
```

# Journal Format

- `Date UTC`: the transaction date in ISO format e.g. `2024-02-20`
- `Documents`: optional references to receipts and such documentation.
- `Type`: the transaction type e.g. `trade` or `move`. See `lib/handlers` for all supported types.
- `Description`: optional description of the transaction
- `Protocol`: the platform or network of the transaction. Also used for the origin of assets. For example `Coinbase Exchange`.
- `ID`: optional transaction ID, for example the transaction hash on blockchain.
- `From Address`: optional blockchain address of the sending account.
- `To Address`: optional blockchain address of the receiving account.
- `From Account`: the name of the sending account. For example `My Bitcoin Wallet`
- `To Account`: the name of the receiving account. For example `My Dogecoin Wallet`
- `Sent`: numeric amount of the sent asset after the fee. For example `0.1`
- `Sent Unit`: the ticker symbol of the sent asset. For example `BTC`
- `Received`: numeric amount of the received asset after the fee. For example `1000`
- `Received Unit`: the ticker symbol of the received asset. For example `DOGE`
- `Fee`: numeric amount of fee paid to execute the transaction. For example `0.0001`
- `Fee Unit`: the ticker symbol of the fee currency. For example `BTC`
- `Fee Account`: the name of the fee account in case the fee not taken from sending or receiving accounts. Useful for example in Ethereum DEX trades where ETH is consumed to swap between tokens.
- `Sent Unit Price EUR`: the unit price of the sent asset at the time of transaction in euros. For `gift_in` transactions this is the original unit price for the gift giver.
- `Received Unit Price EUR`: the unit price of the received asset at the time of transaction in euros.
- `Fee Unit Price EUR`: optional unit price of the fee currency at the time of the transaction in euros. Useful in DEX transactions where the fee currency is often other than what was sent or received.
- `Sender Balance`: optional known balance of the sending account after the transaction. The algorithm will check the computed balance against this balance and raise a warning if balances do not match.
- `Receiver Balance`: optional known balance of the receiving account after the transaction. The algorithm will check the computed balance against this balance and raise a warning if balances do not match.

See `lib/rows/readRows.js` for more details.


# Development

Run the test suite:

```
$ npm test
```

See `package.json` for more development tooling.


# License

GPLv3
