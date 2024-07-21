import test from 'node:test'

import { List } from '../../../../src/list.js'
import { Mail } from '../../../util/model/index.js'

test('List', async t => {
  let list

  await t.test('#push', async t => {
    t.beforeEach(() => {
      list = new List({
        from: [{ id: 'm1', text: 'Hello' }],
        type: Mail
      })

      list.push({ id: 'm2', text: 'World' })
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
