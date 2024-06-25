[![test-workflow][test-workflow-badge]][ci-test]

# automap
tiny and schemaless Redis ORM-"ish" microframework [WIP]

Serialize an [OOP-y][oop] instance to [Redis][redis] and get it back, properly
instantiated.

## Usage

This module exports a `Repository` and a `List` class, which is a drop-in
replacement for an `Array`(subclass of an `Array`).

When you pass an object-graph to `repository.save(object)` it:

- Decomposes all the lists it finds and saves them as a
  [Redis:Hash][redis-hash]
- Saves the rest of the object-graph as a regular [Redis:String][redis-string]

### Example

A `Building` which contains `Flats`:

```js
import { List } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new List({ // <-- Use List instead of Array (!)
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
```

and then to save it:

```js
import ioredis from 'ioredis' // or 'node-redis'
import { Repository } from 'automap'

// setup your repository
const repo = new Repository(Building, ioredis())

// create a Building with Flats
const building = new Building({ i
  id: 'kensington-gardens',
  flats: ['102', '103']
})

await repo.save(building) // saved!
```

then to fetch it back:

```js
const building = await repo.fetch('kensington-gardens')

console.log(building)

building.flats[0].ringDoorbell()
// Doorbell 🔔 at flat: 102 !

for (let flat of building.flats)
  console.log(flat) // { id: '101' }... { id: '102' }
```

`repo.fetch` rebuilds the entire object graph using the correct type.

## Lazy Loading

The module exports a `LazyList` as well.

It is identical to a `List`, except that it's contents are not fetched
automatically.

Instead, you need to explicitly call `list.load()` when (and if) you need
it.

```js
class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({ // <-- Use LazyList instead of List
      items: flats,
      construct: item => new Flat(item)
    })
  }
}
```

and then:

```js
const building = await repo.fetch('kensington-gardens')

console.log(building.flats) // [] (empty)

await building.flats.load(repo)

console.log(building) // [ Flat { id: '102' }, Flat { id: '103' }]
```

### Saving Format

All keys/values saved into Redis follow a canonical and most importantly,
human-readable format.

For example, in the above example, the flats are saved in the following hash:

```
building:kensington-gardens:flats

| Field 	| Value                       	|
|-------	|-----------------------------	|
| 101   	| {"i":0,"json":{"id":"101"}} 	|
| 102   	| {"i":1,"json":{"id":"102"}} 	|
| 103   	| {"i":2,"json":{"id":"103"}} 	|
```

You can easily fetch a single flat in [constant-time `(O1)`][const]
simply by:

```
HGET building:kensington-gardens:flats 101
```

or fetch all the flats:

```
HGETALL building:kensington-gardens:flats
```

The `Building` itself is saved as:


```
building:kensington-gardens
```

which you can easily get by:

```
GET building:kensington-gardens
```

## Notes

### Atomicity

Each found list is decomposed into a single Redis `HSET` command.

All `HSET` commands are then packaged into a singular, [pipelined][pipe] and
[fully-atomic][atomic] transaction.

### Arbitrary nesting depth

This module allows an arbitrary amount of nesting of lists, so you can
have a list, inside another list, inside another list and so on...

The way it works is by doing a [Breadth-First traversal][bfs] of the passed
object-graph, then accumulating the nodes as it exits the branch;

This allows a decomposition of the innermost lists *first* which guarantees
that a list-item can only appear in Redis, *exactly-once*; there
is no duplication of data, regardless of nesting-level.

That being said, nested lists are fetched in
[Quadratic Time Complexity O(n^2)][qtc] so going too crazy on the nesting
depth is not recommended.


[test-workflow-badge]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml

[oop]: https://en.wikipedia.org/wiki/Object-oriented_programming
[redis]: https://redis.io/
[atomic]: https://en.wikipedia.org/wiki/Atomicity_(database_systems)
[pipe]: https://en.wikipedia.org/wiki/HTTP_pipelining

## Test

```bash
npm test
```

Runs all tests, both unit-tests and integration-tests.

### Test coverage

```bash
npm run test-coverage
```

Produces a test coverage report


## License

> MIT No Attribution License
>
> Copyright (c) 2024 Nicholas Kyriakides
>
> Permission is hereby granted, free of charge, to *any person* obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so.


[redis-hash]: https://redis.io/docs/latest/develop/data-types/hashes/
[redis-string]: https://redis.io/docs/latest/develop/data-types/strings/
[bfs]: https://en.wikipedia.org/wiki/Breadth-first_search
[const]: https://en.wikipedia.org/wiki/Time_complexity#Constant_time
[qtc]: https://en.wikipedia.org/wiki/Time_complexity#Sub-quadratic_time
