import test from 'node:test'
import ioredis from 'ioredis'
import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'
import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('AppendList, nested, 1-level, add items: x 200 times', async t => {
  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        fetch = timerify(repo.fetch.bind(repo)),
        save = timerify(repo.save.bind(repo))

  t.before(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('create 20 Lists, each nesting 1 AppendList', async t => {
    for (let i = 0; i < 20; i++) {
      const building = await repo.fetch('foo') || new Building({ id: 'foo' })

      building.flats.push(new Flat({ id: i }))

      await repo.save(building)
    }

    await t.test('for each AppendList', async t => {
      await t.test('x 10 times', async t => {
        await t.test('add 1 AppendList item & save()', async t => {
          for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 10; j++) {
              const building = await fetch('foo')

              const flat = building.flats.at(i)

              flat.addMail({ id: j, text: payloadKB(3) })

              await save(building)
            }
          }

          await t.test('saves its items', async t => {
            t.assert.ok(await repo.redis.lrange(
              'building:foo:flats:0:mail', 0, -1
            ))
          })

          await t.test('logs stats', () => log([fetch, save], { title }))

          await t.test('fetch()', async t => {
            await t.test('is called 200 times', t => {
              const count = fetch.stats_ms.count

               t.assert.strictEqual(count, 200, `ran: ${count} times`)
            })

            await t.test('takes on average < 5 ms', t => {
              const mean = fetch.stats_ms.mean

               t.assert.ok(mean < 10, `mean is: ${mean} ms`)
            })

            await t.test('has consistent running times', t => {
              const deviation = fetch.stats_ms.stddev

               t.assert.ok(deviation < 3, `deviation is: ${deviation} ms`)
            })
          })

          await t.test('save()', async t => {
            await t.test('is called 200 times', t => {
              const count = save.stats_ms.count

               t.assert.strictEqual(count, 200, `ran: ${count} times`)
            })

            await t.test('takes on average < 5 ms', t => {
              const mean = save.stats_ms.mean

               t.assert.ok(mean < 10, `mean is: ${mean} ms`)
            })

            await t.test('has consistent running times', t => {
              const deviation = save.stats_ms.stddev

               t.assert.ok(deviation < 3, `deviation is: ${deviation} ms`)
            })
          })
        })
      })
    })
  })
})
