import { test } from 'node:test'
import assert from 'node:assert'
import { nanoToMs } from '../index.js'

test('test utilities', async t => {
  await t.test('#nanoToMs()', async t => {
    let result

    await t.beforeEach(() => {
      result = nanoToMs(1000000)
    })

    await t.test('when passed a number', async t => {
      await t.test('converts it to milliseconds', () => {
        assert.strictEqual(result, 1)
      })
    })
  })

  await t.test('#round()', async t => {
    let result

    await t.beforeEach(() => {
      result = nanoToMs(3.314159)
    })

    await t.test('when passed a number', async t => {
      await t.test('rounds it to 2 decimal points', async () => {
        assert.strictEqual(result, 0)
      })
    })
  })
})
