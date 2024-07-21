import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Person } from '../../../util/model/index.js'

import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('LazyList, flat, add items: x 200 times', async t => {
  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        fetch = timerify(repo.fetch.bind(repo)),
        save = timerify(repo.save.bind(repo))

  await t.before(() => repo.redis.flushall())
  await t.after(async () => repo.redis.disconnect())

  await t.test('x 200 times', async t => {
    await t.test('add 1 LazyList with 1 x 5kb item & save()', async t => {
      for (let i = 0; i < 200; i++) {
        const building = await fetch('foo') || new Building({ id: 'foo' })

        building.visitors.push(new Person({
          id: i, name: payloadKB(5)
        }))

        await save(building)
      }

      await t.test('logs stats', () => log([fetch, save], { title }))

      await t.test('saves the list items', async t => {
        t.assert.ok(
          await repo.redis.hgetall('building:foo:visitors')
        )
      })

      await t.test('fetch()', async t => {
        await t.test('is called 200 times', t => {
          const count = fetch.stats_ms.count

          t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = fetch.stats_ms.mean

          t.assert.ok(mean < 5, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = fetch.stats_ms.stddev

          t.assert.ok(deviation < 5, `deviation is: ${deviation} ms`)
        })
      })

      await t.test('save()', async t => {
        await t.test('is called 200 times', t => {
          const count = save.stats_ms.count

          t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = save.stats_ms.mean

          t.assert.ok(mean < 5, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = save.stats_ms.stddev

          t.assert.ok(deviation < 5, `deviation is: ${deviation} ms`)
        })
      })
    })
  })
})
