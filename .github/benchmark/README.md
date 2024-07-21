# benchmark

> benchmarks the [throughput][throughput] of this module

## Install

```bash
npm i
```


## Run

> [!CAUTION]
> This benchmark runs a [`FLUSHALL`][flushall] on its connected Redis instance.

## Locally

```bash
REDIS_URL=<redis-url> npm run benchmark
```

## On Heroku

Heroku only allows webservers on it's platform.

To allow benchmarking, we provide a [fake webserver][fake-server]
to the `npm start` script.

Heroku also needs a special configuration set to
install `devDependencies`:

```bash
heroku config:set NPM_CONFIG_PRODUCTION=false -a <app-name>
```

and to run the benchmark:

```bash
heroku run npm run benchmark --size=performance-l -a <app-name>
```

> Replace `<app-name>` with the Heroku app.
> A running Redis add-on is required.

The Heroku dynos for the `--size=<size>` parameter can be [found here][dynos].

> [!WARNING]
> Don't forget to deprovision/remove any added expensive Redis add-ons

## Overview

This benchmark is designed to measure the [throughput][throughput]
of horizontally deployed instances of this module.

### The task

The model used is a slightly tweaked-up version of the same `Building` with
`Flat`s example shown in the `README`.

You can find it [here][test-data]

- Fetch a `Building`
- Create a `Flat`
- Push a ~ 5KB `Mail` to a random Flat.
- Save the `Building`

### Setup

Tasks are run on [`worker`][worker] processes, created by the
[`cluster`][cluster] module.

- The `primary` sends a message to a `worker`
- A worker then runs the `task` *once* and captures timing information.

The primary sends messages at a predefined rate.
This rate is *global* and independent of the number of workers.

Workers are chosen using [*round-robin* scheduling][round-robin]

### Factors

- `TASKS_PER_SECOND`: message rate of the primary
- `NUM_WORKERS`: number of workers
- `ITEM_PAYLOAD_KB`: item size, added as `Mail` payload in each task, in kb's.
- `MAX_FLATS`: maximum number of created flats, per paper
- `MAX_WORKER_BACKLOG`: max amount of unprocessed tasks in a `worker`
  before the benchmark concludes.
- `MAX_UPDATE_PER_SECOND`: How often to update the results shown on screen.
  Set this to ~ 2 when benchmarking to a remote server and ~ 5 when benchmarking
  locally.
- `WARMUP_SECONDS`: Amount of seconds to take it easy at the beginning.

these "constants" are user-configurable when the benchmark starts up.

### Benchmark conclusion/threshold limits

The benchmark is considered *concluded* when a worker has accumulated a
`backlog` of > 10 `tasks`.

We assume that if this rate continues the worker will be entirely unable to
keep up.

## Authors

[@nicholaswmin][nicholaswmin]

[round-robin]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[cluster]: https://nodejs.org/api/cluster.html
[worker]: https://nodejs.org/api/cluster.html#class-worker
[nicholaswmin]: https://github.com/nicholaswmin
[flushall]: https://redis.io/docs/latest/commands/flushall/
[throughput]: https://en.wikipedia.org/wiki/Network_throughput
[dynos]: https://devcenter.heroku.com/articles/limits#dynos
[fake-server]: bench/fake-server.js
[test-data]: /test/model/index.js
