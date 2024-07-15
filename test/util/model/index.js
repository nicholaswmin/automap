import { List, AppendList, LazyList } from '../../../index.js'

const random = () => Math.random().toString().slice(5, 10)

class Building {
  constructor({ id = random(), mail = [], visitors = [], flats = [] } = {}) {
    this.id = id

    this.mail = new AppendList({
      from: mail,
      type: Mail
    })

    this.visitors = new LazyList({
      from: visitors,
      type: Person
    })

    this.flats = new List({
      from: flats,
      type: Flat
    })
  }
}

class Person {
  constructor({ id = random(), name = 'John' } = {}) {
    this.id = id
    this.name = name
  }
}

class Flat {
  constructor({ id = random(), bedrooms = 2, visitors = [], mail = [] } = {}) {
    this.id = id
    this.bedrooms = bedrooms

    this.visitors = new LazyList({
      from: visitors,
      type: Person
    })

    this.mail = new AppendList({
      type: Mail,
      from: mail
    })
  }

  ringDoorbell() {
    console.log('🔔 at flat', this.id)
  }

  addMail({ id = null, text = null } = {}) {
    this.mail.push(new Mail({ id, text }))
  }
}

class Mail {
  constructor({ id = random(), text = 'hi' } = {}) {
    this.id = id
    this.text = text
  }
}

export { Building, Person, Flat, Mail }
