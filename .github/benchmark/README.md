# benchmark

> benchmarks the [throughput][throughput] of this module

> Recorded results can be [found here][results]

## Install

```bash
npm i
```

## Run

> [!CAUTION]
> This benchmark runs a [`FLUSHALL`][flushall] on its connected Redis instance.

## Locally

> assuming you're in root and this resides in a folder: `.github/benchmmark`

```bash
npm --prefix .github/benchmark install --omit=dev && npm --prefix .github/benchmark start
```


## Benchmarking on Heroku

### Fake server

Heroku only allows webservers on it's platform.

To allow benchmarking, we provide a [fake webserver][fake-server]
to the `npm start` script of the root of the project.

### Use a Pipeline Review app

Don't run this benchmark on a regular Heroku App app.

There is a big risk of leaving expensive add-ons running.

Instead create a [Review App][review-app] which autodestroys itself
on inactivity.

- Create a [Pipeline][pipeline] first, name it `benchmark`
- Checkout this repo to a branch, i.e `benchmark` and create a Pull Request
  - review apps function best as ephemeral apps of a PR
- Connect the pipeline to this repo
- Create a Review App spceifying this repo and branch `benchmark`
- Mark the Review App to `autodestroy=1day` when stale
- Provision necessary add:ons (Redis) on the Review App
  - Choose `Standard 1x` for dynos; the actual  dyno is chosen when we
    run the benchmark but bigger dynos require at least a `Standard-1x`
    on the Review App itself.
- Use the Review App as `--app` intead of a standard Heroku app when issuing
  the run commands, as seen below:

### Heroku run

- Push everything in the `benchmark` branch
- Make sure all add:ons are ready

and then:

```bash
heroku run --size=performance-l "npm --prefix .github/benchmark install --omit=dev  && npm --prefix .github/benchmark start" --app benchmark
```

> Replace `<app-name>` with the Heroku Review App `name`:
>
> Replace `--size=<size>` with with the desired size:
>
> The Heroku dynos for the `--size=<size>` parameter can be [found here][dynos].

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

Tasks are run on separate threads, created as [`fork()`][fork]-ed processes via
the [`child_process`][child_process] module.

- The `primary` sends a message to a `worker`
- A worker then runs the `task` *once* and captures timing information.

The primary sends messages at a predefined rate.
This rate is *global* and independent of the number of workers.

Workers are chosen using [*round-robin* scheduling][round-robin]

### Factors

> These might be out of date

- `TASKS_PER_SECOND`: message rate of the primary
- `TEST_DURATION_SECONDS`: max test duration. If still running, `test=success`
- `NUM_WORKERS`: number of concurrent threads processing tasks
- `ITEM_PAYLOAD_KB`: each task adds this payload to 1 `AppendList`, in kilobytes
- `MAX_FLATS`: maximum number of created List Items, per paper
- `MAX_WORKER_BACKLOG`: if worker has this many unproccesed tasks, `test=failed`
- `MAX_UPDATE_PER_SECOND`: How often to update the results shown on screen
- `MAX_WORKERS_DISPLAY`: How many workers to show in the runtime results
- `WARMUP_SECONDS`: Amount of seconds to take it easy at the beginning.

these "constants" are user-configurable when the benchmark starts up.

## Authors

[@nicholaswmin][nicholaswmin]

[round-robin]: https://en.wikipedia.org/wiki/Round-robin_scheduling
[child_process]: https://nodejs.org/api/child_process.html
[fork]: https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options
[nicholaswmin]: https://github.com/nicholaswmin
[flushall]: https://redis.io/docs/latest/commands/flushall/
[throughput]: https://en.wikipedia.org/wiki/Network_throughput
[dynos]: https://devcenter.heroku.com/articles/limits#dynos
[fake-server]: bench/fake-server.js
[test-data]: /test/util/model/index.js
[results]: results/
[review-app]: https://devcenter.heroku.com/articles/github-integration-review-apps
[pipeline]: https://devcenter.heroku.com/articles/pipelines
