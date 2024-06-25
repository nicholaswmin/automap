[![test-workflow][test-workflow-badge]][ci-test]

# automap
tiny and schemaless Redis ORM-"ish" microframework [WIP]

Serialize an [OOP-y][oop] instance to Redis and get it back, properly
instantiated.

## Usage

This module exports a `Repository` which you set up, then call:

- `repository.save(object)` to save an object
- `repository.fetch('foo')` to fetch it back

```js
import ioredis from 'ioredis' // or 'node-redis'
import { Repository } from 'automap'

// setup your repository
const repo = new Repository(Building, ioredis())

// create a Building with Flats
const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})

await repo.save(building)
// saved!
```

then to fetch it back:

```js
const building = await repo.fetch('kensington')

building.flats[0].ringDoorbell()
// Doorbell 🔔 at flat: 101 !

for (let flat of building.flats)
  console.log(flat)
  // { id: '101' }, { id: '102' },...
```

> [!NOTE]
> `repo.fetch` rebuilds the entire object graph using the correct type,
> including any nested types.

## Defining models

This package is not an ORM so there's no schema definition.   
You use your own object-graphs.

The only difference is that you should use a `List` instead of a regular
`Array` to define list-like structures.

### Example

A `Building` with `Flats`:

```js
import { List } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new List({ // <- Use List instead of Array (!)
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

> [!NOTE]
> `List` is a direct subclass of an `Array` so they behave *exactly* the same.  
> For example: `Array.isArray(list) // true`
>

### Lazy Loading

The module exports a `LazyList` which is identical to a `List`,
except that it's contents are *not* fetched automatically.

Instead, you need to explicitly call `list.load()` when, and if, you need
it.

```js
import { LazyList } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({ // <- Use LazyList
      items: flats,
      construct: item => new Flat(item)
    })
  }
}
```

and then:

```js
const building = await repo.fetch('kensington')

console.log(building.flats)
// [] (empty)

await building.flats.load(repo)

console.log(building.flats)
// [ Flat { id: '101' }, Flat { id: '102' }, ...]
```

## Redis Data Structure

All keys/values saved into Redis follow a canonical and most importantly,
human-readable format.

The idea is that you might stop using this module altogether, or simply
need to directly get list items from Redis; you should always have a
crystal-clear data structure in Redis that you can easily follow.

For example, in the above example, the flats are saved in the following hash:

```
building:kensington:flats

| Field 	| Value                       	|
|-------	|-----------------------------	|
| 101   	| {"i":0,"json":{"id":"101"}} 	|
| 102   	| {"i":1,"json":{"id":"102"}} 	|
| 103   	| {"i":2,"json":{"id":"103"}} 	|
```

You can fetch a single flat in [constant-time `(O1)`][const] simply by:

```
HGET building:kensington:flats 101
```

or fetch all the flats:

```
HGETALL building:kensington:flats
```

The `Building` itself is saved as:

```
building:kensington
```

which you can easily get by:

```
GET building:kensington
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

### Reason

A well-designed OOP structure can perfectly capture the semantics and flow
of your business-logic or domain.

Redis is an extremely high-performance datastore but it's API is as technical
as it gets - it cannot capture any semantics of business logic.

This package allows you to keep your OOP structures and use Redis for
persistence but without incurring a mapping performance penalty; which would
completely defeat the entire purpose of using Redis for persistence.

It does so by assuming that your object-graph has lists/arrays, which can
get big; so it decomposes those lists into manageable pieces that can be
saved more efficiently while also allowing more flexibility into whether
they are fetched with the rest of the object-graph.


### Where this is unnecessary

A small enough object-graph can easily get away with:

- `JSON.stringify(object)`
- `SET building:kensington json`
- `GET building:kensington`

and `JSON.parse(json)`

This is an extremely simple and efficient operation.

If you don't have, and dont expect to have, big lists in your object-graphs,
you should use this method instead of this package.

The additional caveat is that you cannot fetch individual list items; you
always need to parse the entire graph which for some use-cases is entirely ok.

### Why not Redis JSON

Redis JSON is not a native datatype in Redis.

A lot of managed cloud Redis providers do not allow it's use.


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


[test-workflow-badge]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml

[oop]: https://en.wikipedia.org/wiki/Object-oriented_programming
[redis]: https://redis.io/
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[atomic]: https://en.wikipedia.org/wiki/Atomicity_(database_systems)
[pipe]: https://en.wikipedia.org/wiki/HTTP_pipelining
