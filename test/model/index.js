/*
A dead simple model for testing, using 2 types of lists with some level
of nesting - plus a couple of OOP-y methods.

The model represents a simple Chatroom in the following structure:

- `chatroom`, which has:
    - `messages`
    - `users`, which have:
        - 'user.notes'
*/

import { List, AppendList, utils } from '../../index.js'

class Chatroom {
  constructor({ id = utils.randomID(), users = [], messages = [] }) {
    this.id = id

    this.users = new List({
      from: users,
      type: User
    })

    this.messages = new AppendList({
      from: messages,
      type: Message
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
  constructor({ id = utils.randomID(), name = 'John', notes = [] }) {
    this.id = id
    this.name = name
    this.notes = new List({ from: notes })
  }

  sayHi() {
    return this.name + ' says hi 👋'
  }
}

class Message {
  constructor({ id = utils.randomID(), text }) {
    this.id = id
    this.text = text
  }
}

class Note {
  constructor({ id = utils.randomID(), content }) {
    this.id = id
    this.content = content
  }
}

export { Chatroom, User, Message, Note }
