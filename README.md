[![test-workflow][test-workflow-badge]][ci-test]

# automap

Efficiently store complex object graphs in Redis

- [Usage](#usage)
- [Defining models](#defining-models)
  * [Basic](#example-1)
  * [Lazy loading](#lazy-loading)
  * [The List type](#the-list-type)
- [Data structure](#redis-data-structure)
- [Reason](#reason)
- [Performance](#performance)
  * [Atomicity](#atomicity)
  * [Time complexity](#time-complexity)
    + [Flat lists](#flat-lists)
    + [Nested lists](#nested-lists)
- [Do you *really* need this?](#where-this-is-unnecessary)
  * [Why not Redis JSON](#why-not-redis-json)
  * [Alternatives](#alternatives)
- [Running tests and test coverage](#test)

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

All of these commands occur in [constant-time `(O1)`][const], except
`HGETALL` which is [linear-time `(On)`][linear].

### List items without `id`

List items without an `id` property will use the `index`; their current
position in the list, as the separator.

So if the flats didn't have an `id` and they contained a list of `Persons`,
the persons of the 1st flat would be saved under key:

```
building:kensington:flats:0:persons
```

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

## Performance

This package assumes an acceptable response time of maximally `10ms` but since
there's no benchmarks, a sample or a controlled test environment this means
next to nothing for the time being and is just a personal guideline.

For reference, a single Redis `GET` can run in sub-millisecond time assuming
your services are running relatively close-by.

### Atomicity

Each found list is decomposed into a single Redis `HSET` command.

All `HSET`s are then packaged into a single [pipelined][pipe] transaction
before being sent down the wire.

This keeps updates performant and *always* [atomic][atomic].

In contrast, fetching an object graph is not entirely atomic.
The part that breaks this guarantee is only when fetching the final
root object. This is fixable but currently it is not.

Note that the above are extreme cases in practice so unless you're
dealing with very high concurrency numbers, you probably won't ever experience
an issue in this regard, at all.

There's a ton of methods for implementing a concurrency-control algorithm
on top of Redis - some are dead-simple mutex locks, others come ready
as a library and others almost require a 4-year course in Theoretical
Computer Science; if you have such a requirement you probably shouldn't be
using this package though.

### Nested Lists

This package allows for an arbitrary amount of nesting of lists, so you can
have a list, inside another list, inside another list and so on...

It does so by doing a [BFS traversal][bfs] of the passed object-graph then
marking the lists which need to be mapped as it exits the currently
traversed branch.

This allows a decomposition of the innermost lists *first* so a list with
3 levels of nesting will save 4 list hashes, and every list item will be
saved *exactly-once*.

this is nothing special but you should note the following...

### Time-complexity

> This section describes the [algorithmic time-complexity][time] of different
> object graph configurations,  
> but only in the context of network roundtrips rather than local
> computations.  
>
> You should assume that locally and at the very minimum, a
> [BFS traversal][bfs] will always run at least once for both `.save()`
> and `.fetch()` against the entire object graph.  
> This is followed by an additional [Quicksort][qs][^1] step in `.fetch`
> against *every* list.
>
> If you don't know what these terms mean, that's fine, as long as you
> **avoid nesting lists inside other lists**.  
> You could assemble a structure that takes literal *years* to fetch
> instead of milliseconds or at the very least skew the response times
> towards entirely unacceptable values.

#### Flat lists

Object graphs which don't have lists nested inside other lists,
are fetched in a process that runs in [constant-time O(1)][const][^2][^3].

There's no network roundtrip involved for each list since this package
uses a Lua script which allows something akin to a [`mget`][mget],
but for hashes.

#### Nested lists

In contrast, fetching object graphs which have nested lists is a process which
performs in [quadratic-time O(n<sup>2</sup>)][qtc], at a minimum.

Note that these time complexity bounds involve network requests,
which are *orders of magnitude* slower than a run-of-the-mill classroom time
complexity problem.

So while nested lists are supported, they are not recommended.

Common-sense workarounds:

- Don't use a `List`. Keep the list as an `Array`. This means it won't be
  decomposed and in some cases it might be an acceptable tradeoff, if
  your nested lists simply contain a minimal amount of items.
  If those are your *only* lists, well - then why are you reading this?
  [You don't need this package](#where-this-is-unnecessary).

- Use a `LazyList`. They won't have an impact on the initial fetching but
  they will eventually exhibit the same behaviour when you call `list.load()`
  to load their contents.

- Avoid nested lists in your object graph in general.

There are potential workarounds to these problems but some require
defining schemas and the philosophy of this package is to be schema-less,
simple and unobtrusive.

### Where this is unnecessary

A small enough object-graph can easily get away with:

- `JSON.stringify(object)`
- `SET building:kensington json`
- `GET building:kensington`

and `JSON.parse(json)`

This is a dead-simple, highly efficient and inherently atomic operation.

If you don't expect to have big lists in your object graphs,
you should just use this method instead;   
you don't need this package at all.

The small caveat is that you cannot fetch individual list items directly
from Redis since you always need to fetch and parse the entire graph,
which for most use-cases is entirely ok.

### Why not Redis JSON

Redis JSON is not a native datatype in Redis.

A lot of managed cloud Redis providers do not allow it's use.

It goes without saying that if you can use it then by all means, you should.

### Alternatives

[Redis-OM][redisom]

This is a full-blown Object-Mapper which of course requires
schema definitions. It's like an ORM but for non-relational datastores
like Redis.

Note:

- This package doesn't involve defining relationship between entities so
  it's not aiming to be an OM itself hence it's not really an "alternative"
  but if you confused this for an OM/ORM and got disappointed, this is what you
  should be looking at.

- I have no idea how fast it is with lists. It's unlikely to be faster
  than this package, especially when no nesting is involved but I could very
  well be wrong.

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

[^1]: This is the result of using `Array.sort` using numerical comparators,
      which Node.js most likely implements using [Quicksort][qs]
      ; at least Chrome does so.   
      This is an `O(n<sup>2</sup>) operation in it's worst-case.

[^2]: The time complexity bounds described are in the context of fetching data
      from a remote service (Redis).
      As described, this package also performs a breadth-first graph traversal
      which is `O(V + E)` but since
      this step does not involve any network roundtrips, it's assumed to have a
      negligible impact.  

[^3]: Both `mget` and our custom `hgetall` run in [linear-time O(n)][const]
      when the request lands in Redis.

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
[mget]: https://redis.io/docs/latest/commands/mget/
[redisom]: https://github.com/redis/redis-om-node
[qs]: https://en.wikipedia.org/wiki/Quicksort
[time]: https://en.wikipedia.org/wiki/Time_complexity
