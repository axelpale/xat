const events = require('./events')
const VALID_EVENT_TYPES = Object.keys(events).map(p => p.toLowerCase())

const EventCollection = function () {
  // Maintain sequences of event objects of various types.
  //

  // Mapping from event type string to an array of events.
  this.events = {}

  // Init an array for each type.
  VALID_EVENT_TYPES.forEach(eventType => {
    this.events[eventType] = []
  })
}

const proto = EventCollection.prototype
module.exports = EventCollection

proto.getEvents = function (eventType) {
  // Get the array of events of the given event type.
  //
  // Parameters:
  //   eventType
  //     a string
  //
  // Return
  //   an array
  //
  if (!eventType || typeof eventType !== 'string') {
    throw new Error('Invalid event type argument.')
  }

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error('Unexpected event type: ' + eventType)
  }

  if (!this.events[eventType]) {
    throw new Error('Missing event array for type ' + eventType)
  }

  // Pick all events of the given type.
  // Return a shallow copy so that the array cannot be manipulated.
  const evs = this.events[eventType]
  return evs.slice()
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

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error('Unexpected event type: ' + eventType)
  }

  let minYear = Infinity
  let maxYear = -Infinity

  const evs = this.events[eventType]

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
  const ranges = VALID_EVENT_TYPES.map(eventType => {
    return this.findYearRange(eventType)
  })

  let minYear = Infinity
  let maxYear = -Infinity

  for (let i = 0; i < ranges.length; i++) {
    minYear = Math.min(minYear, ranges[i].minYear)
    maxYear = Math.max(maxYear, ranges[i].maxYear)
  }

  return { minYear, maxYear }
}

proto.forEach = function (eventType, iter) {
  // Call iter function for each event of the given type.
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
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error('Unexpected event type: ' + eventType)
  }
  if (typeof iter !== 'function') {
    throw new Error('Invalid iterator function.')
  }

  const evs = this.events[eventType]

  const len = evs.length
  for (let i = 0; i < len; i++) {
    iter(evs[i], i)
  }
}

proto.pushEvent = function (ev) {
  // Add an income event to the collection.
  //
  // Parameters:
  //   ev
  //     an income event object
  //
  if (typeof ev !== 'object') {
    throw new Error('Invalid event object.')
  }
  if (typeof ev.type !== 'string') {
    throw new Error('Invalid event type string.')
  }
  if (!VALID_EVENT_TYPES.includes(ev.type)) {
    throw new Error('Unexpected event type: ' + ev.type)
  }
  const evs = this.events[ev.type]
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
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    throw new Error('Unexpected event type: ' + eventType)
  }
  if (typeof year !== 'number') {
    throw new Error('Invalid year to find. Must be an integer.')
  }

  const evs = this.events[eventType]

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
