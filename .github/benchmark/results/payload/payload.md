# Payload Size

> Varying the size of the added `payload`

## Parameters

- `1000` tasks per second
- `240 seconds` test duration
- `100` max list items (flats?)
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x` each
- Redis `FLUSHALL` before each test

### Test 1

- `PAYLOAD_KB`: 0.1 KB
- Status: `Success`

### Test 2

- `PAYLOAD_KB`: 1 KB
- Status: `Success`

### Test 3

- `PAYLOAD_KB`: 5 KB
- Status: `Success`

### Test 4

- `PAYLOAD_KB`: 30 KB
- Status: `Success`

### Test 5

- `PAYLOAD_KB`: 100 KB
- Status: `Failed` in `108 seconds`


## Results

### Test 1

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 0.1    │
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
│ Tasks Sent      │ 212124 │
│ Tasks Received  │ 212121 │
│ Tasks Completed │ 212067 │
│ Uptime Seconds  │ 246    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '95'  │ 7510   │ 6           │ 20.91         │ 48.1         │ 10.24              │
│ 1       │ '139' │ 7555   │ 4           │ 21.36         │ 54.1         │ 10.25              │
│ 2       │ '128' │ 7580   │ 4           │ 20.59         │ 32.47        │ 10.23              │
│ 3       │ '227' │ 7575   │ 3           │ 20.91         │ 47.74        │ 10.26              │
│ 4       │ '150' │ 7541   │ 3           │ 20.36         │ 33.01        │ 10.25              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 6.34           │ 2.29               │ 3.7               │ 1.04                 │
│ 1       │ 6.33           │ 2.29               │ 3.7               │ 1.05                 │
│ 2       │ 6.5            │ 2.35               │ 3.75              │ 1.06                 │
│ 3       │ 6.51           │ 2.35               │ 3.75              │ 1.05                 │
│ 4       │ 6.46           │ 2.34               │ 3.74              │ 1.06                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 247.49 seconds, warmup period: 5 seconds
```

### Test 2


```js
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 1      │
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
│ Tasks Sent      │ 210306 │
│ Tasks Received  │ 210303 │
│ Tasks Completed │ 210247 │
│ Uptime Seconds  │ 250    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '66'  │ 7647   │ 4           │ 21.01         │ 47.42        │ 10.28              │
│ 1       │ '128' │ 7517   │ 4           │ 20.49         │ 33.37        │ 10.27              │
│ 2       │ '315' │ 7600   │ 4           │ 20.44         │ 32.65        │ 10.29              │
│ 3       │ '95'  │ 7536   │ 3           │ 20.87         │ 46.2         │ 10.29              │
│ 4       │ '227' │ 7437   │ 3           │ 20.52         │ 33.31        │ 10.29              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 8.11           │ 3.24               │ 4.12              │ 1.19                 │
│ 1       │ 8.11           │ 3.22               │ 4.17              │ 1.2                  │
│ 2       │ 8.2            │ 3.29               │ 4.17              │ 1.2                  │
│ 3       │ 7.99           │ 3.23               │ 4.06              │ 1.17                 │
│ 4       │ 7.98           │ 3.19               │ 4.11              │ 1.16                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 251.62 seconds, warmup period: 5 seconds
````

### Test 3

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
│ Tasks Sent      │ 209872 │
│ Tasks Received  │ 209872 │
│ Tasks Completed │ 209835 │
│ Uptime Seconds  │ 244    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '150' │ 7463   │ 5           │ 21.26         │ 54.62        │ 10.29              │
│ 1       │ '128' │ 7438   │ 5           │ 21.08         │ 51.12        │ 10.31              │
│ 2       │ '216' │ 7564   │ 4           │ 21.07         │ 47.61        │ 10.3               │
│ 3       │ '326' │ 7459   │ 4           │ 21.13         │ 47.64        │ 10.3               │
│ 4       │ '304' │ 7431   │ 4           │ 20.73         │ 33.59        │ 10.3               │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 7.6            │ 2.94               │ 4.03              │ 1.09                 │
│ 1       │ 7.64           │ 2.93               │ 4.06              │ 1.11                 │
│ 2       │ 7.56           │ 2.91               │ 4.02              │ 1.1                  │
│ 3       │ 7.67           │ 2.94               │ 4.08              │ 1.11                 │
│ 4       │ 7.48           │ 2.86               │ 3.99              │ 1.09                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 246.21 seconds, warmup period: 5 seconds
```

### Test 4

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 30     │
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
│ Tasks Sent      │ 187777 │
│ Tasks Received  │ 187776 │
│ Tasks Completed │ 187734 │
│ Uptime Seconds  │ 253    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '271' │ 6903   │ 12          │ 22.17         │ 56.79        │ 10.65              │
│ 1       │ '172' │ 6566   │ 10          │ 20.62         │ 42.96        │ 10.63              │
│ 2       │ '304' │ 6735   │ 7           │ 22.27         │ 48.79        │ 10.65              │
│ 3       │ '55'  │ 6680   │ 7           │ 20.42         │ 47.97        │ 10.62              │
│ 4       │ '128' │ 6669   │ 5           │ 20.48         │ 48.73        │ 10.64              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 11.65          │ 3.97               │ 5.58              │ 1.57                 │
│ 1       │ 11.4           │ 3.87               │ 5.52              │ 1.5                  │
│ 2       │ 11.47          │ 3.94               │ 5.51              │ 1.53                 │
│ 3       │ 11.69          │ 3.95               │ 5.64              │ 1.58                 │
│ 4       │ 11.66          │ 3.98               │ 5.59              │ 1.56                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 254.7 seconds, warmup period: 5 seconds
```

### Test 5

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 100    │
│ ITEM_PAYLOAD_KB             │ 100    │
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
│ Tasks Sent      │ 11233  │
│ Tasks Received  │ 11231  │
│ Tasks Completed │ 9553   │
│ Uptime Seconds  │ 107    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '326' │ 399    │ 97          │ 19.23         │ 33.34        │ 13.61              │
│ 1       │ '282' │ 377    │ 80          │ 18.86         │ 33.26        │ 13.63              │
│ 2       │ '183' │ 387    │ 73          │ 18.94         │ 32.1         │ 13.57              │
│ 3       │ '161' │ 419    │ 67          │ 19.96         │ 35.62        │ 13.57              │
│ 4       │ '66'  │ 401    │ 64          │ 18.65         │ 31.42        │ 13.48              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 34.79          │ 10.04              │ 16.14             │ 4.28                 │
│ 1       │ 36.48          │ 9.94               │ 17.8              │ 4.44                 │
│ 2       │ 37.04          │ 10.01              │ 17.88             │ 4.88                 │
│ 3       │ 34.56          │ 9.03               │ 16.81             │ 4.63                 │
│ 4       │ 36.23          │ 10.35              │ 16.95             │ 4.87                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 107.98 seconds, warmup period: 5 seconds
```
