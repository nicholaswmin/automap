import assert from 'node:assert'
import { test } from 'node:test'

import { List } from '../../../../src/list.js'

test('List', async t => {
  let list

  await t.test('#splice (insertion)', async t => {
    t.beforeEach(() => {
      list = new List({
        from: [{ id: 'u_1', name: 'John' }]
      })

      list.splice(0, 0, { id: 'u_2', name: 'Steven' })
    })

    await t.test('adds the items', () => {
      assert.strictEqual(list.length, 2)
    })

    await t.test('adds them before the existing items', () => {
      assert.strictEqual(list[0].name, 'Steven')
    })
  })

  await t.test('#splice (deletion)', async t => {
    let list = null

    t.beforeEach(() => {
      list = new List({
        from: [{ id: 'u_1', name: 'John' }]
      })

      list.splice(0, 1)
    })

    await t.test('removes the item', () => {
      assert.strictEqual(list.length, 0)
    })
  })
})
