import assert from 'node:assert'
import { test } from 'node:test'

import { Chatroom } from './model/index.js'

test('Model instantiation', async t => {
  let chatroom

  await t.beforeEach(() => {
    chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['foo', 'bar'] },
        { id: 'u_2', name: 'Mary', notes: ['baz'] }
      ]
    })
  })

  await t.test('instantiation', async t => {
    await t.test('instantiates ok', () => {
      assert.ok(chatroom)
    })
  })

  await t.test('lists contain the passed items', async t => {
    await t.test('Has 2 items in the users list', () => {
      assert.strictEqual(chatroom.users.length, 2)
    })

    await t.test('both are User instances', () => {
      chatroom.users.forEach(user => {
        assert.strictEqual(user.constructor.name, 'User')
      })
    })

    await t.test('both contain passed properties', () => {
      assert.strictEqual(chatroom.users[0].id, 'u_1')
      assert.strictEqual(chatroom.users[0].name, 'John')

      assert.strictEqual(chatroom.users[1].id, 'u_2')
      assert.strictEqual(chatroom.users[1].name, 'Mary')
    })
  })

  await t.test('Nested lists contain the passed items', async t => {
    let johnsNotes
    let marysNotes

    await t.before(() => {
      johnsNotes = chatroom.users[0].notes
      marysNotes = chatroom.users[1].notes
    })

    await t.test('user.0.notes list', async t => {
      await t.test('has 2 notes', () => {
        assert.strictEqual(johnsNotes.length, 2)
      })
      await t.test('contain the passed text', () => {
        assert.strictEqual(johnsNotes[0], 'foo')
        assert.strictEqual(johnsNotes[1], 'bar')
      })
    })

    await t.test('user.1.notes list', async t => {
      await t.test('has 1 note', () => {
        assert.strictEqual(marysNotes.length, 1)
      })

      await t.test('contain the passed text', () => {
        assert.strictEqual(marysNotes[0], 'baz')
      })
    })

    await t.test('Has 1 items in the user.1.notes list', () => {
      assert.strictEqual(marysNotes.length, 1)
    })
  })

  await t.test('append lists track the added items', async t => {
    await t.test('initial list', async t => {
      await t.test('has the initial messages', () => {
        assert.strictEqual(chatroom.messages.length, 2)
      })

      await t.test('contain the passed text', () => {
        assert.strictEqual(chatroom.messages[0].text, 'Hello')
        assert.strictEqual(chatroom.messages[1].text, 'World')
      })

      await t.test('has an additions property', () => {
        assert.ok(Object.hasOwn(chatroom.messages, 'additions'))
      })

      await t.test('has no additions', () => {
        assert.strictEqual(chatroom.messages.additions.length, 0)
      })
    })

    await t.test('adding new items', async t => {
      await t.beforeEach(() => {
        chatroom.messages.push(
          { id: 'm_3', text: 'Bonjour' },
          { id: 'm_4', text: 'Amigos' }
        )
      })

      await t.test('adds the items in the list', () => {
        assert.strictEqual(chatroom.messages.length, 4)
      })

      await t.test('adds the items as additions', () => {
        assert.strictEqual(chatroom.messages.additions.length, 2)
      })

      await t.test('including their properties', () => {
        assert.strictEqual(chatroom.messages.additions[0].id, 'm_3')
        assert.strictEqual(chatroom.messages.additions[1].id, 'm_4')
      })
    })
  })

  await t.test('lists behave like normal arrays', async t => {
    await t.test('identify as arrays', async t => {
      await t.test('Lists', () => {
        assert.ok(Array.isArray(chatroom.users))
      })

      await t.test('Append Lists', () => {
        assert.ok(Array.isArray(chatroom.messages))
      })
    })

    await t.test('can be iterated over with a for loop', async t => {
      await t.test('Lists', () => {
        let j = 1
        for (let i = 1; i < chatroom.users.length + 1; i++)
          ++j

        assert.strictEqual(j > 2, true)
      })

      await t.test('AppendList', () => {
        let j = 1
        for (let i = 1; i < chatroom.messages.length + 1; i++)
          ++j

        assert.strictEqual(j > 2, true)
      })
    })
  })
})
