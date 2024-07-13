# benchmark

> benchmarks the [throughput][throughput] of this module

> [!CAUTION]  
> This test runs a [`FLUSHALL`][flushall] on its connected Redis instance.

## Run

## Locally

```bash
REDIS_URL=<redis-url> npm run benchmark
```

## On Heroku

Heroku only allows webservers on it's platform.

To allow benchmarking, we provide a [fake webserver][fake-server] to the
`npm start` script.

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

- Fetch a `paper`
- Create a `board`
- Add an `item` to a random board
- Save the `paper`

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
- `ITEM_PAYLOAD_KB`: item size, added to a board in each task, in kilobytes
- `MAX_BOARDS`: maximum number of created boards, per paper
- `MAX_WORKER_BACKLOG`: max amount of unprocessed tasks in a `worker`
  before the test concludes.

### Breaking point

The test is considered *concluded* when a worker has accumulated a
`backlog` of > 10 `tasks`.  

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
