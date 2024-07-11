import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

test('perf: delete 100 List items', { todo: true }, async t => {
  let redis = null

  await t.before(() => redis = new ioredis())
  await t.after(() => redis.disconnect())

  await t.test('start with 100 items', async t => {
    await t.after(() => redis.disconnect())
    await t.beforeEach(() => {   })

    await t.test('does foo', () => {
      assert.ok(true)
    })
  })
})
