import assert from 'node:assert'
import { test } from 'node:test'

import { List } from '../../../../src/list.js'
import { Message } from '../../../model/index.js'

test('List', async t => {
  let list

  await t.test('#push', async t => {
    await t.beforeEach(() => {
      list = new List({
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
