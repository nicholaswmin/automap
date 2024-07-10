import assert from 'node:assert'
import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import ioredis from 'ioredis'

import { Repository } from '../../src/repository.js'
import { Chatroom } from '../model/index.js'

test('List:performance', async t => {
  await t.test('#fetch() - save()', async t => {
    let histograms

    await t.test('50 cycles', async t => {
      await t.beforeEach(async () => {
        histograms = { fetch: createHistogram(), save: createHistogram() }

        const repo = new Repository(Chatroom, new ioredis())

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })

        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        for (let i = 0; i < 50; i++) {
          const chatroom = await fetch({ id: 'foo' }) || new Chatroom({
            id: 'foo',
            messages: [],
            users: Array.from({ length: 50 }, (_, i) => {
              return ({ id: `u_${i}`, name: 'John' })
            })
          })

          await save(chatroom)
        }

        repo.redis.disconnect()
      })

      await t.test('#fetch', async t => {
        await t.test('ran 50 times', () => {
          assert.strictEqual(histograms.fetch.count, 50)
        })

        await t.test('min duration is < 2 ms', () => {
          assert.ok(histograms.fetch.min / 1e+6 < 2)
        })

        await t.test('mean duration is < 3 ms', () => {
          assert.ok(histograms.fetch.mean / 1e+6 < 3)
        })

        await t.test('max duration is < 20 ms', () => {
          assert.ok(histograms.fetch.max / 1e+6 < 20)
        })

        await t.test('deviation is < 3 ms', () => {
          assert.ok(histograms.fetch.stddev / 1e+6 < 3)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 50 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 50, `histogram.count is ${count}`)
        })

        await t.test('min duration is < 2 ms', () => {
          const ms = histograms.save.min / 1e+6

          assert.ok(ms < 2, `histogram.save.min is: ${ms} ms`)
        })

        await t.test('mean duration is < 3 ms', () => {
          const ms = histograms.save.mean / 1e+6

          assert.ok(ms < 3, `histogram.save.mean is: ${ms} ms`)
        })

        await t.test('max duration is < 20 ms', () => {
          const ms = histograms.save.max / 1e+6

          assert.ok(ms < 20, `histogram.save.max is: ${ms} ms`)
        })

        await t.test('deviation is < 3 ms', () => {
          const ms = histograms.save.stddev / 1e+6

          assert.ok(ms < 3, `histogram.save.stddev is: ${ms} ms`)
        })
      })
    })
  })
})
