// Run this:
// `npm run example`

import { Repository, LazyList } from '../../index.js'
import ioredis from 'ioredis-mock'

// Model

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({
      from: flats,
      type: Flat
    })
  }
}

class Flat {
  constructor({ id }) {
    this.id = id
  }

  doorbell() {
    console.log(`🔔 at flat: ${this.id}`)
  }
}

// Save & Fetch

const repo = new Repository(Building, new ioredis())

// object ...
const building = new Building({
  id: 'foo',
  flats: [{ id: 101 }, { id: 102 }]
})

// save ...
await repo.save(building)
console.log('saved:', building.constructor.name, 'with id:', building.id)

// fetch ...
const fetched = await repo.fetch({ id: 'foo' })
console.log('fetched:', fetched.constructor.name, 'with id:', fetched.id)

// load lazy list via `list.load()`
await fetched.flats.load(repo)

// call a Flat method ...
fetched.flats[0].doorbell()

// 🔔 at flat: 101 !
