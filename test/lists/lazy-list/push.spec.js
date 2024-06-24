import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { Message } from '../../model/index.js'
import { LazyList } from '../../../src/list.js'

test('LazyList', async t => {
  let list

  await t.test('#push', async t => {
    let list = null

    await t.beforeEach(t => {
      list = new LazyList({
        items: [{ id: 'm_1', name: 'Hello' }],
        construct: item => new Message(item)
      })

      list.push({ id: 'm_2', text: 'World' })
    })

    await t.test('adds the items', t => {
      assert.strictEqual(list.length, 2)
    })

    await t.test('adds them after the existing items', t => {
      assert.strictEqual(list[1].text, 'World')
    })
  })
})
