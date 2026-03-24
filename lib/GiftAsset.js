/*
 * Copyright 2026 Akseli Palén
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 *limitations under the License.
 */

const Asset = require('./Asset')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)
const DAYS_IN_YEAR = 365

const GiftAsset = function (
  amount,
  unit,
  origin,
  documents,
  acquisitionId,
  acquisitionDate,
  acquisitionUnitPriceEur,
  originalUnitPriceEur
) {
  // GiftAsset is an Asset that is given as a gift.
  // The acquisition cost handling depends on how long the gift is held.
  // In Finnish tax legislation, the original acquisition cost for the giver
  // is used if the gift is sold within one year from the receving.
  //
  // Parameters:
  //   amount
  //     numerical value, without expenses i.e. expenses removed if any.
  //   unit
  //     a string, the ticker like 'EUR', 'BTC'.
  //     Will be converted to upper case, for example 'eur' is read as 'EUR'.
  //   origin
  //     a string. The name of the person or organization from where the
  //     asset was bought.
  //   documents
  //     an array of strings
  //   acquisitionId
  //     an integer
  //   acquisitionDate
  //     a string
  //   acquisitionUnitPriceEur
  //     a BigNumber
  //   originalUnitPriceEur
  //     a BigNumber, the original unit price for the gift giver.
  //
  Asset.call(
    this,
    amount,
    unit,
    origin,
    documents,
    acquisitionId,
    acquisitionDate,
    acquisitionUnitPriceEur,
    originalUnitPriceEur
  )

  if (!(originalUnitPriceEur instanceof BigNumber)) {
    throw new Error('Invalid original unit price. Must be a BigNumber.')
  }
  if (originalUnitPriceEur.lt(ZERO)) {
    throw new Error('Original unit price cannot be negative.')
  }

  this.originalUnitPriceEur = originalUnitPriceEur
  this.isGift = true
}

GiftAsset.createFromReceived = function (row) {
  // Create a GiftAsset object from row.
  // Note that expenses must be added explicitly.
  //

  return new GiftAsset(
    row.receivedAmount,
    row.receivedUnit,
    row.protocol,
    row.documents,
    row.id,
    row.date,
    row.receivedUnitPriceEur,
    row.sentUnitPriceEur
  )
}

module.exports = GiftAsset
const proto = GiftAsset.prototype

proto.addExpenseEur = Asset.prototype.addExpenseEur // inherit

proto.copy = function () {
  // Create a copy of the asset.
  // Useful when the asset is passed to read-only purposes such as
  // tax reporting in order to avoid subsequent splits or other events
  // affecting the asset amount or expenses.
  //
  const asset = new GiftAsset(
    this.amount,
    this.unit,
    this.origin,
    this.documents,
    this.acquisitionId,
    this.acquisitionDate,
    this.acquisitionUnitPriceEur,
    this.originalUnitPriceEur
  )

  // Copy expenses
  asset.expenses = this.expenses.map(expense => {
    return Object.assign({}, expense)
  })

  return asset
}

proto.getAgeInDays = Asset.prototype.getAgeInDays // inherit
proto.getAgeInYears = Asset.prototype.getAgeInYears // inherit

proto.getAcquisitionPriceEur = function (toDate) {
  // Compute total acquisition price in EUR.
  // Does not include acquisition expenses.
  //
  // Return
  //   a BigNumber
  //

  const ageInDays = this.getAgeInDays(toDate)
  if (ageInDays < DAYS_IN_YEAR) {
    return this.amount.times(this.originalUnitPriceEur)
  }

  return this.amount.times(this.acquisitionUnitPriceEur)
}

proto.split = function (amount) {
  // Split the asset into two.
  // The original is modified in place
  // and the new one contains the given amount.
  //
  // Parameters:
  //   amount
  //     a BigNumber, the amount to take out from the asset.
  //
  // Return
  //   an Asset, the new asset.
  //
  const shard = Asset.prototype.split.call(this, amount)

  // Upgrade Asset shard into GiftAsset.
  const giftShard = new GiftAsset(
    shard.amount,
    shard.unit,
    shard.origin,
    shard.documents,
    shard.acquisitionId,
    shard.acquisitionDate,
    shard.acquisitionUnitPriceEur,
    this.originalUnitPriceEur
  )
  // Carry expenses
  giftShard.expenses = shard.expenses

  return giftShard
}
