import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('loading Lists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 100 Lists are fetched', async t => {
    let fetch = null, results = []

    t.beforeEach(async () => {
      fetch = timerify(repo.fetch.bind(repo))
      results = []

      await repo.save(new Building({
        id: 'foo',
        flats: Array.from({ length: 100 }, (_, i) => ({
          id: i, name: payloadKB(3)
        }))
      }))

      for (let i = 0; i < 100; i++) {
        const building = await fetch('foo')

        results.push(building)
      }
    })

    await t.test('logs timing stats', () =>
      setImmediate(() => console.table({
        fetch: fetch.histogram_ms
      })))

    await t.test('fetches 100 objects', () => {
      assert.strictEqual(results.length, 100)
    })

    await t.test('fetches the objects promptly', async t => {
      await t.test('runs 100 times', () => {
        const count = fetch.histogram_ms.count

        assert.strictEqual(count, 100, `count was: ${count}`)
      })

      await t.test('takes on average < 5 ms per fetch()', () => {
        const mean =fetch.histogram_ms.mean

        assert.ok(mean < 3, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = fetch.histogram_ms.stddev

        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })
  })
})
