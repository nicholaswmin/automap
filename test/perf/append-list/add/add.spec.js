import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'

test('perf: add 100 AppendList items', async t => {
  let redis = null

  await t.before(() => redis = new ioredis())
  await t.after(() => redis.disconnect())

  await t.test('start with 0 items', async t => {
    await t.beforeEach(() => utils.deleteall(redis, 'chatroom'))
    await t.afterEach(() => utils.deleteall(redis, 'chatroom'))

    await t.test('run 100 times, add an AppendList item in each', async t => {
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

        for (let i = 0; i < 100; i++) {
          const room = await fetch({ id: 'foo' }) || new Chatroom({ id: 'foo' })

          if (room)
            room.addMessage({ id: i, text: utils.payloadKB(3) })

          await save(room)
        }
      })

      await t.test('saved AppendList', async t => {
        const items = await redis.lrange('chatroom:foo:messages', 0, -1)

        await t.test('is a Redis List', async t => {
          assert.ok(items, 'cannot find Redis key: "chatroom:foo:messages"')

          await t.test('containing 100 items', () => {
            assert.strictEqual(Object.keys(items).length, 100)
          })

          await t.test('each item is ~ 3kb', () => {
            Object.keys(items).forEach((key, i) => {
              const kb = utils.sizeKB(items[key])

              assert.ok(kb > 3, `item: ${i} is: ${kb} kb`)
              assert.ok(kb < 4, `item: ${i} is: ${kb} kb`)
            })
          })
        })
      })

      await t.test('durations', async t => {
        await t.test('#fetch', async t => {
          await t.before(() => console.table({
            '#fetch()': utils.toHistogramMs(histograms.fetch),
            '#save()' : utils.toHistogramMs(histograms.save)
          }))

          await t.test('ran 100 times', () => {
            const count = histograms.fetch.count

            assert.strictEqual(count, 100, `count is: ${count}`)
          })

          await t.test('min is < 4 ms', () => {
            const ms = utils.nanoToMs(histograms.fetch.min)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })

          await t.test('mean is < 6 ms', () => {
            const ms = utils.nanoToMs(histograms.fetch.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
          })

          await t.test('max is < 50 ms', () => {
            const ms = utils.nanoToMs(histograms.fetch.max)

            assert.ok(ms < 50, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 3 ms', () => {
            const ms = utils.nanoToMs(histograms.fetch.stddev)

            assert.ok(ms < 3, `value is: ${ms} ms`)
          })
        })

        await t.test('#save', async t => {

          await t.test('ran 100 times', () => {
            const count = histograms.save.count

            assert.strictEqual(count, 100, `value is: ${count}`)
          })

          await t.test('min is < 4 ms', () => {
            const ms = utils.nanoToMs(histograms.save.min)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })

          await t.test('mean is < 6 ms', () => {
            const ms = utils.nanoToMs(histograms.save.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
          })

          await t.test('max is < 50 ms', () => {
            const ms = utils.nanoToMs(histograms.save.max)

            assert.ok(ms < 50, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 5 ms', () => {
            const ms = utils.nanoToMs(histograms.save.stddev)

            assert.ok(ms < 5, `value is: ${ms} ms`)
          })
        })
      })
    })
  })
})
