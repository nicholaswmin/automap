import assert from 'node:assert'
import { test, beforeEach } from 'node:test'

import { LazyList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

test('LazyList', async t => {
  let list

  await t.test('#splice (insertion)', async t => {
    let list = null

    await t.beforeEach(t => {
      list = new LazyList({
        from: [{ id: 'm_1', text: 'Hello' }],
        type: Message
      })

      list.splice(0, 0, { id: 'm_2', text: 'World' })
    })

    await t.test('adds the items', t => {
      assert.strictEqual(list.length, 2)
    })

    await t.test('adds them after any existing items', t => {
      assert.strictEqual(list[0].text, 'World')
    })
  })

  await t.test('#splice (deletion)', async t => {
    let list = null

    await t.beforeEach(t => {
      list = new LazyList({
        from: [{ id: 'm_1', text: 'Hello' }]
      })

      list.splice(0, 1)
    })

    await t.test('removes the item', t => {
      assert.strictEqual(list.length, 0)
    })
  })
})
