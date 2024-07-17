import test from 'node:test'

import { AppendList } from '../../../../src/list.js'
import { Mail } from '../../../util/model/index.js'
2
test('AppendList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let result = null

    t.test('list has non items', async t => {
      t.beforeEach(() => {
        list = new AppendList({ from: [], type: Mail })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', t => {
        t.assert.ok(result)
        t.assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        t.assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "list"', t => {
          t.assert.strictEqual(result.type, 'list')
        })
      })

      await t.test('with a value property', async t => {
        t.assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an Array', t => {
          t.assert.ok(Array.isArray(result.value))
        })

        await t.test('nothing new added to the array', async t => {
          await t.test('with no length', t => {
            t.assert.strictEqual(result.value.length, 0)
          })
        })
      })
    })

    await t.test('list has some items', async t => {
      t.beforeEach(() => {
        list = new AppendList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
          type: Mail
        })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', t => {
        t.assert.ok(result)
        t.assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        t.assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "list"', t => {
          t.assert.strictEqual(result.type, 'list')
        })
      })

      await t.test('with a value property', async t => {
        t.assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an Array', t => {
          t.assert.ok(Array.isArray(result.value))
        })

        await t.test('nothing new added to the array', async t => {
          await t.test('with no length', t => {
            t.assert.strictEqual(result.value.length, 0)
          })
        })

        await t.test('adding a new item via `#push(item)`', async t => {
          let mail

          t.beforeEach(() => {
            mail = new Mail({ id: 'm3', text: 'Hola' })

            list.push(mail)

            result = list.exportForSave('sample:path')
          })

          await t.test('has a length of 1', t => {
            t.assert.strictEqual(result.value.length, 1)
          })

          await t.test('with a result string as the new element', t => {
            t.assert.strictEqual(typeof result.value[0], 'string')
          })

          await t.test('which is parseable', t => {
            t.assert.doesNotThrow(() => JSON.parse(result.value))
          })

          await t.test('and matches the newly passed item', t => {
            t.assert.equal(result.value[0], JSON.stringify(mail))
          })
        })
      })
    })
  })
})
