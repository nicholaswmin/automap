import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, histogramMs } from '../../../util/index.js'

test('load LazyLists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    await t.test('load a LazyList each time', async t => {
      let histograms = { loadLazyList: null }

      t.beforeEach(async () => {
        histograms = { loadLazyList: createHistogram() }

        await repo.save(new Building({
          id: 'foo',
          offices: Array.from({ length: 200 }, (_, i) => ({
            id: i,
            department: payloadKB(3)
          }))
        }))

        for (let i = 0; i < 200; i++) {
          const building = await repo.fetch('foo')

          const loadLazyList = performance.timerify(
            building.offices.load.bind(building.offices),
            { histogram: histograms.loadLazyList })

          await loadLazyList(repo)
        }
      })

      t.after(() => console.table({
        '#loadLazyList()' : histogramMs(histograms.loadLazyList)
      }))

      await t.test('#loadLazyList', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.loadLazyList.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.loadLazyList.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.loadLazyList.stddev)

          assert.ok(deviation < 2, `was: ${deviation} ms`)
        })
      })
    })
  })
})
