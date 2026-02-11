const test = require('tape')
const inRange = require('../lib/inRange')

test('inRange: ensure expected behavior', (t) => {
  t.ok(inRange(2, 1, 3), 'should 2 be between 1 and 3')
  t.notOk(inRange(0, 1, 3), 'should 0 be outside 1 and 3')
  t.ok(inRange(1, 1, 3), 'range should be inclusive')
  t.ok(inRange(3, 1, 3), 'range should be inclusive')
  t.notOk(inRange(10, 1, 3), 'should 10 be over max')

  t.notOk(inRange('3.2339999', '-12.993', '3.233999'), 'should support str')
  t.ok(inRange('3.2339999', '-12.993', '3.2339999'), 'should support str')

  t.end()
})
