module.exports = (datetime) => {
  // Get date substring from full ISO date string.
  //
  // For example: '2026-02-07T17:55:03' returns '2026-02-07'
  //
  if (typeof datetime !== 'string') {
    throw new Error('Invalid datetime. Must be a string.')
  }
  if (datetime.length < 10) {
    throw new Error('Unexpected datetime string: ' + datetime)
  }

  const dateTimeParts = datetime.split(/[_ T]/)
  const datePart = dateTimeParts[0]

  return datePart.trim()
}
