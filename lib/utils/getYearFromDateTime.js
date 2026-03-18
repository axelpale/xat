module.exports = (datetime) => {
  // Get year as an integer from full ISO date string.
  //
  // For example: '2026-02-07T17:55:03' returns 2026.
  //
  if (typeof datetime !== 'string') {
    throw new Error('Invalid datetime. Must be a string.')
  }
  if (datetime.length < 10) {
    throw new Error('Unexpected datetime string: ' + datetime)
  }

  const dateTimeParts = datetime.split(/[_ T]/)
  const datePart = dateTimeParts[0]
  const dateParts = datePart.split('-')
  const yearPart = dateParts[0].trim()

  if (yearPart.length !== 4) {
    throw new Error('Unexpected datetime string: ' + datetime)
  }

  const yearInt = parseInt(yearPart)

  if (isNaN(yearInt)) {
    throw new Error('Unexpected datetime string: ' + datetime)
  }

  return yearInt
}
