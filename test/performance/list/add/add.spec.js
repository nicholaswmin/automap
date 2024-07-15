import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, timerify } from '../../../util/index.js'

test('adding List items', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 100 times', async t => {
    let fetch, save = null

    await t.test('adding a new item each time', async t => {
      t.beforeEach(async () => {
        fetch = timerify(repo.fetch.bind(repo))
        save = timerify(repo.save.bind(repo))

        for (let i = 0; i < 100; i++) {
          const building = await fetch('foo') || new Building({ id: 'foo' })

          building.flats.push(new Flat({
            id: i, bedrooms: payloadKB(3)
          }))

          await save(building)
        }
      })

      t.after(() => process.nextTick(() => {
        console.table({
          '#fetch': fetch.toHistogramMillis(),
          '#save': save.toHistogramMillis()
        })
      }))

      await t.test('has saved items', async () => {
        assert.ok(await repo.redis.lrange('building:foo:flats:0:mail', 0, -1))
      })

      await t.test('#fetch', async t => {
        await t.test('ran 100 times', () => {
          const count = fetch.histogram.count

          assert.strictEqual(count, 100, `count was: ${count}`)
        })

        await t.test('mean duration was < 5 ms', () => {
          const mean = nanoToMs(fetch.histogram.mean)

          assert.ok(mean < 5, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(fetch.histogram.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 100 times', () => {
          const count = save.histogram.count

          assert.strictEqual(count, 100, `ran: ${count} times`)
        })

        await t.test('mean duration was < 5 ms', () => {
          const mean = nanoToMs(save.histogram.mean)

          assert.ok(mean < 5, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(save.histogram.stddev)

          assert.ok(deviation < 5, `was: ${deviation} ms`)
        })
      })
    })
  })
})
