module.exports = function (accounts, events, year) {
  // Collect rewards data for annual reporting.
  //
  // Parameters:
  //   accounts
  //     an AccountCollection
  //   events
  //     a collection of tax events
  //   year
  //     a string or integer
  //
  // Return
  //   an array of reward report objects
  //
  const rewards = events.findByYear('reward', year)
  const reportData = []

  rewards.forEach(reward => {
    const assetRewards = reward.getAssetRewards()
    assetRewards.forEach(assetReward => {
      reportData.push(assetReward)
    })
  })

  return reportData
}
