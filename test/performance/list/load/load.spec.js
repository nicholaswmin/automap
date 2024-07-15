import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, timerify } from '../../../util/index.js'

test('fetch then save Lists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    let building = null
    let fetch, save = null

    await t.test('fetch an object, then save it again', async t => {
      t.beforeEach(async () => {
        fetch = timerify(repo.fetch.bind(repo))
        save = timerify(repo.save.bind(repo))

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

      t.after(() => process.nextTick(() => {
        console.table({
          '#fetch': fetch.toHistogramMillis(),
          '#save': save.toHistogramMillis()
        })
      }))

      await t.test('object was loaded', () => {
        assert.ok(building)
      })

      await t.test('#fetch', async t => {
        await t.test('ran 200 times', () => {
          const count = fetch.histogram.count

          assert.strictEqual(count, 200, `count was: ${count}`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(fetch.histogram.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(fetch.histogram.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 200 times', () => {
          const count = save.histogram.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(save.histogram.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(save.histogram.stddev)

          assert.ok(deviation < 5, `was: ${deviation} ms`)
        })
      })
    })
  })
})
