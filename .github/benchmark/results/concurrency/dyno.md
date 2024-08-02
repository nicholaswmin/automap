# Dyno Concurrency

> Varying process concurrency\ using `multiple dynos, running concurrently`\
> on a single Redis Server

## Parameters

- `2` dynos, running conceurrently a single Redis
- `240 seconds` test duration
- `5KB` payloads
- `100` max list/flats items
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x` each
- Redis `FLUSHALL` before each test

### Test 1

- `1000` tasks per second, per dyno = `2000` tasks per second
- Status: `Success`

### Test 2

- `2000` tasks per second, per dyno = `4000` tasks per second
- Status: `Failed`:
  - dyno A in `85 seconds`
  - dyno B in `105 seconds`


## Results

### Test 1

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
│ NUM_WORKERS                 │ 28     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 203987 │
│ Tasks Received  │ 203987 │
│ Tasks Completed │ 202973 │
│ Uptime Seconds  │ 301    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '194' │ 7560   │ 93          │ 20.13         │ 33.33        │ 10.49              │
│ 1       │ '194' │ 7566   │ 93          │ 20.14         │ 33.33        │ 10.49              │
│ 2       │ '128' │ 7226   │ 69          │ 20.2          │ 32.24        │ 10.48              │
│ 3       │ '304' │ 7427   │ 68          │ 20.44         │ 36.5         │ 10.5               │
│ 4       │ '205' │ 7357   │ 58          │ 20.36         │ 33.28        │ 10.48              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 20.67          │ 8.31               │ 9.08              │ 3.71                 │
│ 1       │ 20.88          │ 8.3                │ 9.21              │ 3.8                  │
│ 2       │ 20.61          │ 8.29               │ 9.03              │ 3.72                 │
│ 3       │ 20.86          │ 8.36               │ 9.21              │ 3.72                 │
│ 4       │ 20.66          │ 8.31               │ 9.08              │ 3.71                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 301.59 seconds, warmup period: 5 seconds
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
│ NUM_WORKERS                 │ 28     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 203210 │
│ Tasks Received  │ 203208 │
│ Tasks Completed │ 202280 │
│ Uptime Seconds  │ 252    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '117' │ 7314   │ 88          │ 20.46         │ 33.26        │ 10.48              │
│ 1       │ '117' │ 7321   │ 88          │ 20.46         │ 33.26        │ 10.48              │
│ 2       │ '73'  │ 7384   │ 62          │ 20.19         │ 33.06        │ 10.49              │
│ 3       │ '293' │ 7273   │ 61          │ 21.02         │ 47.58        │ 10.48              │
│ 4       │ '271' │ 7212   │ 57          │ 21.12         │ 54.59        │ 10.46              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 20.75          │ 8.35               │ 9.14              │ 3.71                 │
│ 1       │ 20.82          │ 8.37               │ 9.17              │ 3.72                 │
│ 2       │ 20.99          │ 8.41               │ 9.2               │ 3.8                  │
│ 3       │ 20.94          │ 8.34               │ 9.26              │ 3.77                 │
│ 4       │ 20.73          │ 8.34               │ 9.13              │ 3.71                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 252.81 seconds, warmup period: 5 seconds
````

### Test 2

#### Dyno A

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 100    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 55920  │
│ Tasks Received  │ 55919  │
│ Tasks Completed │ 51237  │
│ Uptime Seconds  │ 105    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 95 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '755' │ 546    │ 61          │ 17.2          │ 29.7         │ 11.88              │
│ 1       │ '293' │ 521    │ 51          │ 19.55         │ 37.39        │ 11.64              │
│ 2       │ '832' │ 537    │ 49          │ 16.82         │ 30.02        │ 11.72              │
│ 3       │ '623' │ 539    │ 44          │ 17.2          │ 29.74        │ 11.94              │
│ 4       │ '810' │ 534    │ 36          │ 17.17         │ 29.69        │ 11.8               │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 89.07          │ 34.99              │ 36.16             │ 17.54                │
│ 1       │ 87.77          │ 34.63              │ 35.75             │ 17.34                │
│ 2       │ 91.08          │ 35.81              │ 37.38             │ 17.83                │
│ 3       │ 88.51          │ 34.65              │ 36.24             │ 17.4                 │
│ 4       │ 89.53          │ 35.05              │ 36.71             │ 17.48                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 95 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 105.75 seconds, warmup period: 5 seconds
```

#### Dyno B

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 5      │
│ MAX_WORKER_BACKLOG          │ 100    │
│ NUM_WORKERS                 │ 100    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 54343  │
│ Tasks Received  │ 54343  │
│ Tasks Completed │ 50938  │
│ Uptime Seconds  │ 82     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 95 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '777'  │ 520    │ 68          │ 17.17         │ 29.74        │ 11.99              │
│ 1       │ '106'  │ 526    │ 49          │ 23.26         │ 46.53        │ 11.75              │
│ 2       │ '1063' │ 514    │ 39          │ 18.29         │ 30.05        │ 11.91              │
│ 3       │ '744'  │ 493    │ 34          │ 16.89         │ 29.85        │ 11.91              │
│ 4       │ '821'  │ 536    │ 31          │ 16.88         │ 29.85        │ 11.79              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 89.42          │ 35.32              │ 36.4              │ 17.37                │
│ 1       │ 89.83          │ 35.45              │ 36.51             │ 17.58                │
│ 2       │ 90.91          │ 36.35              │ 36.73             │ 17.86                │
│ 3       │ 91.78          │ 35.91              │ 37.89             │ 17.85                │
│ 4       │ 88.15          │ 34.6               │ 35.72             │ 17.63                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 95 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 82.59 seconds, warmup period: 5 seconds
````
