module.exports = (time) => {
  const msFromEpoch = (new Date(time)).getTime()
  return Math.floor(msFromEpoch / 1000)
}
