import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('adding items to an AppendList', async t => {
  let repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

  t.after(() => repo.redis.disconnect())
  t.beforeEach(() => repo.redis.flushall())

  await t.test('when 100 push -> save cycles run', async t => {
    let save, fetch = null

    t.beforeEach(async () => {
      fetch = timerify(repo.fetch.bind(repo))
      save = timerify(repo.save.bind(repo))

      for (let i = 0; i < 100; i++) {
        const building = await fetch('foo') || new Building({
          id: 'foo', flats: [{ id: 1 }]
        })

        building.flats.at(0).addMail({ id: i, text: payloadKB(3) })

        await save(building)
      }
    })

    await t.test('saves its items', async () => {
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
