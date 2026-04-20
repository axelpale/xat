const config = require('../readConfig')
const locales = require('./locales')

const LOCALE = config.LOCALE

if (typeof locales[LOCALE] !== 'object') {
  throw new Error('Dictionary for locale "' + LOCALE + '" is not available.')
}

const dictionary = locales[LOCALE]

const translate = function (key) {
  // Attempt to translate the keyword to the configured locale.
  // If no translation is available, the key is returned unmodified.
  //
  // Parameters:
  //   key
  //     a string
  //
  // Return
  //   a string
  //
  const trans = dictionary[key]

  if (typeof trans === 'string') {
    return trans
  }

  return key
}

const translateObjectKeys = function (obj) {
  // Attempt to translate each object key.
  // If no translation is found for a key, the original key string is used.
  //
  // Parameters:
  //   obj
  //     an object
  //
  // Return
  //   an object
  //
  const result = {}
  const keys = Object.keys(obj)
  const len = keys.length

  let i, k, m
  for (i = 0; i < len; i++) {
    k = keys[i]
    m = translate(k)
    result[m] = obj[k]
  }

  return result
}

exports.translate = translate
exports.translateObjectKeys = translateObjectKeys
