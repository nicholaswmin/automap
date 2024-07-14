import { List, AppendList, LazyList } from '../../../index.js'

const id = () => Math.random().toString().slice(5, 10)

class Building {
  constructor({ id = id(), offices = [], flats = [] } = {}) {
    this.id = id

    this.offices = new LazyList({
      from: offices,
      type: Office
    })

    this.flats = new List({
      from: flats,
      type: Flat
    })
  }
}

class Office {
  constructor({ id = id(), department = 'lawyer' } = {}) {
    this.id = id
    this.department = department
  }
}

class Flat {
  constructor({ id = id(), bedrooms = 2, mail = [] } = {}) {
    this.id = id
    this.bedrooms = bedrooms
    this.mail = new AppendList({
      type: Mail,
      from: mail
    })
  }

  addMail({ id = null, text = null } = {}) {
    this.mail.push(new Mail({ id, text }))
  }
}

class Mail {
  constructor({ id = id(), text = 'hi' } = {}) {
    this.id = id
    this.text = text
  }
}

export { Building, Office, Flat, Mail }
