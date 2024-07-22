# Max Vertical Scaling

> Maxxed-out Redis instance
> Maxxed-out vertically-scaled dyno

## Parameters

- `240 seconds` test duration
- `5KB` payloads
- Dyno size: Heroku `Performance-2XL`, max dyno size
- Redis: Heroku Redis `Premium-14`, max plan
- Dyno concurrency `63x`
- Redis `FLUSHALL` before each test

### Test 1

- `single` dyno
- `3000` tasks per second
- `100` max list/flats items
- Set concurrency: `63x`
- Status: `failed` in `213 seconds`

### Test 2

- `single` dyno
- `5000` tasks per second
- `100` max list/flats items
- Set concurrency: `500x`
- Status: `success`

### Test 3

- `2 dynos` runnning `concurrently`
- `3000` tasks per second each = `6000` tasks per second
- `100` max list/flats items
- Set concurrency: `200x` each
- Status: `failed`:
  - dyno A in `64 seconds`
  - dyno B in `75 seconds`

> Overshot it's elapsed time > `20 seconds` & failed, marking it a `success`.

### Test 4

- `2 dynos` runnning `concurrently`
- `1500` tasks per second each = `3000` tasks per second
- `100` max list/flats items
- Set concurrency: `63x` each
- Status: `failed`:
  - dyno A in `54 seconds`
  - dyno B in `28 seconds`

### Test 4

- `2 dynos` runnning `concurrently`
- `1500` tasks per second each = `3000` tasks per second
- `100` max list/flats items
- Set concurrency: `150x` each
- Status: `failed`
  - Dyno A completed (probably because B failed, easing Redis pressure)
  - Dyno B failed in `45 seconds`

### Test 5

- `2 dynos` runnning `concurrently`
- `2500x` tasks per second each = `5000x` tasks per second
- `100` max list/flats items

- Set concurrency: `500x` each
- Status: `failed`
  - Dyno A failed in `77 seconds`
  - Dyno B failed in `98 seconds`


  ### Test 6

  - `2 dynos` runnning `concurrently`
  - `1000x` tasks per second each = `2000x` tasks per second
  - `100` max list/flats items
  - Set concurrency: `63x` each
  - Status: `success`

  ### Test 7

  - `2 dynos` runnning `concurrently`
  - `1000x` tasks per second each = `2000x` tasks per second
  - `200x` max list/flats items, each
  - Set concurrency: 7



## Results


