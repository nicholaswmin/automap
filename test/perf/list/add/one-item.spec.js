import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../model/index.js'

test('performance: List', async t => {
  const redis = new ioredis()

  await t.test('starts with 0 items', async t => {
    await t.beforeEach(() => utils.delObjectGraph(redis, 'chatroom'))
    await t.afterEach(() => utils.delObjectGraph(redis, 'chatroom'))
    await t.after(() => redis.disconnect())

    await t.test('adds one item per cycle, each being ~1 kb', async t => {
      await t.test('runs 100 fetch/save cycles', async t => {
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
            const room = await fetch({ id: 'foo' }) ||
                         new Chatroom({ id: 'foo' })

            if (room)
              room.addUser({ name: utils.payloadKB(1) })

            await save(room)
          }
        })

        await t.test('result', async t => {
          const items = await redis.hgetall('chatroom:foo:users')

          await t.test('items exist as a Redis Hash', async t => {
            assert.ok(items, 'cannot find Redis key: "chatroom:foo:users"')

            await t.test('contains 100 items', () => {
              assert.strictEqual(Object.keys(items).length, 100)
            })

            await t.test('each item is ~ 1kb', () => {
              Object.keys(items).forEach((key, i) => {
                const kb = utils.sizeKB(items[key])

                assert.ok(kb > 1, `item at index: ${i} is: ${kb} kb`)
                assert.ok(kb < 2, `item at index: ${i} is: ${kb} kb`)
              })
            })
          })
        })

        await t.test('durations', async t => {
          await t.test('#fetch', async t => {
            await t.before(() => {
              console.log('took:', utils.histogramToMs(histograms.fetch), 'ms')
            })

            await t.test('ran 100 times', () => {
              const count = histograms.fetch.count

              assert.strictEqual(count, 100, `count is: ${count}`)
            })

            await t.test('min is < 4 ms', () => {
              const ms = histograms.fetch.min / 1e+6

              assert.ok(ms < 4, `value is: ${ms} ms`)
            })

            await t.test('mean is < 6 ms', () => {
              const ms = histograms.fetch.mean / 1e+6

              assert.ok(ms < 6, `value is: ${ms} ms`)
            })

            await t.test('max is < 20 ms', () => {
              const ms = histograms.fetch.max / 1e+6

              assert.ok(ms < 20, `value is: ${ms} ms`)
            })

            await t.test('deviation is < 3 ms', () => {
              const ms = histograms.fetch.stddev / 1e+6

              assert.ok(ms < 3, `value is: ${ms} ms`)
            })
          })

          await t.test('#save', async t => {
            await t.before(() => {
              console.log('took:', utils.histogramToMs(histograms.save), 'ms')
            })

            await t.test('ran 100 times', () => {
              const count = histograms.save.count

              assert.strictEqual(count, 100, `value is: ${count}`)
            })

            await t.test('min is < 4 ms', () => {
              const ms = histograms.save.min / 1e+6

              assert.ok(ms < 4, `value is: ${ms} ms`)
            })

            await t.test('mean is < 6 ms', () => {
              const ms = histograms.save.mean / 1e+6

              assert.ok(ms < 6, `value is: ${ms} ms`)
            })

            await t.test('max is < 20 ms', () => {
              const ms = histograms.save.max / 1e+6

              assert.ok(ms < 20, `value is: ${ms} ms`)
            })

            await t.test('deviation is < 5 ms', () => {
              const ms = histograms.save.stddev / 1e+6

              assert.ok(ms < 5, `value is: ${ms} ms`)
            })
          })
        })
      })
    })
  })
})
