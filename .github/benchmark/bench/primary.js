import { styleText } from 'node:util'
import throttle from 'throttleit'
import { randomId, round } from '../../../test/util/index.js'

const primary = async ({
  cluster,
  constants,
  before = () => {},
  after = () => {}
}) => {
  console.log('Started')
  console.log(constants)

  let startedMs = null
  const taskInterval = 1000 / constants.public.TASKS_PER_SECOND
  const taskIntervalRounded = Math.ceil(taskInterval)
  const timers = { warmup: null, task: null }
  const stats = {
    messaging: {
      'Tasks Sent': 0,
      'Tasks Received': 0,
      'Tasks Completed': 0,
      'Tasks Dropped': 0,
      get ['Warming Up']() {
        return !!timers.warmup
      }
    }
  }

  const updates = []

  const onProcessStart = async () => {
    await before()
  }

  const onProcessExit = async () => {
    await killWorkers()
    await after()
  }

  const cancelWarmupPeriod = () => {
    const uptime = startedMs ? (Date.now() - startedMs) / 1000 : 0
    if (uptime > constants.public.WARMUP_SECONDS) {
      clearInterval(timers.warmup)
      return timers.warmup = null
    }
  }

  const forkWorker = () => new Promise((resolve, reject) => {
    return cluster.fork()
      .once('online', function() { resolve(this) })
      .once('error', function(err) { reject(err) })
  })

  const sendToRandomWorker = () => {
    const cycles = taskInterval < 1 ? 1 / taskInterval : 1

    for (let i = 0; i < cycles; i++) {
      const workers = Object.values(cluster.workers)
      const randomWorker = workers[Math.floor(Math.random() * workers.length)]

      if (timers.warmup && Math.random() < 0.90) {
        stats.messaging['Tasks Dropped']++

        return
      }

      if (randomWorker)
        randomWorker.send({ detail: 'Task' + '-' + randomId() })

      stats.messaging['Tasks Sent']++
    }
  }

  const onClusterExit = (worker, code) => code > 0 ? (async () => {
    Object.values(timers).forEach(clearInterval)

    console.error('error in worker', worker.process.pid)

    await onProcessExit()

    console.error('Test failed')

    process.exit(1)
  })() : 0

  const onWorkerFinish = async () => {
    console.info(process.pid, 'reached backlog limit')

    Object.values(timers).forEach(clearInterval)

    await onProcessExit()

    setImmediate(() => {
      console.info(
        process.pid, 'reached backlog limit', '\n',
        'Test succeded! Run for:',
        round(process.uptime()),
        'seconds,',
        'warmup period:',
        constants.public.WARMUP_SECONDS,
        'seconds'
      )
    })
  }

  const onWorkerUpdate = async result => {
    updates.push(result)

    if (updates.length >= constants.public.NUM_WORKERS)
      printUpdates()
  }

  const printUpdatesUnthrottled = () => {
    console.clear()

    console.log('Constants')

    console.table(constants.public)

    console.log('Messaging Stats:')

    console.table(stats.messaging)

    console.log('Worker Vitals')

    const vitals = updates.slice(
      updates.length - constants.public.NUM_WORKERS,
      updates.length
    ).map(row => row.vitals)

    stats.messaging['Tasks Completed'] = vitals.reduce((sum, item) => {
      return sum += item.cycles
    }, 0)

    console.table(vitals)

    console.log('Worker timings')

    console.table(updates.slice(
      updates.length - constants.public.NUM_WORKERS,
      updates.length
    ).map(row => row.timings))
  }

  const onTaskReceived = () => {
    stats.messaging['Tasks Received']++
  }

  const printUpdates = throttle(
    printUpdatesUnthrottled,
    Math.round(1000 / constants.public.MAX_STATS_UPDATE_PER_SECOND)
  )

  const killWorkers = () => {
    console.info('shutting down remaining workers ...')

    const deaths = Object.values(cluster.workers)
      .map(worker =>
        new Promise((resolve, reject) =>
          worker.isDead()
            ? resolve()
            : worker
              .on('exit', resolve)
              .on('error', reject)
              .kill()
        )
      )

    return Promise.all(deaths)
      .then(() => console.info('All workers gracefully shutdown'))
  }

  for (let i = 0; i < constants.public.NUM_WORKERS; i++)
    await forkWorker()
      .then(worker => worker.on('message', msg => ({
        'finish': onWorkerFinish,
        'update': onWorkerUpdate,
        'received': onTaskReceived
      }[msg.name](msg.result))))

  cluster.on('exit', onClusterExit)

  Object.assign(timers, {
    task: setInterval(sendToRandomWorker, taskIntervalRounded),
    warmup: setInterval(cancelWarmupPeriod, 1000)
  })

  process.once('SIGINT', () => {
    console.log('\n', styleText(
      'yellow',
      'User requested stop. Dont forget to deprovision added add-ons! Bye 👋'
    ), '\n')

    setTimeout(() => process.exit(0), 500)
  })

  await onProcessStart()
  startedMs = Date.now()
}

export default primary
