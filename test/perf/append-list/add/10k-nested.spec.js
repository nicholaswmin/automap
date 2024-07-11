import { styleText as col } from 'node:util'
import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'

test('perf: add 10k AppendList items, nested in 100 Lists', async t => {
  let redis = null

  await t.before(() => {
    console.info(col('yellow', 'next test could take > 10 minutes to run ...'))

    redis = new ioredis()
  })

  await t.after(() => redis.disconnect())

  await t.test('start with 0 List items', { skip: 'runs v. slow' }, async t => {
    await t.beforeEach(() => utils.deleteall(redis, 'chatroom'))
    await t.afterEach(() => utils.deleteall(redis, 'chatroom'))

    await t.test('run 100 times, add a List item in each run', async t => {
      await t.test('run 100 times, add AppendList item each run', async t => {
        let histograms = {}

        await t.beforeEach(async () => {
          histograms = { fetch: createHistogram(), save: createHistogram() }

          const repo = new Repository(Chatroom, redis)

          const fetch = performance.timerify(repo.fetch.bind(repo), {
            histogram: histograms.fetch
          })

          const save = performance.timerify(repo.save.bind(repo), {
            histogram: histograms.save
          })

          for (let i = 0; i < 100; i++) {
            const room = await repo.fetch({ id: 'foo' }) || new Chatroom({
              id: 'foo'
            })

            if (room)
              room.addUser({ id: i, name: utils.payloadKB(3) })

            await repo.save(room)

            for (let j = 0; j < 100; j++) {
              const room = await fetch({ id: 'foo' })

              const user = room.users.at(i)

              user.sendMessage({ id: j, text: utils.payloadKB(3) })

              await save(room)
            }
          }
        })

        await t.test('3 randomly-picked AppendLists', async t => {
          // - picking `user:messages` of 3 random users
          const lists = await Promise.all([1,50,95].map(uid => {
            return redis.lrange(`chatroom:foo:users:${uid}:messages`, 0, -1)
          }))

          await t.test('are saved as Redis Lists', async t => {
            assert.strictEqual(lists.length, 3)

            await t.test('each contains 100 items', () => {
              lists.forEach(list => assert.strictEqual(list.length, 100))
            })

            await t.test('and each item is ~ 3kb', () => {
              lists.forEach((list, i) => {
                list.forEach((item, j) => {
                  const kb = utils.sizeKB(item)

                  assert.ok(kb > 3, `list: ${i}, item: ${j} is: ${kb} kb`)
                  assert.ok(kb < 4, `list: ${i}, item: ${j} is: ${kb} kb`)
                })
              })
            })
          })
        })

        await t.test('durations', async t => {
          await t.before(() => console.table({
            '#fetch()': utils.toHistogramMs(histograms.fetch),
            '#save()' : utils.toHistogramMs(histograms.save)
          }))

          await t.test('#fetch', async t => {

            await t.test('ran 10000 times', () => {
              const count = histograms.fetch.count

              assert.strictEqual(count, 10000, `count is: ${count}`)
            })

            await t.test('min is < 4 ms', () => {
              const ms = utils.nanoToMs(histograms.fetch.min)

              assert.ok(ms < 4, `value is: ${ms} ms`)
            })

            await t.test('mean is < 5 ms', () => {
              const ms = utils.nanoToMs(histograms.fetch.mean)

              assert.ok(ms < 5, `value is: ${ms} ms`)
            })

            await t.test('max is < 50 ms', () => {
              const ms = utils.nanoToMs(histograms.fetch.max)

              assert.ok(ms < 50, `value is: ${ms} ms`)
            })

            await t.test('deviation (stddev) is < 3 ms', () => {
              const ms = utils.nanoToMs(histograms.fetch.stddev)

              assert.ok(ms < 3, `value is: ${ms} ms`)
            })
          })

          await t.test('#save', async t => {

            await t.test('ran 10000 times', () => {
              const count = histograms.save.count

              assert.strictEqual(count, 10000, `value is: ${count}`)
            })

            await t.test('min is < 4 ms', () => {
              const ms = utils.nanoToMs(histograms.save.min)

              assert.ok(ms < 4, `value is: ${ms} ms`)
            })

            await t.test('mean is < 5 ms', () => {
              const ms = utils.nanoToMs(histograms.save.mean)

              assert.ok(ms < 5, `value is: ${ms} ms`)
            })

            await t.test('max is < 50 ms', () => {
              const ms = utils.nanoToMs(histograms.save.max)

              assert.ok(ms < 50, `value is: ${ms} ms`)
            })

            await t.test('deviation (stddev) is < 3 ms', () => {
              const ms = utils.nanoToMs(histograms.save.stddev)

              assert.ok(ms < 3, `value is: ${ms} ms`)
            })
          })
        })
      })
    })
  })
})
