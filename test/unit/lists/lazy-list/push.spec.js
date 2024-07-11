import assert from 'node:assert'
import { test } from 'node:test'

import { LazyList } from '../../../../src/list.js'
import { Message } from '../../../utils/model/index.js'

test('LazyList', async t => {
  let list

  await t.test('#push', async t => {
    list = null

    await t.beforeEach(() => {
      list = new LazyList({
        from: [{ id: 'm_1', text: 'Hello' }],
        type: Message
      })

      list.push({ id: 'm_2', text: 'World' })
    })

    await t.test('adds the items', () => {
      assert.strictEqual(list.length, 2)
      assert.strictEqual(list[0].text, 'Hello')
    })

    await t.test('adds them after the existing items', () => {
      assert.strictEqual(list[1].text, 'World')
    })
  })
})
