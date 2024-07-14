import { LazyList, AppendList } from '../../index.js'

// Helpers:

const randomId = () => Math.random().toString().slice(5, 10)

// Model

class Building {
  constructor({ id = randomId(), flats = [] }) {
    this.id = id
    this.flats = new LazyList({
      from: flats,
      type: Flat
    })
  }
}

class Flat {
  constructor({ id = randomId(), mail = [] }) {
    this.id = id
    this.mail = new AppendList({
      type: Mail,
      from: mail
    })
  }

  doorbell() {
    console.log('- 🔔 at flat', this.id)
  }

  addMail({ id = randomId(), text }) {
    this.mail.push(new Mail({ id, text }))
  }
}

class Mail {
  constructor({ id, text }) {
    this.id = id
    this.text = text
  }
}

export { Building, Flat, Mail }