### Test 1

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 3000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 482424 │
│ Tasks Received  │ 482423 │
│ Tasks Completed │ 478814 │
│ Uptime Seconds  │ 213    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '436' │ 7798   │ 98          │ 20.37         │ 40.17        │ 10.38              │
│ 1       │ '128' │ 7706   │ 97          │ 20.23         │ 32.7         │ 10.38              │
│ 2       │ '678' │ 7774   │ 97          │ 21.5          │ 52.4         │ 10.39              │
│ 3       │ '678' │ 7779   │ 97          │ 21.5          │ 52.4         │ 10.39              │
│ 4       │ '392' │ 7680   │ 87          │ 20.34         │ 37.65        │ 10.41              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 15.59          │ 6.56               │ 6.49              │ 3.09                 │
│ 1       │ 15.45          │ 6.48               │ 6.4               │ 3.11                 │
│ 2       │ 16.04          │ 6.84               │ 6.54              │ 3.26                 │
│ 3       │ 16.27          │ 6.9                │ 6.58              │ 3.36                 │
│ 4       │ 16.03          │ 6.84               │ 6.54              │ 3.26                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 213.75 seconds, warmup period: 5 seconds
```

### Test 2

> This tests says failed but it has overshot it's elased time by 20 seconds.\
> Consider this a success.

```js

Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 5000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 500    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 491907 │
│ Tasks Received  │ 491907 │
│ Tasks Completed │ 476175 │
│ Uptime Seconds  │ 263    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 495 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '590'  │ 977    │ 50          │ 17.67         │ 29.67        │ 12.33              │
│ 1       │ '2768' │ 938    │ 48          │ 17.8          │ 29.84        │ 12.25              │
│ 2       │ '2955' │ 917    │ 40          │ 17.76         │ 29.87        │ 12.06              │
│ 3       │ '1184' │ 978    │ 26          │ 17.78         │ 29.69        │ 12.35              │
│ 4       │ '821'  │ 983    │ 22          │ 17.83         │ 29.8         │ 12.12              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 188.73         │ 75.87              │ 71.12             │ 41.47                │
│ 1       │ 188.21         │ 75.51              │ 70.9              │ 41.91                │
│ 2       │ 188.02         │ 76.23              │ 70.07             │ 41.59                │
│ 3       │ 187.41         │ 75.11              │ 70.4              │ 41.37                │
│ 4       │ 185.86         │ 74.05              │ 70.79             │ 40.96                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 495 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 262.89 seconds, warmup period: 5 seconds
 ```


 ### Test 3

 #### Dyno A

 ```js
 Constants
 ┌─────────────────────────────┬────────┐
 │ (index)                     │ Values │
 ├─────────────────────────────┼────────┤
 │ TASKS_PER_SECOND            │ 3000   │
 │ TEST_DURATION_SECONDS       │ 240    │
 │ MAX_FLATS                   │ 100    │
 │ ITEM_PAYLOAD_KB             │ 5      │
 │ MAX_WORKER_BACKLOG          │ 100    │
 │ NUM_WORKERS                 │ 200    │
 │ MAX_STATS_UPDATE_PER_SECOND │ 5      │
 │ MAX_WORKERS_DISPLAY         │ 5      │
 │ WARMUP_SECONDS              │ 5      │
 └─────────────────────────────┴────────┘
 Messaging Stats:
 ┌─────────────────┬────────┐
 │ (index)         │ Values │
 ├─────────────────┼────────┤
 │ Tasks Sent      │ 34841  │
 │ Tasks Received  │ 34841  │
 │ Tasks Completed │ 19716  │
 │ Uptime Seconds  │ 62     │
 │ Warming Up      │ false  │
 └─────────────────┴────────┘
 Worker Vitals
 ... plus: 195 extra hidden workers
 ┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
 │ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
 ├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
 │ 0       │ '2064' │ 111    │ 90          │ 11.73         │ 18.99        │ 10.75              │
 │ 1       │ '1338' │ 112    │ 87          │ 11.86         │ 21.73        │ 10.75              │
 │ 2       │ '2086' │ 122    │ 80          │ 11.96         │ 19.58        │ 10.74              │
 │ 3       │ '2207' │ 127    │ 73          │ 11.95         │ 21.97        │ 10.86              │
 │ 4       │ '1096' │ 106    │ 68          │ 11.79         │ 18.76        │ 10.67              │
 └─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
 Worker timings
 ┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
 │ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
 ├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
 │ 0       │ 134.52         │ 53.06              │ 53.1              │ 28.21                │
 │ 1       │ 144.59         │ 56.64              │ 58.94             │ 28.83                │
 │ 2       │ 147.29         │ 59.33              │ 58.02             │ 29.95                │
 │ 3       │ 138.6          │ 54.28              │ 56.19             │ 28.09                │
 │ 4       │ 144.77         │ 57.08              │ 59.18             │ 28.59                │
 └─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
 ... plus: 195 extra hidden workers
 All workers gracefully shutdown
 status: Test failed
 44 reached backlog limit
  Run for: 62.43 seconds, warmup period: 5 seconds
 ```

 #### Dyno B

 ```js

 Constants
 ┌─────────────────────────────┬────────┐
 │ (index)                     │ Values │
 ├─────────────────────────────┼────────┤
 │ TASKS_PER_SECOND            │ 3000   │
 │ TEST_DURATION_SECONDS       │ 240    │
 │ MAX_FLATS                   │ 100    │
 │ ITEM_PAYLOAD_KB             │ 5      │
 │ MAX_WORKER_BACKLOG          │ 100    │
 │ NUM_WORKERS                 │ 200    │
 │ MAX_STATS_UPDATE_PER_SECOND │ 5      │
 │ MAX_WORKERS_DISPLAY         │ 5      │
 │ WARMUP_SECONDS              │ 5      │
 └─────────────────────────────┴────────┘
 Messaging Stats:
 ┌─────────────────┬────────┐
 │ (index)         │ Values │
 ├─────────────────┼────────┤
 │ Tasks Sent      │ 35784  │
 │ Tasks Received  │ 35783  │
 │ Tasks Completed │ 23226  │
 │ Uptime Seconds  │ 75     │
 │ Warming Up      │ false  │
 └─────────────────┴────────┘
 Worker Vitals
 ... plus: 195 extra hidden workers
 ┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
 │ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
 ├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
 │ 0       │ '2031' │ 124    │ 75          │ 11.58         │ 18.4         │ 10.59              │
 │ 1       │ '1426' │ 124    │ 75          │ 11.23         │ 18.55        │ 10.45              │
 │ 2       │ '1613' │ 127    │ 68          │ 11.31         │ 18.78        │ 10.56              │
 │ 3       │ '95'   │ 136    │ 60          │ 11.75         │ 19.73        │ 10.53              │
 │ 4       │ '359'  │ 121    │ 33          │ 11.47         │ 18.91        │ 10.46              │
 └─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
 Worker timings
 ┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
 │ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
 ├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
 │ 0       │ 129.41         │ 54.28              │ 49.81             │ 25.74                │
 │ 1       │ 124.71         │ 51.98              │ 49.77             │ 23.19                │
 │ 2       │ 119.92         │ 47.86              │ 48.59             │ 23.75                │
 │ 3       │ 114.6          │ 45.18              │ 45.53             │ 23.88                │
 │ 4       │ 125.57         │ 50.03              │ 50.29             │ 25.43                │
 └─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
 ... plus: 195 extra hidden workers
 All workers gracefully shutdown
 status: Test failed
