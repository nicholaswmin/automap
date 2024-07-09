import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { Chatroom } from '../index.js'

test('Sample Model', async t => {
  let chatroom

  await beforeEach(() => {
    chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['breathe', 'dinner'] },
        { id: 'u_2', name: 'Mary', notes: ['homework'] }
      ]
    })
  })

  await t.test('instantiation', async t => {
    await t.test('instantiates', t => {
      assert.ok(chatroom)
    })

    await t.test('is an instance of Chatroom', t => {
      assert.strictEqual(chatroom.constructor.name, 'Chatroom')
    })
  })

  await t.test('serialising/deserialising', async t => {
    let json, parsed = null

    await beforeEach(() => {
      json = JSON.stringify(chatroom)
      parsed = JSON.parse(json)
    })

    await t.test('is an instance of Chatroom', t => {
      assert.strictEqual(chatroom.constructor.name, 'Chatroom')
    })

    await t.test(`instantiating it using it's own JSON`, async t => {
      const revived = new Chatroom(parsed)
      const rejson = JSON.stringify(revived)

      await t.test('produces the same instance', t => {
        assert.equal(json, rejson)
      })
    })
  })

  await t.test('has 3 keys', async t => {
    assert.strictEqual(Object.keys(chatroom).length, 3)

    await t.test('has an id property', async t => {
      assert.ok(Object.hasOwn(chatroom, 'id'))

      await t.test('set to "c_1"', t => {
        assert.strictEqual(chatroom.id, 'c_1')
      })
    })
  })

  await t.test('"Chatroom" has a "Messages" property', async t => {
    assert.ok(Object.hasOwn(chatroom, 'messages'))

    await t.test('which is an Array', t => {
      assert.ok(Array.isArray(chatroom.messages))
    })

    await t.test('with 2 items', t => {
      assert.ok(Array.isArray(chatroom.messages))
    })

    await t.test('the 2 items are instances of Message', t => {
      chatroom.messages.forEach(message => {
        assert.strictEqual(message.constructor.name, 'Message')
      })
    })

    await t.test('the 2 messages have an id', async t => {
      assert.ok(Object.hasOwn(chatroom.messages[0], 'id'))
      assert.ok(Object.hasOwn(chatroom.messages[1], 'id'))

      await t.test('set to "m_1" and "m_2"', t => {
        assert.strictEqual(chatroom.messages[0].id, 'm_1')
        assert.strictEqual(chatroom.messages[1].id, 'm_2')
      })
    })

    await t.test('the 2 messages have a body', async t => {
      assert.ok(Object.hasOwn(chatroom.messages[0], 'text'))
      assert.ok(Object.hasOwn(chatroom.messages[1], 'text'))

      await t.test('set to "m_1" and "m_2"', t => {
        assert.strictEqual(chatroom.messages[0].text, 'Hello')
        assert.strictEqual(chatroom.messages[1].text, 'World')
      })
    })
  })

  await t.test('"Chatroom" has a "Users" property', async t => {
    assert.ok(Object.hasOwn(chatroom, 'users'))

    await t.test('which is an Array', t => {
      assert.ok(Array.isArray(chatroom.users))
    })

    await t.test('with 2 items', t => {
      assert.ok(Array.isArray(chatroom.users))
    })

    await t.test('the 2 items are instances of User', t => {
      chatroom.users.forEach(user => {
        assert.strictEqual(user.constructor.name, 'User')
      })
    })

    await t.test('the 2 users have an id', async t => {
      assert.ok(Object.hasOwn(chatroom.users[0], 'id'))
      assert.ok(Object.hasOwn(chatroom.users[1], 'id'))

      await t.test('set to "u_1" and "u_2"', t => {
        assert.strictEqual(chatroom.users[0].id, 'u_1')
        assert.strictEqual(chatroom.users[1].id, 'u_2')
      })
    })

    await t.test('the 2 users have a name', async t => {
      assert.ok(Object.hasOwn(chatroom.users[0], 'name'))
      assert.ok(Object.hasOwn(chatroom.users[1], 'name'))

      await t.test('set to "John" and "Mary"', t => {
        assert.strictEqual(chatroom.users[0].name, 'John')
        assert.strictEqual(chatroom.users[1].name, 'Mary')
      })
    })

    await t.test('each "User" has a "Notes" list', async t => {
      assert.ok(Object.hasOwn(chatroom.users[0], 'notes'))
      assert.ok(Object.hasOwn(chatroom.users[1], 'notes'))

      await t.test('which are Arrays', t => {
        assert.ok(Array.isArray(chatroom.users[0].notes))
        assert.ok(Array.isArray(chatroom.users[1].notes))
      })

      await t.test('John has 2 notes', t => {
        assert.strictEqual(chatroom.users[0].notes.length, 2)
      })

      await t.test('Mary has 1 note', t => {
        assert.strictEqual(chatroom.users[1].notes.length, 1)
      })
    })
  })
})
