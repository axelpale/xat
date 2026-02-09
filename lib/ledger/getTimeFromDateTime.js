module.exports = (datetime) => {
  // Get time substring from full ISO datetime string.
  //
  // For example: '2026-02-07T17:55:03' returns '17:55:03'
  //
  if (typeof datetime !== 'string') {
    throw new Error('Invalid datetime. Must be a string.')
  }
  if (datetime.length < 10) {
    throw new Error('Unexpected datetime string: ' + datetime)
  }

  const dateTimeParts = datetime.split(/[_ T]/)

  if (dateTimeParts.length < 2) {
    throw new Error(`Unexpected datetime (${datetime}). Must include time.`)
  }

  const timePart = dateTimeParts[1]

  return timePart.trim()
}
