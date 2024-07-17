import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('LazyList, flat, edit items: x 200 times', async t => {
  let load = null

  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        fetch = timerify(repo.fetch.bind(repo)),
        save = timerify(repo.save.bind(repo))

  await t.before(() => repo.redis.flushall())
  await t.after(async () => repo.redis.disconnect())

  await t.test('has existing LazyList with 200 x 1 5kb items', async t => {
    await repo.save(new Building({
      id: 'foo',
      visitors: Array.from({ length: 200 }, (_, i) => ({
        id: i,
        name: payloadKB(5)
      }))
    }))

    await t.test('loading the list x 200 times', async t => {
      await t.test('adding a 5kb payload to an item', async t => {
        await t.test('save() it', async t => {
          for (let i = 0; i < 200; i++) {
            const building = await fetch('foo')

            if (!load)
              load = timerify(building.visitors.load.bind(building.visitors))

            await load(repo)

            if (building.visitors.at(i))
              building.visitors.at(i).name = payloadKB(5)

            await save(building)
          }

          await t.test('logs stats', () => log([fetch, load, save], { title }))

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

          await t.test('load()', async t => {
            await t.test('is called 200 times', t => {
              const count = load.stats_ms.count

              t.assert.strictEqual(count, 200, `ran: ${count} times`)
            })

            await t.test('takes on average < 5 ms', t => {
              const mean = load.stats_ms.mean

              t.assert.ok(mean < 5, `mean is: ${mean} ms`)
            })

            await t.test('has consistent running times', t => {
              const deviation = load.stats_ms.stddev

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
  })
})
