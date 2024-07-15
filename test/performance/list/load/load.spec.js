import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, histogramMs } from '../../../util/index.js'

test('fetch then save Lists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    let building = null

    await t.test('fetch an object, then save it again', async t => {
      let histograms = { fetch: null, save }

      t.beforeEach(async () => {
        histograms = { fetch: createHistogram(), save: createHistogram() }

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })
        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        await repo.save(new Building({
          id: 'foo',
          offices: Array.from({ length: 200 }, (_, i) => ({
            id: i,
            department: payloadKB(3)
          }))
        }))

        for (let i = 0; i < 200; i++) {
          building = await fetch('foo')

          await save(building)
        }
      })

      t.after(() => setImmediate(() => console.table({
        '#fetch()': histogramMs(histograms.fetch),
        '#save()' : histogramMs(histograms.save)
      })))

      await t.test('object was loaded', () => {
        assert.ok(building)
      })

      await t.test('#fetch', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.fetch.count

          assert.strictEqual(count, 200, `count was: ${count}`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.fetch.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.fetch.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.save.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.save.stddev)

          assert.ok(deviation < 5, `was: ${deviation} ms`)
        })
      })
    })
  })
})
