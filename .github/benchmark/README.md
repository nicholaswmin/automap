# benchmark

> benchmarks the [throughput][throughput] of this module

> Recorded results from previous runs can be [found here][results]

## Install

```bash
npm i
```

## Run

> [!CAUTION]
> This benchmark runs a [`FLUSHALL`][flushall] on its connected Redis instance.

### Locally

> assuming you're in root and this resides in a folder: `.github/benchmmark`

```bash
npm --prefix .github/benchmark install --omit=dev && npm --prefix .github/benchmark start
```

### on Heroku

### Install prerequisites

Requires the [Heroku CLI][heroku-cli]

MacOS

```bash
# Install latest Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH
(echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/nicholaswmin/.bash_profile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Install Heroku CLI
brew tap heroku/brew && brew install heroku
brew install heroku/brew/heroku
```

### Fake server

Heroku only allows webservers on it's platform. To run a benchmark on Heroku
we need to "trick" it into thinking this is actually a web server.

To do so we provide a [fake webserver][fake-server] to the `npm start`
script of the root of the project.

### Use a Pipeline Review app

Don't run this benchmark on a regular Heroku App app.\
There is a big risk of forgetting expensive provisioned add-ons (i.e Redis)
running and thus incurring charges.

Instead, create a [Review App][review-app] which autodestroys itself
when inactive > 1 day.

- Checkout this repo to a branch, i.e `benchmark`, push all changes
  and create a Pull Request
  - review apps function best as ephemeral apps of a PR
- Go to [Heroku Dashboard][heroku-dash]
- Create a [Pipeline][pipeline] first, name it i.e: `benchmark`
  - Connect the pipeline to this repo
- Create a Review App on the pipeline, for this repo and branch `benchmark`
  - Configure the Review App to `autodestroy=1day` when stale
  - Provision necessary add-ons (i.e Redis) on the Review App
  - Choose at least `Standard 1x` as the size of the "webservice" dyno;
    the actual dyno is chosen when we run the benchmark but bigger dynos
    require at least a `Standard-1x` on the Review App itself.
- Use the Review App as `--app` intead of a standard Heroku app when issuing
  the run commands.

> note: review apps can take > 10 minutes to prepare when first created.\
>
> note: the "review app name" is *not* the same as the "pipeline name".\
> A review app name is usually the name of the branch + some random characters,
> i.e `"mybranch-abc123efg456"`.

### Provision necessary add-ons

[Heroku Redis][heroku-redis]:

This provisions a [Heroku Redis, Premium 5][redis-plans] instance:

```bash
heroku addons:create heroku-redis:premium-5 --app <review-app-name>
```

> note: replace `<app-name>` with the Heroku Review App name.

### Run the benchmark

```bash
heroku run --size=<dyno-size> "npm --prefix .github/benchmark install --omit=dev  && npm --prefix .github/benchmark start" --app <review-app-name>
```

> note: replace `<review-app-name>` with the Heroku Review App name.\
>
> note: replace `<dyno-size>` with with the desired dyno size.\
> available dyno sizes can be [found here][dynos].

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

- `TASKS_SECOND`: message rate of the primary
- `DURATION_SECONDS`: max test duration. If still running, `test=success`
- `THREAD_COUNT`: number of concurrent threads processing tasks
- `PAYLOAD_KB`: each task adds this payload to 1 `AppendList`, in kilobytes
- `MAX_ITEMS`: maximum number of created List Items, per paper
- `MAX_BACKLOG`: if worker has this many unproccesed tasks, `test=failed`

> note: these constants are user-configurable when the benchmark starts up.

> note these might be out of date.

## Authors

[@nicholaswmin][nicholaswmin]

## License

MIT-0 License

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
[heroku-cli]: https://devcenter.heroku.com/articles/heroku-cli
[heroku-dash]: https://dashboard.heroku.com/apps
[heroku-redis]: https://devcenter.heroku.com/articles/heroku-redis
[redis-plans]: https://elements.heroku.com/addons/heroku-redis#pricing
[review-app]: https://devcenter.heroku.com/articles/github-integration-review-apps
[pipeline]: https://devcenter.heroku.com/articles/pipelines
