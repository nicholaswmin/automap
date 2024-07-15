// run this: `npm run example`

import ioredis from 'ioredis'

import { Repository } from '../../index.js'
import { Building, Flat, Mail } from '../../test/util/model/index.js'

const repo = new Repository(Building, new ioredis())

// An object graph ...

const building = new Building({
  id: 'foo',
  visitors: [{ name: 'John' }, { name: 'Mary' }],
  flats: [
    new Flat({ id: 101, mail: [] }) ,
    new Flat({
      id: 102,
      mail: [
        new Mail({ id: 1, text: 'hello' }),
        new Mail({ id: 2, text: 'world' })
      ]
    })
  ]
})

// save it

await repo.save(building)

console.log('-', building.constructor.name, 'saved ...')

// fetch it

let fetched = await repo.fetch('foo')

console.log('-', fetched.constructor.name, 'fetched ...')

// load lazy list via `list.load()`

await fetched.visitors.load(repo)

console.log(
  '-',
  fetched.constructor.name,
  'has',
  fetched.visitors.length,
  'visitors'
)

console.log(fetched)

fetched.flats[0].ringDoorbell()

// fetch it again

fetched = await repo.fetch('foo')

// load lazy list again

await fetched.flats.load(repo)

// add a bit of mail

for (let i = 0; i < 50; i++)
  fetched.flats[0].addMail({ text: 'Hellooo' })

console.log(
  '-',
  'Flat', fetched.flats[0].id,
  'has',
  fetched.flats[0].mail.length,
  'mails'
)

// save it again

await repo.save(building)

console.log('-', building.constructor.name, 'saved again ...')

await repo.redis.disconnect()
