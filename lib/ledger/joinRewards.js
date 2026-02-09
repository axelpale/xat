const joinRows = require('./joinRows')
const rewardTypes = ['earn_reward', 'staking']
const getDateFromDateTime = require('./getDateFromDateTime')

module.exports = function (rows) {
  // Assume chronological order, the oldest first.
  //
  const resultRows = []

  // Find rewards that are last before other actions on the account.
  const finalRewards = {} // account name to last reward.
  rows.forEach(row => {
    if (rewardTypes.includes(row.type)) {
      // Is a reward.
      const sourceName = row.fromAccount
      const targetName = row.toAccount
      if (targetName) {
        // Normal reward. Mark as possible last.
        finalRewards[targetName] = row
      } else if (sourceName) {
        // Negative reward. Special, do not join.
        // Mark the current last.
        if (finalRewards[sourceName]) {
          finalRewards[sourceName].isLastRewardBeforeAction = true
          delete finalRewards[sourceName]
        }
        // Keep the negative reward separate.
        row.isLastRewardBeforeAction = true
      } else {
        console.log(row)
        throw new Error('Unexpected empty fromAccount and toAccount names')
      }
    } else {
      // Not a reward. Check if either account matches any rewards.
      const sourceName = row.fromAccount
      const targetName = row.toAccount
      if (finalRewards[sourceName]) {
        // Is an action to an account that has accumulated rewards.
        // Mark the reward as the last before such action.
        finalRewards[sourceName].isLastRewardBeforeAction = true
        // Clear up for next batch of rewards.
        delete finalRewards[sourceName]
      } else if (finalRewards[targetName]) {
        finalRewards[targetName].isLastRewardBeforeAction = true
        delete finalRewards[targetName]
      }
    }
  })
  // Mark the remaining final rewards.
  // This lets the rewards appear where they are instead of the end.
  Object.keys(finalRewards).forEach(accountName => {
    const rewardRow = finalRewards[accountName]
    rewardRow.isLastRewardBeforeAction = true
  })

  // Maintain a mapping for accumulated rewards: account name -> acc row
  const accRewards = {}

  rows.forEach(row => {
    if (rewardTypes.includes(row.type)) {
      // Is a reward.
      if (!row.toAccount && row.fromAccount) {
        // Negative reward. Should be the only one.
        resultRows.push(row)
        return
      }

      const accountName = row.toAccount
      if (row.isLastRewardBeforeAction) {
        // Is the final reward.
        if (accRewards[accountName]) {
          // Join with the accumulated and finalize.
          const accRow = accRewards[accountName]
          const finalJoinedReward = joinRows(accRow, row)
          finalJoinedReward.rewardRangeBegin = accRow.rewardRangeBegin
          finalJoinedReward.rewardRangeEnd = row.date
          resultRows.push(finalJoinedReward)
          delete accRewards[accountName]
        } else {
          // No rewards accumulated, the reward is the only one.
          resultRows.push(row)
        }
      } else {
        // Is a reward row but not the final.
        if (accRewards[accountName]) {
          // Accumulate with the previous.
          const accRow = accRewards[accountName]
          const joinedReward = joinRows(accRow, row)
          joinedReward.rewardRangeBegin = accRow.rewardRangeBegin
          accRewards[accountName] = joinedReward
        } else {
          // Is the first to accumulate.
          // Mark this as the earliest.
          row.rewardRangeBegin = row.date
          accRewards[accountName] = row
        }
      }
    } else {
      // Is not a reward. Just push.
      resultRows.push(row)
    }
  })

  // Flush all remaining accumulated rewards.
  const rewardAccounts = Object.keys(accRewards)
  rewardAccounts.forEach(accountName => {
    const finalRewardRow = accRewards[accountName]
    resultRows.push(finalRewardRow)
  })

  // Modify the description of joined reward rows.
  resultRows.forEach(row => {
    if (row.rewardRangeBegin && row.rewardRangeEnd) {
      const origDesc = row.desc
      const beginDate = getDateFromDateTime(row.rewardRangeBegin)
      const endDate = getDateFromDateTime(row.rewardRangeEnd)
      const newDesc = 'final ' + origDesc + ' ' +
        'from ' + beginDate + ' to ' + endDate + '.'
      row.desc = newDesc
    }
  })

  // Remove added flags if any.
  resultRows.forEach(row => {
    delete row.isLastRewardBeforeAction
    delete row.rewardRangeBegin
    delete row.rewardRangeEnd
  })

  return resultRows
}
