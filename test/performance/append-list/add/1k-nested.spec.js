import assert from 'node:assert'
import { test } from 'node:test'

import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('adding items to a nested AppendList', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 50 nested AppendLists are created', async t => {
    let fetch, save = null

    await t.test('runs 20 "fetch -> push to list => save" cycles', async t => {
      t.beforeEach(async () => {
        fetch = timerify(repo.fetch.bind(repo))
        save = timerify(repo.save.bind(repo))

        for (let i = 0; i < 50; i++) {
          const building = await repo.fetch('foo') || new Building({ id: 'foo' })

          building.flats.push(new Flat({ id: i }))

          await repo.save(building)

          for (let j = 0; j < 20; j++) {
            const building = await fetch('foo')

            const flat = building.flats.at(i)

            flat.addMail({ id: j, text: payloadKB(3) })

            await save(building)
          }
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

      await t.test('fetches objects promptly', async t => {
        await t.test('fetches 1000 times', () => {
          const count = fetch.histogram_ms.count

          assert.strictEqual(count, 1000, `count was: ${count}`)
        })

        await t.test('each takes on average < 3 ms', () => {
          const mean = fetch.histogram_ms.mean

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('has consistent durations throughout', () => {
          const deviation = fetch.histogram_ms.stddev

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('saves objects promptly', async t => {
        await t.test('saves 1000 times', () => {
          const count = save.histogram_ms.count

          assert.strictEqual(count, 1000, `ran: ${count} times`)
        })

        await t.test('each takes on average < 3 ms', () => {
          const mean = save.histogram_ms.mean

          assert.ok(mean < 5, `was: ${mean} ms`)
        })

        await t.test('has consistent durations throughout', () => {
          const deviation = save.histogram_ms.stddev

          assert.ok(deviation < 5, `was: ${deviation} ms`)
        })
      })
    })
  })
})
