# Parent List size

> Varying the size of the parent `List`.\
>
> Reminder: Each task adds a payload to an `AppendList`.\
> Each AppendList is nested within a `List` which\
> can reach up to `100 items`.

> Tests 1,2,3 are set at `1000 tasks per second`,
> 4 is set at `2000 tasks per second`.

> `MAX_LIST` refers to the same constant as `MAX_FLATS`

## Parameters

- `240 seconds` test duration
- `5KB` payloads
- `100` max list/flats items
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x` each
- Redis `FLUSHALL` before each test

### Test 1

- `MAX_LIST` 100
- `1000` tasks per second
- Status: `Success`

### Test 2

- `MAX_LIST` 200
- `1000` tasks per second
- Status: `Failed` in `35 seconds`

### Test 3

- `MAX_LIST` 300
- `1000` tasks per second
- Status: `Failed` in `25 seconds`

### Test 4

- `MAX_LIST` 100
- `2000` tasks per second
- Status: `Success`

> For some reason the above test ended\
> at `300 seconds` instead of `240 seconds`


## Results

### Test 1

```js
├─────────────────────────────┼────────┤
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
│ Tasks Sent      │ 204095 │
│ Tasks Received  │ 204095 │
│ Tasks Completed │ 204058 │
│ Uptime Seconds  │ 245    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '293' │ 7291   │ 6           │ 20.84         │ 49.97        │ 10.34              │
│ 1       │ '84'  │ 7226   │ 3           │ 21.16         │ 47.78        │ 10.33              │
│ 2       │ '315' │ 7332   │ 3           │ 20.47         │ 33.28        │ 10.34              │
│ 3       │ '326' │ 7259   │ 3           │ 20.39         │ 33.03        │ 10.35              │
│ 4       │ '128' │ 7303   │ 3           │ 20.98         │ 47.94        │ 10.33              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 7.31           │ 2.6                │ 4.06              │ 1.09                 │
│ 1       │ 7.32           │ 2.57               │ 4.12              │ 1.07                 │
│ 2       │ 7.37           │ 2.6                │ 4.13              │ 1.08                 │
│ 3       │ 7.17           │ 2.5                │ 4.08              │ 1.08                 │
│ 4       │ 7.27           │ 2.57               │ 4.08              │ 1.08                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 246.44 seconds, warmup period: 5 seconds
```

### Test 2


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
│ NUM_WORKERS                 │ 28     │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 11858  │
│ Tasks Received  │ 11858  │
│ Tasks Completed │ 9942   │
│ Uptime Seconds  │ 34     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '304' │ 417    │ 74          │ 17.18         │ 29.56        │ 13.55              │
│ 1       │ '55'  │ 390    │ 68          │ 17.99         │ 37.78        │ 13.11              │
│ 2       │ '95'  │ 401    │ 67          │ 15.19         │ 26.57        │ 13.39              │
│ 3       │ '249' │ 401    │ 59          │ 18.58         │ 39.88        │ 13.19              │
│ 4       │ '128' │ 421    │ 51          │ 14.78         │ 26.05        │ 13.24              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 28.28          │ 7.46               │ 17.42             │ 3.43                 │
│ 1       │ 28.51          │ 7.65               │ 17.53             │ 3.37                 │
│ 2       │ 29.44          │ 7.5                │ 18.45             │ 3.7                  │
│ 3       │ 28.96          │ 8                  │ 17.33             │ 3.69                 │
│ 4       │ 28.94          │ 7.38               │ 18.37             │ 3.33                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 34.71 seconds, warmup period: 5 seconds
````

### Test 3

```js
Constants
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 1000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 300    │
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
│ Tasks Sent      │ 10320  │
│ Tasks Received  │ 10317  │
│ Tasks Completed │ 7955   │
│ Uptime Seconds  │ 35     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '161' │ 316    │ 98          │ 14.64         │ 29.57        │ 14.35              │
│ 1       │ '326' │ 337    │ 89          │ 16.42         │ 29.87        │ 14.97              │
│ 2       │ '95'  │ 350    │ 85          │ 17.15         │ 29.92        │ 14.61              │
│ 3       │ '271' │ 319    │ 77          │ 16.45         │ 28.97        │ 14.49              │
│ 4       │ '150' │ 314    │ 73          │ 14.76         │ 28.44        │ 13.99              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 32.7           │ 6.93               │ 22.51             │ 3                    │
│ 1       │ 32.28          │ 7.47               │ 21.96             │ 2.67                 │
│ 2       │ 32.02          │ 7.02               │ 22.48             │ 2.75                 │
│ 3       │ 32.25          │ 7.04               │ 22.4              │ 2.88                 │
│ 4       │ 31.65          │ 7.31               │ 21.79             │ 2.8                  │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
All workers gracefully shutdown
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 35.78 seconds, warmup period: 5 seconds
````

### Test 4

```js
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2000   │
│ TEST_DURATION_SECONDS       │ 240    │
│ MAX_FLATS                   │ 25     │
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
│ Tasks Sent      │ 425602 │
│ Tasks Received  │ 425602 │
│ Tasks Completed │ 425488 │
│ Uptime Seconds  │ 297    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '139' │ 15240  │ 5           │ 21.67         │ 35.06        │ 10.15              │
│ 1       │ '326' │ 15251  │ 5           │ 21.7          │ 35.13        │ 10.15              │
│ 2       │ '161' │ 15332  │ 5           │ 22.21         │ 47.74        │ 10.15              │
│ 3       │ '293' │ 15259  │ 4           │ 22.23         │ 47.71        │ 10.15              │
│ 4       │ '150' │ 14967  │ 4           │ 21.48         │ 34.47        │ 10.15              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 3.99           │ 1.84               │ 1.98              │ 1.02                 │
│ 1       │ 3.92           │ 1.77               │ 1.95              │ 1.02                 │
│ 2       │ 3.96           │ 1.79               │ 1.96              │ 1.03                 │
│ 3       │ 4.01           │ 1.86               │ 1.97              │ 1.02                 │
│ 4       │ 3.95           │ 1.78               │ 1.95              │ 1.02                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 299.18 seconds, warmup period: 5 seconds
```
