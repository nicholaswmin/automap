import assert from 'node:assert'
import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'
import {
  nanoToMs,
  deleteall,
  payloadKB,
  toHistogramMs
} from '../../../utils/utils.js'

test('perf: edit 100 List items', async t => {
  let redis = null

  await t.before(() => redis = new ioredis())
  await t.after(() => redis.disconnect())

  await t.test('start with 100 items', async t => {
    await t.beforeEach(() => deleteall(redis, 'chatroom'))
    await t.afterEach(() => deleteall(redis, 'chatroom'))

    await t.test('run 100 times, edit one List item each time', async t => {
      let histograms = {}

      await t.beforeEach(async () => {
        histograms = { fetch: createHistogram(), save: createHistogram() }

        const repo = new Repository(Chatroom, redis)

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })

        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        await repo.save(new Chatroom({
          id: 'foo',
          users: Array.from({ length: 100 }, () => ({ name: 'John' }))
        }))

        for (let i = 0; i < 100; i++) {
          const room = await fetch({ id: 'foo' })

          if (room?.users.at(i))
            room.users.at(i).name = payloadKB(3)

          await save(room)
        }
      })

      await t.test('saves the list', async () => {
        const items = await redis.hgetall('chatroom:foo:users')
        assert.ok(items, 'cannot find Redis key: "chatroom:foo:users"')
      })

      await t.test('durations', async t => {
        await t.before(() => console.table({
          '#fetch()': toHistogramMs(histograms.fetch),
          '#save()' : toHistogramMs(histograms.save)
        }))

        await t.test('#fetch', async t => {

          await t.test('ran 100 times', () => {
            const count = histograms.fetch.count

            assert.strictEqual(count, 100, `count is: ${count}`)
          })

          await t.test('mean is < 6 ms', () => {
            const ms = nanoToMs(histograms.fetch.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 3 ms', () => {
            const ms = nanoToMs(histograms.fetch.stddev)

            assert.ok(ms < 3, `value is: ${ms} ms`)
          })
        })

        await t.test('#save', async t => {

          await t.test('ran 100 times', () => {
            const count = histograms.save.count

            assert.strictEqual(count, 100, `value is: ${count}`)
          })

          await t.test('mean is < 6 ms', () => {
            const ms = nanoToMs(histograms.save.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 4 ms', () => {
            const ms = nanoToMs(histograms.save.stddev)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })
        })
      })
    })
  })
})
