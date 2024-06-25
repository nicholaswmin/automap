[![test-workflow][test-workflow-badge]][ci-test]

# automap

Efficiently store complex object graphs in Redis

## Usage

This module exports a `Repository` which you set up, then call:

- `repository.save(object)` to save an object
- `repository.fetch('foo')` to fetch it back

### Example

Assume you have a `Building` which contains an array of `Flats`:

```js
import { Repository } from 'automap'

const repo = new Repository(Building, new ioredis())

const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})

await repo.save(building)
// saved!
```

and to fetch it back:

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

This package is not an OM/ORM so there's no schema definition.

To make an object graph persistable just:

- Ensure you use the provided `List` type instead of an [`Array`][array]
  when defining list-like data.
- Ensure that at least your root object has an `id` property set to a
  unique value.  
  This `id` is used to fetch your item back.

### Example

A `Building` with `Flats`:

```js
import { List } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new List({ // <- Use List instead of Array (!)
      type: Flat,
      from: flats
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

### Lazy Loading

Sometimes you won't need to load the contents of a list initially.  
You might want to load it's contents later or none at all.

In that case, use a `LazyList` instead of a `List`.


```js
import { LazyList } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({ type: Flat, from: flats })
  }
}
```

... and load its contents by calling `list.load()`:

```js
const building = await repo.fetch('kensington')

console.log(building.flats)
// [] (empty)

await building.flats.load(repo)

console.log(building.flats)
// [ Flat { id: '101' }, Flat { id: '102' }, ...]
```

### The `List` type

Both provided lists - `List`/`LazyList` - are direct subtypes of
the native [`Array`][array], therefore they behave *exactly* the same.

They also provide an interface for casting to a type:

```js
const list = new List({ type: String, from: [1, 2, 3] })

for (const item of list)
  console.log(item.constructor.name, item)

// String '1', String '2', String '3' ...

console.log(Array.isArray(list)) // true
```

... you can omit the `type` property:

```js

const list = new List({ from: [1, 2, 3] })

for (let i = 0; i < list.length; i++)
  console.log(list[i].constructor.name, list[i])

// Number 1, Number 2, Number 3 ...
```

... or just use it like a regular `Array`:

```js
const array = new List(1, 2, 3)

const two = array.find(num => num === 2)

console.log(two) // 2
```

## Redis Data Structure

All keys/values saved into Redis follow a canonical and most importantly
*human-readable* format.

The idea is that you might stop using this module altogether or simply
need to directly get list items from Redis. You should always have a simple
and clear data structure in Redis that you can easily follow.

Assuming the above example, our flats are saved under this Redis key:

```
building:kensington:flats
```

which is a [Redis Hash][redis-hash] with the following shape:


| Field 	| Value                       	  |
|-------	|-----------------------------	  |
| 101   	| `{"i":0,"json":{"id":"101"}}` 	|
| 102   	| `{"i":1,"json":{"id":"102"}}` 	|
| 103   	| `{"i":2,"json":{"id":"103"}}` 	|


Therefore if you need to access an individual flat directly from Redis,
you can simply run:

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

All of these commands occur in [constant-time `(O1)`][const].

## Notes

### Reason

A well-designed OOP structure can perfectly capture the semantics and flow
of your business-logic or domain.

Redis is a high-performance datastore but it's API is as technical
as it gets; it cannot capture *any* semantics of business logic.

This package allows you to keep your OOP structures and use Redis for
persistence yet without incurring a mapping performance penalty, which would
defeat the entire purpose of using Redis for persistence.

It does so by assuming that your object-graph has lists/arrays, which can
get big; so it decomposes those lists into manageable pieces that can be
saved more efficiently while also allowing for flexibility into whether
they can be lazy-loaded.

### Atomicity

Each found list is decomposed into a single Redis `HSET` command.

All `HSET`s are then packaged into a single [pipelined][pipe] transaction
before being sent down the wire.

This keeps updates relatively performant and *always* [atomic][atomic].

### Nested Lists

This package allows for an arbitrary amount of nesting of lists, so you can
have a list, inside another list, inside another list and so on...

It does so by doing a [Breadth-First traversal][bfs] of the passed
object-graph and then accumulating any lists as it exits the current
traversed branch.

This allows a decomposition of the innermost lists *first* so a list with
3 levels of nesting will save 4 list hashes, and every list item will be
saved *exactly-once*.

but...

### Time-complexity of nested lists

Lists without any nesting are fetched in
[constant-time complexity O(1)][const][^1].

In contrast, nested lists have a [quadratic-time complexity O(n^2)][qtc].

These time-complexity bounds involve network requests,
which are *orders of magnitude* slower than usual algorithmic time
complexity problems.

So while nested lists are supported and as efficiently as possible,
they are *not* recommended

Nested `LazyList` lists won't have an impact on the initial fetching but
they will eventually exhibit the same behaviour when you call `list.load()`
to load their contents.


### Where this is unnecessary

A small enough object-graph can easily get away with:

- `JSON.stringify(object)`
- `SET building:kensington json`
- `GET building:kensington`

and `JSON.parse(json)`

This is an extremely simple, efficient and inherently atomic operation.

If you don't dont expect to have big lists in your object-graphs,
you should definitely use this method instead of this package.

The additional caveat is that you cannot fetch individual list items directly
from Redis. You would would always need to fetch and parse the entire graph
which for some, if not most, use-cases is entirely ok.

### Why not Redis JSON

Redis JSON is not a native datatype in Redis.

A lot of managed cloud Redis providers do not allow it's use.


## Test

Install dependencies:

```bash
npm ci
```

then:

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


## Footnotes

[^1]: The time complexity bounds described are in the context of fetching data from a remote service (Redis).
      As described, this package also performs a breadth-first graph traversal which is `O(V + E)` but since
      this step does not involve any network roundtrips, it's assumed to have a negligible impact.

[test-workflow-badge]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml

[oop]: https://en.wikipedia.org/wiki/Object-oriented_programming
[redis]: https://redis.io/
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[atomic]: https://en.wikipedia.org/wiki/Atomicity_(database_systems)
[pipe]: https://en.wikipedia.org/wiki/HTTP_pipelining
[redis-hash]: https://redis.io/docs/latest/develop/data-types/hashes/
[redis-string]: https://redis.io/docs/latest/develop/data-types/strings/
[bfs]: https://en.wikipedia.org/wiki/Breadth-first_search
[const]: https://en.wikipedia.org/wiki/Time_complexity#Constant_time
[qtc]: https://en.wikipedia.org/wiki/Time_complexity#Sub-quadratic_time
