# Process Concurrency

> Varying process concurrency within a `single dyno`\
>
> Tests `1`,`2`,`3` use the same dyno type\
> Test `4` uses a `2x bigger` instance\

## Parameters

- `single` dyno
- `240 seconds` test duration
- `5KB` payloads
- `100` max list/flats items
- Redis `FLUSHALL` before each test


### Test 1

- `1000` tasks per second
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x`
- Set concurrency: `28x`
- Status: **Success*

### Test 2

- `2000` tasks per second
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x`
- Set concurrency: `28x`
- Status: **Failed* in `25 seconds`

### Test 3

- `2000` tasks per second
- Dyno size: Heroku `Performance-L`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `28x`
- Set concurrency: `100x`
- Status: **Success*

### Test 4

- `3000` tasks per second
- Dyno size: Heroku `Performance-2XL`
- Redis: Heroku Redis `Premium-7`
- Dyno concurrency `61x`
- Set concurrency: `300x`
- Status: **Failed* in `68 seconds`

## Results

### Test 1

```js
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
│ Tasks Sent      │ 201335 │
│ Tasks Received  │ 201335 │
│ Tasks Completed │ 201302 │
│ Uptime Seconds  │ 247    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '139' │ 7002   │ 7           │ 21.23         │ 54.39        │ 10.36              │
│ 1       │ '216' │ 7069   │ 4           │ 22.44         │ 54.72        │ 10.35              │
│ 2       │ '106' │ 7165   │ 4           │ 20.33         │ 33           │ 10.35              │
│ 3       │ '260' │ 7071   │ 4           │ 20.39         │ 33.23        │ 10.36              │
│ 4       │ '205' │ 7266   │ 3           │ 20.55         │ 33.46        │ 10.35              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 8.63           │ 3.29               │ 4.53              │ 1.21                 │
│ 1       │ 8.64           │ 3.3                │ 4.54              │ 1.21                 │
│ 2       │ 8.42           │ 3.2                │ 4.47              │ 1.19                 │
│ 3       │ 8.8            │ 3.4                │ 4.54              │ 1.23                 │
│ 4       │ 8.62           │ 3.3                │ 4.51              │ 1.23                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
```

### Test 2

```js
┌─────────────────────────────┬────────┐
│ (index)                     │ Values │
├─────────────────────────────┼────────┤
│ TASKS_PER_SECOND            │ 2000   │
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
│ Tasks Sent      │ 6801   │
│ Tasks Received  │ 6801   │
│ Tasks Completed │ 4694   │
│ Uptime Seconds  │ 23     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 23 extra hidden workers
┌─────────┬───────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid   │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼───────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '106' │ 254    │ 94          │ 17.67         │ 31.72        │ 11.91              │
│ 1       │ '84'  │ 250    │ 93          │ 16.53         │ 29.7         │ 11.76              │
│ 2       │ '238' │ 258    │ 90          │ 17.22         │ 30.97        │ 11.7               │
│ 3       │ '117' │ 259    │ 89          │ 18.1          │ 31.67        │ 11.61              │
│ 4       │ '227' │ 250    │ 89          │ 17.09         │ 30.95        │ 11.74              │
└─────────┴───────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 20.3           │ 6.44               │ 10.31             │ 3.38                 │
│ 1       │ 21.91          │ 8.16               │ 10.58             │ 3.11                 │
│ 2       │ 21.95          │ 7.38               │ 10.86             │ 3.57                 │
│ 3       │ 21.27          │ 7.04               │ 10.43             │ 3.73                 │
│ 4       │ 21.54          │ 6.93               │ 10.93             │ 3.51                 │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 23 extra hidden workers
shutting down remaining workers ...
shutting down remaining workers ...
All workers gracefully shutdown
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 24.45 seconds, warmup period: 5 seconds
```

