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

  await t.test('Chatroom #addMessage', async t => {
    let result

    await t.test('when "id" and "text" is provided', async t => {
      await t.beforeEach(async () => {
        result = chatroom.addMessage({ id: 3, text: 'Hola' })
      })

      await t.test('adds a Message into the messages list', () => {
        assert.strictEqual(chatroom.messages.length, 3)
        assert.strictEqual(chatroom.messages.at(-1).constructor.name, 'Message')
        assert.strictEqual(chatroom.messages.at(-1).id, 3)
        assert.strictEqual(chatroom.messages.at(-1).text, 'Hola')
      })

      await t.test('returns the constructed Message', () => {
        assert.ok(result, 'returns a result')
        assert.strictEqual(result.constructor.name, 'Message')
        assert.strictEqual(result.id, 3)
        assert.strictEqual(result.text, 'Hola')
      })
    })

    await t.test('Chatroom #addPost', async t => {
      let result

      await t.test('when "id" and "content" is provided', async t => {
        await t.beforeEach(async () => {
          result = chatroom.addPost({ id: 4, content: 'Bonjour' })
        })

        await t.test('adds a Post into the posts list', () => {
          assert.strictEqual(chatroom.posts.length, 1)
          assert.strictEqual(chatroom.posts.at(-1).constructor.name, 'Post')
          assert.strictEqual(chatroom.posts.at(-1).id, 4)
          assert.strictEqual(chatroom.posts.at(-1).content, 'Bonjour')
        })

        await t.test('returns the constructed Post', () => {
          assert.ok(result, 'returns a result')
          assert.strictEqual(result.constructor.name, 'Post')
          assert.strictEqual(result.id, 4)
          assert.strictEqual(result.content, 'Bonjour')
        })
      })
    })

    await t.test('when no parameters provided', async t => {
      await t.beforeEach(async () => {
        result = chatroom.addMessage()
      })

      await t.test('adds a Message into the chatroom.messages list', () => {
        assert.strictEqual(chatroom.messages.length, 3)
      })

      await t.test('defaults to "Hello World" for text', () => {
        assert.strictEqual(chatroom.messages.at(-1).text, 'Hello')
      })

      await t.test('defaults to a random id', () => {
        assert.ok(chatroom.messages.at(-1).id)
      })
    })
  })

  await t.test('Chatroom #addUser', () => {
    let result

    t.beforeEach(() => {
      result = chatroom.addUser({ id: 'foo', name: 'Jane Doe' })
    })

    t.test('adds user to chatroom users', () => {
      assert.strictEqual(chatroom.users.length, 3)
    })

    t.test('returns added user instance', () => {
      assert.ok(result)

      t.test('is an instance of User added user instance', () => {
        assert.strictEqual(result.constructor.name, 'User')
      })

      t.test('has a valid id', () => {
        assert.ok(Object.hasOwn(result, 'id'))

        t.test('is a string', () => {
          assert.strictEqual(typeof result.id, 'string')
        })

        t.test('equals passed id', () => {
          assert.strictEqual(result.id, 'foo')
        })
      })
    })
  })

  await t.test('Chatroom #kickUser', async t => {
    await t.test('when id user is not found', async t => {

      await t.test('does nothing', () => {
        chatroom.kickUser('nonexistent_id_user')

        assert.strictEqual(chatroom.users.length, 3)
      })
    })

    await t.test('when id user is found', async t => {

      await t.test('kicks John out of the chat room', () => {
        chatroom.kickUser('u_1')

        assert.strictEqual(chatroom.users.length, 2)
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

  await t.test('User #sendMessage', async t => {
    let user, result

    await t.test('when "id" and "text" is provided', async t => {
      await t.beforeEach(async () => {
        user = chatroom.users.at(-1)
        result = chatroom.users.at(-1).sendMessage({ id: 'foo', text: 'bar' })
      })

      await t.test('adds a Message into user.messages list', () => {
        assert.strictEqual(user.messages.length, 1)
        assert.strictEqual(user.messages.at(-1).constructor.name, 'Message')
        assert.strictEqual(user.messages.at(-1).id, 'foo')
        assert.strictEqual(user.messages.at(-1).text, 'bar')
      })

      await t.test('returns the constructed Message', () => {
        assert.ok(result, 'returns a result')
        assert.strictEqual(result.constructor.name, 'Message')
        assert.strictEqual(result.id, 'foo')
        assert.strictEqual(result.text, 'bar')
      })
    })

    await t.test('when no parameters provided', async t => {
      await t.beforeEach(async () => {
        user = chatroom.users.at(-1)
        result = chatroom.users.at(-1).sendMessage()
      })

      await t.test('adds a Message into user.messages list', () => {
        assert.strictEqual(user.messages.length, 1)
      })

      await t.test('defaults to text: "hi"', () => {
        assert.strictEqual(user.messages.at(-1).text, 'hi')
      })

      await t.test('defaults to a random id', () => {
        assert.ok(user.messages.at(-1).id)
      })
    })
  })
})
