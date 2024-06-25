import { Repository, LazyList, redis } from '../index.js'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({
      items: flats,
      construct: item => new Flat(item)
    })
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

const repo = new Repository(Building, redis())

const building = new Building({
  id: 'kensington',
  flats: [{ id: '102' }, { id: '103' }]
})

await repo.save(building)

const fetched = await repo.fetch({ id: 'building:kensington' })

await fetched.flats.load(repo)

fetched.flats[0].ringDoorbell()
