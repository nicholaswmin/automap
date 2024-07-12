import assert from 'node:assert'
import { test } from 'node:test'

import { Message } from '../../../helpers/model/index.js'
import { AppendList } from '../../../../src/list.js'

test('AppendList', async t => {
  let list

  await t.test('#push', async t => {
    list = null

    await t.beforeEach(() => {
      list = new AppendList({
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