### Test 3

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
│ MAX_WORKERS_DISPLAY         │ 4      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 235164 │
│ Tasks Received  │ 235164 │
│ Tasks Completed │ 235045 │
│ Uptime Seconds  │ 256    │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 96 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '865'  │ 2357   │ 5           │ 18.95         │ 31.56        │ 11.04              │
│ 1       │ '722'  │ 2317   │ 4           │ 18.88         │ 31.65        │ 11.07              │
│ 2       │ '480'  │ 2254   │ 4           │ 18.8          │ 31.03        │ 11.16              │
│ 3       │ '1008' │ 2339   │ 3           │ 18.89         │ 31.57        │ 11.17              │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 16.88          │ 5.82               │ 8.5               │ 2.58                 │
│ 1       │ 15.26          │ 5.34               │ 7.82              │ 2.24                 │
│ 2       │ 15.37          │ 5.42               │ 7.62              │ 2.37                 │
│ 3       │ 16.64          │ 5.77               │ 8.32              │ 2.6                  │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 96 extra hidden workers
shutting down remaining workers ...
All workers gracefully shutdown
status: Test succeded
Test has elapsed its running time 258.16 seconds, warmup period: 5 seconds
````

### Test 4

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
│ NUM_WORKERS                 │ 300    │
│ MAX_STATS_UPDATE_PER_SECOND │ 5      │
│ MAX_WORKERS_DISPLAY         │ 5      │
│ WARMUP_SECONDS              │ 5      │
└─────────────────────────────┴────────┘
Messaging Stats:
┌─────────────────┬────────┐
│ (index)         │ Values │
├─────────────────┼────────┤
│ Tasks Sent      │ 78442  │
│ Tasks Received  │ 78441  │
│ Tasks Completed │ 62158  │
│ Uptime Seconds  │ 68     │
│ Warming Up      │ false  │
└─────────────────┴────────┘
Worker Vitals
... plus: 295 extra hidden workers
┌─────────┬────────┬────────┬─────────────┬───────────────┬──────────────┬────────────────────┐
│ (index) │ pid    │ cycles │ max backlog │ mean mem (mb) │ max mem (mb) │ evt loop mean (ms) │
├─────────┼────────┼────────┼─────────────┼───────────────┼──────────────┼────────────────────┤
│ 0       │ '1327' │ 211    │ 72          │ 13.54         │ 26.53        │ 10.96              │
│ 1       │ '3109' │ 200    │ 64          │ 12.91         │ 25.07        │ 10.99              │
│ 2       │ '469'  │ 206    │ 59          │ 13.33         │ 25.62        │ 10.87              │
│ 3       │ '3274' │ 205    │ 53          │ 13.21         │ 25.58        │ 11.23              │
│ 4       │ '3307' │ 243    │ 19          │ 14.29         │ 28.3         │ 11.1               │
└─────────┴────────┴────────┴─────────────┴───────────────┴──────────────┴────────────────────┘
Worker timings
┌─────────┬────────────────┬────────────────────┬───────────────────┬──────────────────────┐
│ (index) │ task mean (ms) │ fn:fetch mean (ms) │ fn:save mean (ms) │ redis_ping mean (ms) │
├─────────┼────────────────┼────────────────────┼───────────────────┼──────────────────────┤
│ 0       │ 146.11         │ 58.69              │ 58.3              │ 29.33                │
│ 1       │ 159.41         │ 63.17              │ 63.04             │ 32.9                 │
│ 2       │ 162.01         │ 64.97              │ 63.03             │ 34.16                │
│ 3       │ 163.58         │ 66.33              │ 62.88             │ 34.58                │
│ 4       │ 164.71         │ 65.76              │ 64.84             │ 34.29                │
└─────────┴────────────────┴────────────────────┴───────────────────┴──────────────────────┘
... plus: 295 extra hidden workers
All workers gracefully shutdown
status: Test failed
44 reached backlog limit
 Run for: 68.83 seconds, warmup period: 5 seconds
```
