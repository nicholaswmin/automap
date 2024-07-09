[![test-workflow][test-badge]][test-workflow] [![coverage-workflow][coverage-badge]][coverage-report] ![npm bundle size][npm-size]

# :cd: automap

Store [OOP][oop] object-graphs in [Redis][redis]

---

> [!IMPORTANT]  
> Unpublished WIP

---

- [Install](#install)
- [Usage](#usage)
  * [Model definition](#model-definition)
  * [Lazy loading](#lazy-loading)
  * [`List` instead of `Array`](#the-list-types)
  * [Runnable example](#runnable-example)
- [Redis data structure](#redis-data-structure)
- [Performance](#performance)
  * [Atomicity](#atomicity)
  * [Time complexity](#time-complexity)
    + [Flat lists](#flat-lists)
    + [Nested lists](#nested-lists)
- [Alternatives](#alternatives)
- [Tests](#tests)
  + [Run](#tests)
  + [Test coverage](#test-coverage)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)


## Install

```bash
npm i https://github.com/nicholaswmin/automap
```

## Usage

This module exports a `Repository` which you set up, then call:

- `repository.save(object)` to save an object
- `repository.fetch('foo')` to fetch it back

Assume you have a `Building` which contains an array of `Flats`:

```js
const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})
```

You can save it:

```js
import { Repository } from 'automap'

const repo = new Repository(Building, new ioredis())

const building = new Building({
  id: 'kensington',
  flats: ['101', '102', '103']
})

await repo.save(building)
```

and fetch it back:

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

### Model definition

To make an object graph persistable:

1. Use the provided `List` type for list-like data, instead of an
  [`Array`][array].
2. Ensure your root object has an `id` property set to a unique value.

Same example as above, a `Building` with `Flats`:

```js
import { List } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new List({
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
You might want to load it's contents later; after you fetch it or even
none at all.

In that case, use a `LazyList` instead of a `List`.

```js
import { LazyList } from 'automap'

class Building {
  constructor({ id, flats = [] }) {
    this.id = id
    this.flats = new LazyList({
      type: Flat,
      from: flats
    })
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

### The `List` types

List-like data must use the `List` or `LazyList` types instead of an
[`Array`][array].  

This allows decomposing those lists into manageable pieces that can be saved
and retrieved far more efficiently.

```js
class Building {
  constructor({ id, flats = [] }) {
    this.id = id

    // Using a List instead of Array (!)
    this.flats = new LazyList({
      type: Flat,
      from: flats
    })
  }
}
```

Both are subtypes of the native [`Array`][array]
and behave *exactly* the same:

```js

const list = new List({ from: [1, 2, 3] })

for (const item of list)
  console.log(item.constructor.name, item)

// Number 1, Number 2, Number 3 ...

console.log(Array.isArray(list)) // true
```

... you can also specify a `type` parameter to cast to a type:

```js
const list = new List({ type: String, from: [1, 2, 3] })

for (const item of list)
  console.log(item.constructor.name, item)

// String '1', String '2', String '3' ...
```

... and use it like a regular `Array`:

```js
const array = new List(1, 2, 3)

const two = array.find(num => num === 2)

console.log(two)
// 2
```

You can still use a regular `Array` for list-like data, which you don't
expect to become big enough to warrant decomposition when saving in Redis.

### Runnable example

The `Building` example demonstrated above
can be [found here][runnable-example].

You can run it with:

```bash
npm run example
```

## Redis data structure

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


If you need to access an individual flat directly from Redis,
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

## Performance

### Atomicity

#### Save

- Each found list is decomposed into a single Redis `HSET` command.
- All `HSET`s are then packaged into a single [pipelined][pipe] transaction
before being sent down the wire.

Additionally, there's a simple Lua script which allows something akin
to a [`mget`][mget], but for hashes.

These methods are considered enough in ensuring updates are
both performant and [atomic][atomic][^1].

#### Fetch

In contrast, fetching an object graph is not entirely atomic.
The part that breaks this guarantee is only when fetching the final
root object. This is fixable but currently it is not.

### Nested Lists

This module allows for an arbitrary amount of nesting of lists, so you can
have a list, inside another list, inside another list and so on...

It does so by doing a [BFS traversal][bfs] of the passed object-graph then
marking the lists which need to be mapped as it exits the currently
traversed branch.

This allows a decomposition of the innermost lists *first* so a list with
3 levels of nesting will save 4 list hashes intead of 1 big parent hash
with no decomposed children.

So nested lists are supported and correctly decomposed.

But you should note the following...

### Time-complexity

> This section briefly describes the [time-complexity][time] of possible input
> configurations.
>
> Note that in these time-complexity speculations are solely in the context
> of network roundtrips and/or requests since they are by far the biggest
> bottleneck in most cases.
>
> They don't describe local computations and there's not much attention
> being paid in that regard, in general.

#### Flat lists

Object graphs which don't have lists nested inside other lists,
are fetched in a process that exhibits an almost
[constant-time complexity O(1)][const][^3][^4].

There's no network roundtrip involved for each list, or even separate requests
since this module uses a small Lua script which allows something akin to
an [`mget`][mget], but for hashes.

#### Nested lists

In contrast, fetching object graphs which have nested lists is a process which
performs in [quadratic-time O(n<sup>2</sup>)][qtc], at a minimum.

Every nesting level increases the exponent by `1` so you can easily jump from
O(n) to O(n<sup>2</sup>) then O(n<sup>3</sup>) and so on.

Note again that these aren't going to only run high counts of local iterations,
those are a non-problem in most cases - but they are going to create full
network roundtrips.

Just a brief calculation based on the above is enough to figure out that
even a tiny list with 5 items will become prohibitively expensive at even
the most basic nesting depth.

So while nested lists are supported, they are not
recommended in the slightest.

This particular issue can be solved in better time complexity with
some rudimentary assumptions and some slight tradeoffs,
like assuming that if 1 List item has a List, then all of them probably do -
but for now this problem is ignored as irrelevant.

Other basic workarounds:

- Don't use a `List`. Keep the list as an `Array`.
  This means it won't be decomposed and in some cases it might be an
  acceptable tradeoff, if your nested lists simply contain a minimal
  amount of items.
  If those are your *only* lists, well - then you should probably stop reading.
  [You simply don't need this module](#where-this-is-unnecessary).

- Use a `LazyList`? They won't have an impact on the initial fetching but
  they will eventually exhibit the same behaviour when you call `list.load()`
  to load their contents.

- Avoid nested lists in your object graph in general.

#### Local time complexity

You should assume that locally and at the very minimum, a
[BFS traversal][bfs] will always run at least once for both `.save()`
and `.fetch()`, against the entire object graph.  

This is followed by an additional [Quicksort][qs][^2] step in `.fetch`,
against *every* list.

There's almost zero attention being paid in assuring good time complexity
locally unless there's an obvious bottleneck.

## Alternatives

### Saving encoded JSONs

A small enough object-graph can easily get away with:

- `JSON.stringify(object)`
- `SET building:kensington json`
- `GET building:kensington`

and `JSON.parse(json)`

This is a simple, highly efficient and inherently atomic operation.

If you can get away with just using this you're absolutely set
and you should stop reading this.   

You simply don't need this module and none of the issues here apply to
you.

In some cases it's [even faster than RedisJSON][bench].

The obvious caveat is that you cannot fetch individual list items directly
from Redis since you would always need to fetch and parse the entire graph,
but for (probably most) use-cases that's simply just a non-problem.

### Redis JSON

If your cloud-provider supports [Redis JSON][redis-json], then you probably
use that instead.

We'd still build a similar mapper to this one but for our own internal reasons
that are probably specific to us; in general half the issues this module
attempts to solve are solved out-the-box by using RedisJSON directly.

### Alternative modules

[Redis-OM][redisom]

This is a full-blown Object-Mapper which of course requires
schema definitions. It's like an ORM but for non-relational datastores
like Redis.

## Tests

Install test dependencies:

```bash
npm ci
```

Run all tests:

```bash
npm test
```

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

### Test coverage

```bash
npm run test:coverage
```

## Contributing

Read the [Contribution Guidelines][contributing].

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

> MIT No Attribution License  
>
> SPDX: MIT-0
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

[^1]: Redis transactions do not assume the same atomicity and isolation
      context that a relational database might assume.
      By every definition they are atomic since they don't allow for
      partial updates, however the entire transaction can fail if client B
      updates a value while it's in the process of being modified by client A
      as part of a transaction.   
      Retries are not currently implemented.

[^2]: This is the result of using `Array.sort` using numerical comparators,
      which Node.js most likely implements using [Quicksort][qs]
      ; at least Chrome does so.   
      This is an `O(n<sup>2</sup>) operation in it's worst-case, I think.

[^3]: The time complexity bounds described are in the context of fetching data
      from a remote service (Redis).
      As described, this module also performs a breadth-first graph traversal
      which is `O(V + E)` but since
      this step does not involve any network roundtrips, it's assumed to have a
      negligible impact.  

[^4]: Both `mget` and the custom `hgetall` run in [linear-time O(n)][const]
      when the request lands in Redis but this is relative to the total number
      of keys in Redis. This might cause issues in some cases but it's not
      something that can be reasonably worked around anyway.



<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/automap/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/automap/actions/workflows/test.yml

[coverage-badge]: https://coveralls.io/repos/github/nicholaswmin/automap/badge.svg?branch=main
[coverage-report]: https://coveralls.io/github/nicholaswmin/automap?branch=main

[npm-size]: https://img.shields.io/bundlephobia/minzip/automap

<!--- /Badges -->

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
[linear]: https://en.wikipedia.org/wiki/Linear_search
[mget]: https://redis.io/docs/latest/commands/mget/
[redisom]: https://github.com/redis/redis-om-node
[redis-json]: https://redis.io/docs/latest/develop/data-types/json/
[qs]: https://en.wikipedia.org/wiki/Quicksort
[time]: https://en.wikipedia.org/wiki/Time_complexity
[bench]: https://redis.io/docs/latest/develop/data-types/json/performance/
[nicholaswmin]: https://github.com/nicholaswmin
[contributing]: .github/CONTRIBUTING.md
[runnable-example]: .github/example/index.js
