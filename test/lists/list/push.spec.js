import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { List } from '../../../src/list.js'
import { User } from '../../model/index.js'

test('List', async t => {
  let list

  await t.test('#push', async t => {
    let list = null

    await t.beforeEach(t => {
      list = new List({
        items: [{ id: 'u_1', name: 'John' }]
      })

      list.push({ id: 'u_2', name: 'Steven' })
    })

    await t.test('adds the items', t => {
      assert.strictEqual(list.length, 2)
    })

    await t.test('adds them after the existing items', t => {
      assert.strictEqual(list[1].name, 'Steven')
    })
  })
})
