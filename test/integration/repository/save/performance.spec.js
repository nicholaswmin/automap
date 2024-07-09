// Tests if `repository.save(object)` performance is within acceptable limits
import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis-mock'

import { Repository } from '../../../../src/repository.js'
import { Chatroom } from '../../../model/index.js'

test('repository', async t => {
  await t.test('#save', async t => {
    await t.todo('performance', async t => {
      // @TODO
      // - Use a far bigger object
      // - Use actual `ioredis`, not `ioredis-mock`.

      const repo = new Repository(Chatroom, new ioredis())
      const chatroom = new Chatroom({
        id: 'foo',
        messages: [
          { id: 'm_1', text: 'Hello' },
          { id: 'm_2', text: 'World' }
        ],
        users: [
          { id: 'u_1', name: 'John', notes: ['breathe', 'eat'] },
          { id: 'u_2', name: 'Mary', notes: ['homework'] }
        ]
      })

      await t.test('first and single invocation', async t => {
        const start = performance.now()

        await repo.save(chatroom)

        const duration = performance.now() - start

        await t.test('takes less than 3 ms', () => {
          assert.ok(duration < 3, 'took less than 3 ms')
        })
      })

      await t.test('multiple invocations', async t => {
        const durations = []

        for (let i = 0; i < 500; i++) {
          const start = performance.now()

          await repo.save(chatroom)

          durations.push(performance.now() - start)
        }

        await t.test('10th invocation takes less than 1 ms', () => {
          assert.ok(durations.at(10) < 0.5)
        })

        await t.test('50th invocation takes less than 1 ms', () => {
          assert.ok(durations.at(50) < 1)
        })

        await t.test('200th invocation takes less than 1 ms', () => {
          assert.ok(durations.at(200) < 1)
        })

        await t.test('300th invocation takes less than 1 ms', () => {
          assert.ok(durations.at(300) < 1)
        })
      })
    })
  })
})
