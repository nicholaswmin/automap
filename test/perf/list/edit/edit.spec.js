import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'

test('perf: edit 100 List items', async t => {
  let redis = null

  await t.before(() => redis = new ioredis())
  await t.after(() => redis.disconnect())

  await t.test('start with 100 items', async t => {
    await t.beforeEach(() => utils.deleteall(redis, 'chatroom'))
    await t.afterEach(() => utils.deleteall(redis, 'chatroom'))

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
            room.users.at(i).name = utils.payloadKB(3)

          await save(room)
        }
      })

      await t.test('saved List', async t => {
        const items = await redis.hgetall('chatroom:foo:users')

        await t.test('is saved as a Redis Hash', async t => {
          assert.ok(items, 'cannot find Redis key: "chatroom:foo:users"')

          await t.test('contains 100 items', () => {
            assert.strictEqual(Object.keys(items).length, 100)
          })

          await t.test('and each item is ~ 3 kb', () => {
            Object.keys(items).forEach((key, i) => {
              const kb = utils.sizeKB(items[key])

              assert.ok(kb > 3, `item: ${i} is: ${kb} kb`)
              assert.ok(kb < 4, `item: ${i} is: ${kb} kb`)
            })
          })
        })
      })

      await t.test('durations', async t => {
        await t.before(() => console.table({
          '#fetch()': utils.toHistogramMs(histograms.fetch),
          '#save()' : utils.toHistogramMs(histograms.save)
        }))

        await t.test('#fetch', async t => {

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

          await t.test('deviation (stddev) is < 4 ms', () => {
            const ms = utils.nanoToMs(histograms.save.stddev)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })
        })
      })
    })
  })
})
