[![test-workflow][test-badge]][test-workflow] [![perf-workflow][perf-badge]][perf-workflow] [![coverage-workflow][coverage-badge]][coverage-report] ![npm bundle size][npm-size]

# :cd: automap

Store [OOP][oop] object-graphs in [Redis][redis]

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
  + [Unit tests](#tests)
  + [Performance tests](#tests)
  + [Coverage](#tests)
- [Contributing](#contributing)
- [Authors](#authors)

## Install

```bash
npm i https://github.com/nicholaswmin/automap
```

> [!IMPORTANT]  
> unpublished WIP

## Usage

This module exports a `Repository`:

- `repository.save(object)` to save an object graph
- `repository.fetch({ id: 'foo' })` to fetch it back

Assume you have a `Building` which contains `Flats`:

```js
const building = new Building({
  id: 'kensington',
  flats: [
    { id: 101 },
    { id: 102 }
  ]
})
```

You can save it:

```js
import { Repository } from 'automap'

const repo = new Repository(Building, new ioredis())

const building = new Building({
  id: 'kensington',
  flats: [
    { id: 101 },
    { id: 102 }
  ]
})

await repo.save(building)
```

and fetch it back:

```js
const building = await repo.fetch({
  id: 'kensington'
})

building.flats[0].doorbell()
// 🔔 at flat: 101 !

for (let flat of building.flats)
  console.log(flat)
  // { id: '101' }, { id: '102' },...
```

> [!NOTE]
> `repo.fetch` rebuilds the entire object graph using the correct type,
> including any nested types.

### Model definition

An object graph is persistable if it:

1. has an `id` property set to a unique value.
2. uses the `List` type for list-like data, instead of an [`Array`][array].

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

  doorbell() {
    console.log(`🔔 at flat: ${this.id}`)
  }
}
```

### Lazy Loading

Sometimes you won't need to load the contents of a list initially.   
You might want to load it's contents after you fetch it, or even none at all.

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
const building = await repo.fetch({
  id: 'kensington'
})

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

    // ! List instead of Array
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

const list = new List({
 from: [1, 2, 3]
})

for (const item of list)
  console.log(item.constructor.name, item)

// Number 1, Number 2 ...

console.log(Array.isArray(list)) // true
```

... you can also specify a `type` parameter to cast to a type:

```js
const list = new List({
 type: String,
 from: [1, 2, 3]
})

for (const item of list)
  console.log(item.constructor.name, item)

// String '1', String '2' ...
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

All keys/values saved in Redis follow a canonical and *human-readable* format.

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

These commands run in [constant-time `(O1)`][const], except `HGETALL` which
runs in [linear-time `(On)`][linear].

### List items without `id`

List items without an `id` property will use the `index`; their current
position in the list, as the separator.

If the flats didn't have an `id` and they contained a list of `Persons`,
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

These methods ensure updates are both performant and [atomic][atomic][^1].

#### Fetch

In contrast, fetching an object graph is not atomic.  

### Nested Lists

This module allows for an arbitrary amount of nesting of lists, so you can
have a list, inside another list, inside another list and so on...

But you should note the following ...

### Time-complexity

> This section briefly describes the [time-complexity][time] of possible input
> configurations.
>
> Note that in these time-complexity speculations are solely in the context
> of network roundtrips since they are by far the biggest bottleneck in
> most cases.

#### Flat lists

Object graphs which don't have lists nested inside other lists, are fetched
in a process that exhibits an almost
[constant-time complexity O(1)][const][^3][^4].

There's no network roundtrip involved for each list, or even separate requests
since this module uses a small Lua script which allows something akin to
an [`mget`][mget], but for hashes.

#### Nested lists

In contrast, fetching object graphs which have nested lists is a process which
performs in [quadratic-time O(n<sup>2</sup>)][qtc], at a minimum.

Every nesting level increases the exponent by `1` so you can easily jump from
O(n) to O(n<sup>2</sup>) then O(n<sup>3</sup>) and so on.

So while nested lists are supported, they are *not* recommended.

This particular issue can be solved in better time complexity with
some rudimentary assumptions and some slight tradeoffs,
like assuming that if 1 List item has a List, then all of them probably do -
but for now this problem is ignored as irrelevant.

## Alternatives

### Saving encoded JSONs

A small enough object-graph can easily get away with:

- `JSON.stringify(object)`
- `SET building:kensington json`
- `GET building:kensington`

and `JSON.parse(json)`

This is a simple, highly efficient and inherently atomic operation.

The obvious caveat is that you cannot fetch individual list items directly
from Redis since you would always need to fetch and parse the entire graph,
but for (probably most) use-cases that's simply just a non-problem.

### Redis JSON

If [Redis JSON][redis-json] is available then you should use that instead.

Half the issues this module attempts to solve are solved out-the-box
by using Redis JSON directly.

### Alternative modules

[Redis-OM][redisom]

A full-blown object mapper which of course requires schema definitions.

## Tests

install test deps:

```bash
npm ci
```

run unit tests:

```bash
npm test
```

run performance tests:

```bash
npm run test:perf
```

produce a test coverage report:

```bash
npm run test:coverage
```

run meta tests:

```bash
npm run test:meta
```

> performance & integration tests require a [Redis Server][redis-i] running
> at `:6379`
>
> "meta tests" refers to [non-functional][non-func] tests, i.e `npm audit` etc

## Contributing

Read the [contribution guidelines][contributing].

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

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

[test-badge]: https://github.com/nicholaswmin/automap/actions/workflows/test:unit.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/automap/actions/workflows/test:unit.yml

[perf-badge]: https://github.com/nicholaswmin/automap/actions/workflows/test:perf.yml/badge.svg
[perf-workflow]: https://github.com/nicholaswmin/automap/actions/workflows/test:perf.yml

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
[redis-i]: https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/
[non-func]: https://en.wikipedia.org/wiki/Non-functional_requirement
