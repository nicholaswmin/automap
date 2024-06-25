import { Repository, List, LazyList, redis } from '../../index.js'

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

  ringDoorbell() {
    console.log(`Doorbell 🔔 at flat: ${this.id}`)
  }
}

// Usage

// Save

const repo = new Repository(Building, redis())

const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})

await repo.save(building)

// Fetch
const fetched = await repo.fetch({ id: 'building:kensington' })

// List is lazy so we must `list.load()`
await fetched.flats.load(repo)

fetched.flats[0].ringDoorbell()
