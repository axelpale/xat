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
