import assert from 'node:assert'
import { test } from 'node:test'

import { Chatroom } from '../index.js'

test('Sample Model', async t => {
  let chatroom

  await t.beforeEach(() => {
    chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['breathe', 'dinner'] },
        { id: 'u_2', name: 'Mary', notes: ['homework'] }
      ]
    })
  })

  await t.test('Chatroom #addUser', () => {
    chatroom.addUser('Jane Doe')

    assert.strictEqual(chatroom.users.length, 3)
  })

  await t.test('Chatroom #kickUser', async t => {
    await t.test('when id user is not found', async t => {

      await t.test('does nothing', () => {
        chatroom.kickUser('nonexistent_id_user')

        assert.strictEqual(chatroom.users.length, 2)
      })
    })

    await t.test('when id user is found', async t => {

      await t.test('kicks John out of the chat room', () => {
        chatroom.kickUser('u_1')

        assert.strictEqual(chatroom.users.length, 1)
      })
    })
  })

  await t.test('User #sayHi', async t => {
    await t.test('returns a greeting', async () => {
      await assert.doesNotThrow(() => {
        const greet = chatroom.users.at(0).sayHi()

        assert.strictEqual(greet, 'John says hi 👋')
      })
    })
  })
})
