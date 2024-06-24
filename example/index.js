// An example workflow
//
// - Create an instance from a model
// - Do some work on it
// - Save it
// - Refetch it
// - Do more work

import ioredis from 'ioredis-mock'

import { Chatroom, User, Message, Note } from '../test/model/index.js'
import { Repository } from '../index.js'

const repo = new Repository(Chatroom, { redis: new ioredis() })

const chatroom = new Chatroom({
  messages: [
    new Message({ text: 'hello' }),
    new Message({ text: 'world' }),
  ],
  users: [
    new User({
      id: 'user_1',
      name: 'John Doe',
      notes: [
        new Note({ content: 'inhale... '}),
        new Note({ content: 'exhale... '}),
      ]
    })
  ]
})

chatroom.kickUser('user_1') // bye John ... :(
chatroom.addUser(new User({ name: 'Jane Doe' })) // hi Jane...

await repo.save(chatroom)

console.log('saved!')
