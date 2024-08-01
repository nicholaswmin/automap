# benchmark

> benchmarks the [throughput][throughput] of this module
>
> Recorded results from previous runs can be [found here][results]

> [!CAUTION]
> This benchmark runs a [`FLUSHALL`][flushall] on its connected Redis instance.

## Install

```bash
npm i
```

## Run locally

Spin up a local Redis server:

```bash
brew install redis
redis-server
```

run benchmark:

```bash
npm start
```

## Run on Heroku

### Install prerequisites

Requires the [Heroku CLI][heroku-cli]

on MacOS:

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
- Use the Review App as `--app` intead of a standard Heroku app when issuing
  the run commands.

> Note: Review Apps can take > 10 minutes to prepare when first created.

> Note: A "review app name" is *not* the same as the "pipeline name". 
>
> A review app name would is usually: `branch-name + random characters`, 
> i.e `"mybranch-abc123efg456"`.
>
> The following sections assume you replace `<review-app-name>` with the 
> actual Review App name.
 
### Set appropriate dyno type

Heroku requires at least a `Standard 1x` as the type of the "webservice" dyno.

The actual benchmark dyno is chosen when we run the benchmark but bigger dynos
require at least a `Standard-1x` on the Review App itself.

```bash
heroku ps:type standard-1x --app <review-app-name>
```

### Provision necessary add-ons

This provisions a [Heroku Redis, Premium 5][redis-plans] instance:

```bash
heroku addons:create heroku-redis:premium-5 --app <review-app-name>
```

> Note: Remember to **deprovision** all provisioned add-ons.

### Run the benchmark

```bash
heroku run --size=performance-l "npm --prefix .github/benchmark install --omit=dev && npm --prefix .github/benchmark start" --app <review-app-name>
```

> Note: Replace `performance-l` with with the desired dyno size, *if needed*.  
>
> `performance-l` is a "large-ish", fast dyno with a lot of memory.  
>
> Available dyno sizes can be [found here][dynos].

### Deprovision add-ons/dynos

Deprovision all add-ons and dynos when done to avoid charges.

Remove add-ons:

```bash
heroku addons:destroy REDIS <review-app-name> --confirm <review-app-name>
```

> Note: This only destroys the Heroku Redis add-on.  
> This command must be run for *every* provisioned add-on.

List add-ons to verify none remains:

```bash
heroku addons --app <review-app-name>
```

> must return an empty list or `"no addons for app..."`

Switch to free dynos:

```bash
heroku ps:type eco --app <review-app-name>
```

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

The benchmark is run using the [`dyno` module][dyno-module], which runs
specified *tasks* on separate threads at a specified *task rate*.

The test should be considered a failure when a *task backlog* is created,
since this means that the current code can't keep up with that particular
task rate.

A succesful test should be able to keep a maximum `task backlog <= 1`
for a total of at least `120 seconds`.

### Constants

- `TASKS_SECOND`: task rate, per second.
- `DURATION_SECONDS`: max test duration.
- `THREAD_COUNT`: number of concurrent threads processing tasks
- `PAYLOAD_KB`: each task adds this payload to 1 `AppendList`, in kilobytes
- `MAX_ITEMS`: maximum number of created List Items, per paper
- `MAX_BACKLOG`: if worker has this many unproccesed tasks, `test=failed`

> Note: These constants are user-configurable when the benchmark starts up.

> Note: These might be out of date.

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
[dyno-module]: lib/dyno
