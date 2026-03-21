const fs = require('fs')
const path = require('path')
const BigNumber = require('big.js')

const CONFIG_PATH = path.resolve(__dirname, '../config.json')

let configFile
try {
  configFile = fs.readFileSync(CONFIG_PATH, 'utf8')
} catch (err) {
  throw new Error('Failed to read config.json. Ensure it exists.')
}

let config
try {
  config = JSON.parse(configFile)
} catch (err) {
  throw new Error('Unexpected config.json. Check JSON formatting.')
}

// Normalize and export the config variables.

const errorMargin = new BigNumber(config.BALANCE_CHECK_ERROR_MARGIN)
exports.BALANCE_CHECK_ERROR_MARGIN = errorMargin

exports.DISPLAY_ERROR_ROW = Boolean(config.DISPLAY_ERROR_ROW)
exports.DISPLAY_ERROR_TRACE = Boolean(config.DISPLAY_ERROR_TRACE)
exports.DISPLAY_REPORT_ALWAYS = Boolean(config.DISPLAY_REPORT_ALWAYS)
exports.EXPENSE_DAY_MARGIN = parseInt(config.EXPENSE_DAY_MARGIN)
exports.REPORTS_EXCLUDE_ACCOUNTS = config.REPORTS_EXCLUDE_ACCOUNTS

const ledgerRelPath = String(config.SOURCE_LEDGER)
const ledgerAbsPath = path.resolve(__dirname, '..', ledgerRelPath)
exports.SOURCE_LEDGER = ledgerAbsPath

exports.STOP_AFTER_FIRST_ERROR = Boolean(config.STOP_AFTER_FIRST_ERROR)
exports.STOP_BEFORE_DATE = String(config.STOP_BEFORE_DATE)
