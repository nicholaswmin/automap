import test from 'node:test'

import { Mail } from '../../../util/model/index.js'
import { AppendList } from '../../../../src/list.js'

test('AppendList', async t => {
  let list

  await t.test('#push', async t => {
    list = null

    t.beforeEach(() => {
      list = new AppendList({
        from: [{ id: 'm_1', text: 'Hello' }],
        type: Mail
      })

      list.push({ id: 'm_2', text: 'World' })
    })

    await t.test('adds the items', t => {
      t.assert.strictEqual(list.length, 2)
      t.assert.strictEqual(list[0].text, 'Hello')
    })

    await t.test('adds them after the existing items', t => {
      t.assert.strictEqual(list[1].text, 'World')
    })
  })
})
