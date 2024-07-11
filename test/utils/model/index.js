/*
  A dead simple model for testing, using 2 types of lists with some level
  of nesting - plus a couple of OOP-y methods.
*/

import { List, LazyList, AppendList } from '../../../index.js'
import { randomId } from '../utils.js'

class Chatroom {
  constructor({ id = randomId(), users = [], messages = [], posts = [] } = {}) {
    this.id = id

    this.users = new List({ type: User, from: users })
    this.messages = new AppendList({ type: Message, from: messages })
    this.posts = new LazyList({ type: Post, from: posts })
  }

  addPost({ id, content = 'Bonjour' } = {}) {
    const post = new Post({ id, content })

    this.posts.push(post)

    return post
  }

  addMessage({ id, text = 'Hello' } = {}) {
    const message = new Message({ id, text })

    this.messages.push(message)

    return message
  }

  addUser({ id = null, name }) {
    const user = new User({ id, name })

    this.users.push(user)

    return user
  }

  kickUser(id) {
    const i = this.users.findIndex(user => user.id === id)
    const kicked = i > -1 ? this.users.splice(i, 1).pop() : null

    kicked ? console.log('kicked', kicked.name) : console.log('no such user')
  }
}

class User {
  constructor({ id = randomId(), name= 'J', notes = [], messages = [] }) {
    this.id = id
    this.name = name
    this.notes = new List({ from: notes })
    this.messages = new AppendList({ from: messages })
  }

  sendMessage({ id, text = 'hi' } = {}) {
    const message = new Message({ id, text })

    this.messages.push(message)

    return message
  }

  sayHi() {
    return this.name + ' says hi 👋'
  }
}

class Post {
  constructor({ id = randomId(), content }) {
    this.id = id
    this.content = content
  }
}

class Message {
  constructor({ id = randomId(), text }) {
    this.id = id
    this.text = text
  }
}

class Note {
  constructor({ id = randomId(), content }) {
    this.id = id
    this.content = content
  }
}

export { Chatroom, User, Message, Note }
