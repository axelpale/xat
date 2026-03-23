const test = require('tape')
const unique = require('../lib/utils/unique')

test('unique: ensure expected behavior', (t) => {
  const arr0 = unique(['a', 'b', 'c'])

  t.equal(arr0.length, 3, 'should keep all')

  const arr1 = unique(['a', 'a', 'b', 'a', 'c', 'b', 'a'])

  t.equal(arr1.length, 3, 'should not repeat elements')
  t.equal(arr1[0], 'a', 'should maintain the order')
  t.equal(arr1[1], 'b', 'should maintain the order')
  t.equal(arr1[2], 'c', 'should maintain the order')

  t.end()
})
