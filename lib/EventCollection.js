const EventCollection = function () {
  // Maintain sequences of event objects.
  //
  this.miningEvents = []
  this.incomeEvents = []
  this.giftInEvents = []
  this.giftOutEvents = []
  this.saleEvents = []
  this.rewardEvents = []
}

const proto = EventCollection.prototype
module.exports = EventCollection

proto.getEvents = function (eventType) {
  // Get the array of events of the given event type.
  //
  // Return
  //   an array
  //
  switch (eventType) {
    case 'mining':
    case 'miningEvents':
      return this.miningEvents
    case 'income':
    case 'incomeEvents':
      return this.incomeEvents
    case 'giftIn':
    case 'giftInEvents':
      return this.giftInEvents
    case 'giftOut':
    case 'giftOutEvents':
      return this.giftOutEvents
    case 'sale':
    case 'saleEvents':
      return this.saleEvents
    case 'reward':
    case 'rewardEvents':
      return this.rewardEvents
    default:
      throw new Error('Unexpected event type: ' + eventType)
  }
}

proto.findYearRange = function (eventType) {
  // Find the year extremes in the set of events.
  //
  // Parameters:
  //   eventType
  //     a string
  //
  // Return
  //   an object { minYear, maxYear }
  //
  if (typeof eventType !== 'string') {
    throw new Error('Invalid event type string.')
  }

  let minYear = Infinity
  let maxYear = -Infinity

  const evs = this.getEvents(eventType)

  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i]
    const date = ev.date
    if (typeof date === 'string' && date.length >= 4) {
      const yearStr = date.substring(0, 4)
      const year = parseInt(yearStr)
      if (!isNaN(year)) {
        if (year < minYear) {
          minYear = year
        }
        if (year > maxYear) {
          maxYear = year
        }
      }
    }
  }

  return { minYear, maxYear }
}

proto.findYearRangeAny = function () {
  // Find the year extremes regardless of the event type.
  //
  // Return
  //   an object { minYear, maxYear }
  //
  const ranges = []
  ranges.push(this.findYearRange('mining'))
  ranges.push(this.findYearRange('income'))
  ranges.push(this.findYearRange('giftIn'))
  ranges.push(this.findYearRange('giftOut'))
  ranges.push(this.findYearRange('sale'))
  ranges.push(this.findYearRange('reward'))

  let minYear = Infinity
  let maxYear = -Infinity

  for (let i = 0; i < ranges.length; i++) {
    minYear = Math.min(minYear, ranges[i].minYear)
    maxYear = Math.max(maxYear, ranges[i].maxYear)
  }

  return { minYear, maxYear }
}

proto.forEach = function (eventType, iter) {
  // Call iter function for each event.
  //
  // Parameters:
  //   eventType
  //     a string
  //   iter
  //     a function (event, i)
  //
  if (typeof eventType !== 'string') {
    throw new Error('Invalid event type string.')
  }
  if (typeof iter !== 'function') {
    throw new Error('Invalid iterator function.')
  }

  const evs = this.selectEvents(eventType)

  const len = evs.length
  for (let i = 0; i < len; i++) {
    iter(evs[i], i)
  }
}

proto.pushEvent = function (eventType, ev) {
  if (typeof eventType !== 'string') {
    throw new Error('Invalid event type string.')
  }
  if (typeof ev !== 'object') {
    throw new Error('Invalid event object.')
  }

  const evs = this.getEvents(eventType)
  evs.push(ev)
}

proto.findByYear = function (eventType, year) {
  // Filter events by type and year. Maintain the chronological order.
  //
  // Parameters:
  //   eventType
  //     a string
  //   year
  //     an integer
  //
  // Return
  //   an array of events
  //
  if (typeof eventType !== 'string') {
    throw new Error('Invalid event type string.')
  }
  if (typeof year !== 'number') {
    throw new Error('Invalid year to find. Must be an integer.')
  }

  const evs = this.getEvents(eventType)

  const result = []

  for (let i = 0; i < evs.length; i++) {
    const ev = evs[i]
    const date = ev.date
    if (typeof date === 'string' && date.length >= 4) {
      const yearStr = date.substring(0, 4)
      const yearInt = parseInt(yearStr)
      if (!isNaN(yearInt)) {
        if (yearInt === year) {
          result.push(ev)
        }
      }
    }
  }

  return result
}
