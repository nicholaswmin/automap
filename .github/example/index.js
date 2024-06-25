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

const repo = new Repository(Building, redis())

const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})

await repo.save(building)

const fetched = await repo.fetch({ id: 'building:kensington' })

await fetched.flats.load(repo)

fetched.flats[0].ringDoorbell()

const list = new List({
  from: ['1995-12-20', '2002-11-16']
})

for (let i = 0; i < list.length; i++)
  console.log(list[i].constructor.name, list[i])

// String 1995-12-20
// String 2002-11-16
