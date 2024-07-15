import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Person } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('adding items to a LazyList', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 100 "load -> push -> save" cycles run', async t => {
    let fetch, save = null

    t.beforeEach(async () => {
      fetch = timerify(repo.fetch.bind(repo))
      save = timerify(repo.save.bind(repo))

      for (let i = 0; i < 100; i++) {
        const building = await fetch('foo') || new Building({ id: 'foo' })

        building.visitors.push(new Person({
          id: i, name: payloadKB(3)
        }))

        await save(building)
      }
    })

    await t.test('saves items in a Redis List', async () => {
      assert.ok(await repo.redis.lrange('building:foo:flats:0:mail', 0, -1))
    })

    await t.test('logs timing stats', () =>
      setImmediate(() => console.table({
        fetch: fetch.histogram_ms,
        save: save.histogram_ms
      })))

    await t.test('fetches the objects promptly', async t => {
      await t.test('runs 100 times', () => {
        const count = fetch.histogram_ms.count

        assert.strictEqual(count, 100, `count was: ${count}`)
      })

      await t.test('takes on average < 5 ms per fetch()', () => {
        const mean = fetch.histogram_ms.mean

        assert.ok(mean < 3, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = fetch.histogram_ms.stddev
        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })

    await t.test('saves the objects promptly', async t => {
      await t.test('runs 100 times', () => {
        const count = save.histogram_ms.count

        assert.strictEqual(count, 100, `ran: ${count} times`)
      })

      await t.test('takes on average < 5 ms per save()', () => {
        const mean = save.histogram_ms.mean

        assert.ok(mean < 5, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = save.histogram_ms.stddev

        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })
  })
})