```


### Test 4

#### Dyno A

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 16159  │
│ Tasks Received  │ 16159  │
│ Tasks Completed │ 11537  │
│ Uptime Seconds  │ 53     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '205' │ 243    │ 97          │ 15.42         │ 29.7         │ 10.22              │
│ 1       │ '491' │ 249    │ 85          │ 16.9          │ 27.87        │ 10.25              │
│ 2       │ '645' │ 243    │ 82          │ 17.35         │ 28.85        │ 10.23              │
│ 3       │ '517' │ 258    │ 79          │ 17.47         │ 28.85        │ 10.24              │
│ 4       │ '436' │ 242    │ 78          │ 17.43         │ 29.26        │ 10.24              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 44.89          │ 18.39              │ 16.94             │ 9.95                 │
│ 1       │ 44.73          │ 19.11              │ 16.75             │ 9.24                 │
│ 2       │ 42.77          │ 17.91              │ 16.14             │ 9.23                 │
│ 3       │ 43.9           │ 18.69              │ 17.1              │ 8.5                  │
│ 4       │ 45             │ 19.1               │ 17.29             │ 9.01                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 53.79 seconds, warmup period: 5 seconds
```

#### Dyno B

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 21211  │
│ Tasks Received  │ 21211  │
│ Tasks Completed │ 16963  │
│ Uptime Seconds  │ 27     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '238' │ 314    │ 85          │ 15.42         │ 30.2         │ 10.17              │
│ 1       │ '623' │ 302    │ 70          │ 15.48         │ 29.54        │ 10.2               │
│ 2       │ '436' │ 301    │ 66          │ 15.04         │ 29.82        │ 10.18              │
│ 3       │ '502' │ 326    │ 51          │ 15.22         │ 29.77        │ 10.17              │
│ 4       │ '73'  │ 321    │ 49          │ 15.39         │ 29.67        │ 10.17              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 34.87          │ 14.7               │ 13.2              │ 7.51                 │
│ 1       │ 33.29          │ 14.15              │ 13.11             │ 6.55                 │
│ 2       │ 33.93          │ 14.72              │ 12.83             │ 6.92                 │
│ 3       │ 33.06          │ 14.18              │ 12.64             │ 6.66                 │
│ 4       │ 35.2           │ 15.13              │ 13.75             │ 6.79                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
All workers gracefully shutdown
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 27.74 seconds, warmup period: 5 seconds
```


### Test 5


#### Dyno A:

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 150    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 434775 │
│ Tasks Received  │ 434775 │
│ Tasks Completed │ 434409 │
│ Uptime Seconds  │ 264    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 145 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '964'  │ 2790   │ 8           │ 18.97         │ 30.41        │ 10.14              │
│ 1       │ '854'  │ 2867   │ 5           │ 19.02         │ 30.39        │ 10.14              │
│ 2       │ '1294' │ 2845   │ 5           │ 19.15         │ 31.38        │ 10.14              │
│ 3       │ '601'  │ 2773   │ 4           │ 19.19         │ 30.51        │ 10.14              │
│ 4       │ '755'  │ 2904   │ 4           │ 19.09         │ 31.42        │ 10.13              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 10.61          │ 4.44               │ 4.56              │ 2.11                 │
│ 1       │ 10.8           │ 4.61               │ 4.55              │ 2.15                 │
│ 2       │ 10.2           │ 4.36               │ 4.35              │ 2.02                 │
│ 3       │ 10.56          │ 4.54               │ 4.43              │ 2.07                 │
│ 4       │ 11.64          │ 5.08               │ 4.74              │ 2.39                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 145 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 266.11 seconds, warmup period: 5 seconds
```

