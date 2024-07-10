// Run `npm run example` to run this example

import { Repository, List, LazyList, utils } from '../../index.js'

const redis = utils.ioredis()

// Model

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({ type: Flat, from: flats })
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

// Usage

// Save

const repo = new Repository(Building, redis)

const building = new Building({
  id: 'kensington',
  flats: [{ id: 101 }, { id: 102 }, { id: 103 }]
})

await repo.save(building)

// Fetch
const fetched = await repo.fetch({ id: 'kensington' })

// List is lazy so we must `list.load()`
await fetched.flats.load(repo)

fetched.flats[0].doorbell()
// 🔔 at flat: 101

const list = new List({ from: [1, 2, 3] })

for (let i = 0; i < list.length; i++)
  console.log(list[i].constructor.name, list[i])

// Logs "Number 1"
// Logs "Number 2"
// Logs "Number 3"

redis.disconnect()
