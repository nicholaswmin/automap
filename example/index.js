import { Paper, Board } from './paper/index.js'
import { Repository, LazyList, rand, redis } from '../index.js'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({ // <-- Use List instead of Array (!)
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
  id: 'kensington-gardens',
  flats: [{ id: '102' }, { id: '103' }]
})

await repo.save(building)

const fetched = await repo.fetch({ id: 'building:kensington-gardens' })

await fetched.flats.load(repo)

fetched.flats[0].ringDoorbell()