#### Dyno B

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 150    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 25446  │
│ Tasks Received  │ 25446  │
│ Tasks Completed │ 19056  │
│ Uptime Seconds  │ 41     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '403' │ 336    │ 131         │ 15.78         │ 29.7         │ 10.17              │
│ 1       │ '535' │ 345    │ 112         │ 15.64         │ 29.56        │ 10.18              │
│ 2       │ '183' │ 317    │ 93          │ 15.15         │ 29.82        │ 10.15              │
│ 3       │ '260' │ 316    │ 83          │ 15.35         │ 29.8         │ 10.16              │
│ 4       │ '480' │ 333    │ 65          │ 15.36         │ 29.8         │ 10.16              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 39.29          │ 16.26              │ 15.23             │ 8.29                 │
│ 1       │ 40.45          │ 17.31              │ 15.52             │ 8.14                 │
│ 2       │ 38.47          │ 16.83              │ 14.89             │ 7.31                 │
│ 3       │ 38.29          │ 15.97              │ 14.77             │ 8.02                 │
│ 4       │ 37.62          │ 15.71              │ 14.45             │ 7.96                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 41.82 seconds, warmup period: 5 seconds
```

### Test 5

#### Dyno A

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 500    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 91169  │
│ Tasks Received  │ 91169  │
│ Tasks Completed │ 58267  │
│ Uptime Seconds  │ 77     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 495 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '3065' │ 119    │ 87          │ 13.16         │ 21.84        │ 11.26              │
│ 1       │ '5540' │ 123    │ 81          │ 11.6          │ 18.86        │ 11.53              │
│ 2       │ '898'  │ 115    │ 74          │ 11.21         │ 18.1         │ 11.17              │
│ 3       │ '3934' │ 126    │ 71          │ 11.55         │ 19.02        │ 11.3               │
│ 4       │ '656'  │ 116    │ 54          │ 11.26         │ 16.79        │ 11.08              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 357.97         │ 140.97             │ 138.01            │ 79.08                │
│ 1       │ 347.64         │ 140.58             │ 130.13            │ 77                   │
│ 2       │ 326.62         │ 131.18             │ 124.47            │ 70.9                 │
│ 3       │ 341.13         │ 135.12             │ 131.98            │ 73.61                │
│ 4       │ 352.22         │ 139.59             │ 135.76            │ 76.82                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 495 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 77.01 seconds, warmup period: 5 seconds
```

#### Dyno B


```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2500   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 500    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 85827  │
│ Tasks Received  │ 85827  │
│ Tasks Completed │ 51632  │
│ Uptime Seconds  │ 99     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 495 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '1745' │ 112    │ 89          │ 11.75         │ 18.83        │ 11.61              │
│ 1       │ '238'  │ 110    │ 87          │ 11.92         │ 18.79        │ 11.27              │
│ 2       │ '2273' │ 111    │ 67          │ 11.48         │ 17.09        │ 11.4               │
│ 3       │ '4044' │ 118    │ 59          │ 11.82         │ 21.79        │ 11.66              │
│ 4       │ '4726' │ 112    │ 58          │ 11.7          │ 19.02        │ 11.54              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 385.9          │ 148.98             │ 149.33            │ 87.05                │
│ 1       │ 386.21         │ 154.02             │ 146.73            │ 84.37                │
│ 2       │ 358.82         │ 145.46             │ 134.15            │ 81.38                │
│ 3       │ 376.03         │ 146.57             │ 146.77            │ 82.02                │
│ 4       │ 383.86         │ 154.24             │ 146.91            │ 83.04                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 495 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 98.77 seconds, warmup period: 5 seconds
```


### Test 6

