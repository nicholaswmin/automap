import assert from 'node:assert'
import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import ioredis from 'ioredis'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'

test('perf: edit 100 LazyList items', async t => {
  let redis = null, repo = null

  await t.before(() => redis = new ioredis())
  await t.after(() => redis.disconnect())

  await t.test('start with 10 List items and 100 LazyList items', async t => {
    await t.beforeEach(() => utils.deleteall(redis, 'chatroom'))
    await t.afterEach(() => utils.deleteall(redis, 'chatroom'))

    await t.test('run 100 times, leave object unchanged (noop)', async t => {
      let histograms = {}

      await t.beforeEach(async () => {
        histograms = {
          fetch: createHistogram(),
          save: createHistogram(),
          load: createHistogram()
        }

        repo = new Repository(Chatroom, redis)

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })

        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        await repo.save(new Chatroom({
          id: 'foo',
          users: Array.from({ length: 1 }, () => ({ name: 'John' })),
          posts: Array.from({ length: 100 }, () => ({
            content: utils.payloadKB(3)
          }))
        }))

        for (let i = 0; i < 100; i++) {
          const room = await fetch({ id: 'foo' })

          const load = performance.timerify(room.posts.load.bind(room.posts), {
            histogram: histograms.load
          })

          await load(repo)

          room.posts.at(i).content = utils.payloadKB(5)

          await save(room)
        }
      })

      await t.test('edits all posts', async t => {
        let room

        await t.beforeEach(async () => {
          room = await repo.fetch({ id: 'foo' })

          await room.posts.load(repo)
        })

        await t.test('a randomly picked Post', async t => {
          // pick a random room:foo:posts, i.e '6'
          assert.ok(room.posts.at(6))

          await t.test('is now 5kb', () => {
            const kb = utils.sizeKB(room.posts.at(6))

            assert.ok(kb > 5, `item is: ${kb} kb`)
            assert.ok(kb < 7, `item is: ${kb} kb`)
          })
        })
      })

      await t.test('durations', async t => {
        await t.before(() => console.table({
          '#fetch()': utils.toHistogramMs(histograms.fetch),
          '#save()' : utils.toHistogramMs(histograms.save),
          '#load()' : utils.toHistogramMs(histograms.load)
        }))

        await t.test('#fetch', async t => {
          await t.test('ran 100 times', () => {
            const count = histograms.fetch.count

            assert.strictEqual(count, 100, `count is: ${count}`)
          })

          await t.test('mean is < 6 ms', () => {
            const ms = utils.nanoToMs(histograms.fetch.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
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

          await t.test('mean is < 6 ms', () => {
            const ms = utils.nanoToMs(histograms.save.mean)

            assert.ok(ms < 6, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 4 ms', () => {
            const ms = utils.nanoToMs(histograms.save.stddev)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })
        })

        await t.test('#load', async t => {
          await t.test('ran 100 times', () => {
            const count = histograms.load.count

            assert.strictEqual(count, 100, `value is: ${count}`)
          })

          await t.test('mean is < 4 ms', () => {
            const ms = utils.nanoToMs(histograms.load.mean)

            assert.ok(ms < 4, `value is: ${ms} ms`)
          })

          await t.test('deviation (stddev) is < 3 ms', () => {
            const ms = utils.nanoToMs(histograms.load.stddev)

            assert.ok(ms < 3, `value is: ${ms} ms`)
          })
        })
      })
    })
  })
})
