/*
A dead simple model for testing, using 2 types of lists with some level
of nesting - plus a couple of OOP-y methods.

The model represents a simple Chatroom in the following structure:

- `chatroom`, which has:
    - `messages`
    - `users`, which have:
        - 'user.notes'
*/

import { List, LazyList, AppendList, rand } from '../../index.js'

class Chatroom {
  constructor({ id = rand(), users = [], messages = [] }) {
    this.id = id

    this.users = new List({
      items: users,
      construct: item => new User(item)
    })

    this.messages = new AppendList({
      items: messages,
      construct: item => new Message(item)
    })
  }

  kickUser(id) {
    const i = this.users.findIndex(user => user.id === id)
    const kicked = i > -1 ? this.users.splice(i, 1).pop() : null

    kicked ? console.log('kicked', kicked.name) : console.log('no such user')
  }

  addUser({ name }) {
    this.users.push(new User({ name }))
  }
}

class User {
  constructor({ id = rand(), name = 'John', notes = [] }) {
    this.id = id
    this.name = name
    this.notes = new List({ items: notes })
  }

  sayHi() {
    return this.name + ' says hi 👋'
  }
}

class Message {
  constructor({ id = rand(), text }) {
    this.id = id
    this.text = text
  }
}

class Note {
  constructor({ id = rand(), content }) {
    this.id = id
    this.content = content
  }
}

export { Chatroom, User, Message, Note }