#### Dyno A

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 223518 │
│ Tasks Received  │ 223518 │
│ Tasks Completed │ 223406 │
│ Uptime Seconds  │ 246    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '601' │ 3620   │ 4           │ 19.56         │ 30.82        │ 10.09              │
│ 1       │ '227' │ 3517   │ 2           │ 19.4          │ 31.9         │ 10.09              │
│ 2       │ '139' │ 3498   │ 2           │ 19.48         │ 31.97        │ 10.09              │
│ 3       │ '579' │ 3624   │ 2           │ 19.45         │ 31.8         │ 10.09              │
│ 4       │ '326' │ 3514   │ 2           │ 19.4          │ 31.57        │ 10.09              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 6.74           │ 2.8                │ 3.32              │ 1.22                 │
│ 1       │ 6.72           │ 2.82               │ 3.29              │ 1.21                 │
│ 2       │ 6.55           │ 2.67               │ 3.3               │ 1.19                 │
│ 3       │ 6.56           │ 2.7                │ 3.29              │ 1.2                  │
│ 4       │ 6.57           │ 2.67               │ 3.3               │ 1.21                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 247.55 seconds, warmup period: 5 seconds
```


#### Dyno B

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 223685 │
│ Tasks Received  │ 223685 │
│ Tasks Completed │ 223504 │
│ Uptime Seconds  │ 247    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '172' │ 3592   │ 7           │ 19.2          │ 30.69        │ 10.09              │
│ 1       │ '326' │ 3487   │ 5           │ 19.28         │ 31.47        │ 10.09              │
│ 2       │ '249' │ 3519   │ 4           │ 19.34         │ 32.11        │ 10.09              │
│ 3       │ '293' │ 3525   │ 3           │ 19.24         │ 31.18        │ 10.09              │
│ 4       │ '733' │ 3525   │ 3           │ 19.16         │ 30.85        │ 10.09              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 7.5            │ 3.35               │ 3.37              │ 1.37                 │
│ 1       │ 7.56           │ 3.39               │ 3.35              │ 1.39                 │
│ 2       │ 7.3            │ 3.27               │ 3.31              │ 1.31                 │
│ 3       │ 7.41           │ 3.28               │ 3.37              │ 1.35                 │
│ 4       │ 7.49           │ 3.29               │ 3.34              │ 1.4                  │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 248.73 seconds, warmup period: 5 seconds
Nicholass-MacBook-Air:automap nicholaswmin$
```


### Test 7

#### Dyno A

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 200    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 20394  │
│ Tasks Received  │ 20394  │
│ Tasks Completed │ 16445  │
│ Uptime Seconds  │ 37     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '425' │ 284    │ 98          │ 14.3          │ 23.74        │ 10.16              │
│ 1       │ '73'  │ 284    │ 71          │ 14.08         │ 23.94        │ 10.17              │
│ 2       │ '711' │ 278    │ 65          │ 14.36         │ 23.97        │ 10.16              │
│ 3       │ '689' │ 292    │ 54          │ 14.58         │ 23.95        │ 10.17              │
│ 4       │ '722' │ 288    │ 52          │ 14.45         │ 23.99        │ 10.19              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 66.43          │ 20.43              │ 34.61             │ 12.02                │
│ 1       │ 65.75          │ 19.85              │ 34.63             │ 11.88                │
│ 2       │ 66.32          │ 20.88              │ 34.71             │ 11.24                │
│ 3       │ 63.93          │ 19.52              │ 35.22             │ 9.82                 │
│ 4       │ 64.45          │ 20.6               │ 34.42             │ 10.07                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 38.15 seconds, warmup period: 5 seconds
```

#### Dyno B

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 200    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 63     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 20049  │
│ Tasks Received  │ 20049  │
│ Tasks Completed │ 15792  │
│ Uptime Seconds  │ 54     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 58 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '722' │ 283    │ 87          │ 14.66         │ 23.87        │ 10.2               │
│ 1       │ '447' │ 299    │ 74          │ 14.75         │ 24.28        │ 10.22              │
│ 2       │ '271' │ 286    │ 69          │ 14.61         │ 24.07        │ 10.2               │
│ 3       │ '282' │ 278    │ 63          │ 14.65         │ 23.97        │ 10.21              │
│ 4       │ '711' │ 271    │ 49          │ 14.66         │ 23.9         │ 10.2               │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 68.62          │ 21.53              │ 37.03             │ 10.55                │
│ 1       │ 70.17          │ 21.1               │ 36.84             │ 12.68                │
│ 2       │ 70.36          │ 22.34              │ 36.82             │ 11.69                │
│ 3       │ 66.52          │ 21.08              │ 35.49             │ 10.48                │
│ 4       │ 71.07          │ 21.45              │ 37.51             │ 12.48                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 58 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 55.38 seconds, warmup period: 5 seconds
Nicholass-MacBook-Air:automap nicholaswmin$
```
