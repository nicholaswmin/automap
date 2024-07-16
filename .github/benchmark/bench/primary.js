import { styleText } from 'node:util'
import throttle from 'throttleit'
import { randomId, round } from '../../../test/util/index.js'

const primary = async ({ cluster, constants, before = () => {} }) => {
  console.log('Started')
  console.log(constants)

  await before()

  const taskInterval = Math.ceil(1000 / constants.TASKS_PER_SECOND)
  const timers = { warmup: null, task: null }
  const updates = []

  const cancelWarmupPeriod = () => {
    if (process.uptime() > constants.WARMUP_SECONDS) {
      clearInterval(timers.warmup)
      timers.warmup = null
    }
  }

  const forkWorker = () => new Promise((resolve, reject) => {
    return cluster.fork()
      .once('online', function() { resolve(this) })
      .once('error', function(err) { reject(err) })
  })

  const sendToRandomWorker = () => {
    const workers = Object.values(cluster.workers)
    const randomWorker = workers[Math.floor(Math.random() * workers.length)]

    if (timers.warmup && Math.random() < 0.75)
      return

    if (randomWorker)
      randomWorker.send({ detail: 'Task' + '-' + randomId() })
  }

  const onClusterExit = (worker, code) => code > 0 ? (async () => {
    Object.values(timers).forEach(clearInterval)

    console.error('error in worker', worker.process.pid)

    await killWorkers()

    console.error('Test failed')

    process.exit(1)
  })() : 0

  const onWorkerFinish = async () => {
    console.info(process.pid, 'reached backlog limit')

    Object.values(timers).forEach(clearInterval)

    await killWorkers()

    setImmediate(() => {
      console.info(
        process.pid, 'reached backlog limit', '\n',
        'Test succeded! Run for:',
        round(process.uptime() - constants.WARMUP_SECONDS), 'seconds'
      )

      // pass `result` as argument in func, it's available
      // console.info('Printing report for:', process.pid)
      // console.dir(result, { depth: 5 })
    })
  }

  const onWorkerUpdate = async result => {
    updates.push(result)

    if (updates.length >= constants.NUM_WORKERS)
      printUpdates()
  }

  const printUpdatesUnthrottled = () => {
    console.clear()

    console.log('Constants')

    console.table(constants)

    console.log('Vitals')

    console.table(updates.slice(
      updates.length - constants.NUM_WORKERS,
      updates.length
    ).map(row => row.vitals))

    console.log('Task/Function timings')

    console.table(updates.slice(
      updates.length - constants.NUM_WORKERS,
      updates.length
    ).map(row => row.timings))

    if (timers.warmup)
      console.log('* warmup period active *')
  }

  const printUpdates = throttle(
    printUpdatesUnthrottled,
    Math.round(1000 / constants.MAX_UPDATE_PER_SECOND)
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

  for (let i = 0; i < constants.NUM_WORKERS; i++)
    await forkWorker()
      .then(worker => worker.on('message', msg => ({
        'finish': onWorkerFinish,
        'update': onWorkerUpdate
      }[msg.name](msg.result))))

  cluster.on('exit', onClusterExit)

  Object.assign(timers, {
    task: setInterval(sendToRandomWorker, taskInterval),
    warmup: setInterval(cancelWarmupPeriod, 1000)
  })

  process.on('SIGINT', () => {
    if (global.SIGINT)
        return

    global.SIGINT = true
    console.log('\n', styleText(
      'yellow',
      'User requested stop. Dont forget to deprovision added add-ons! Bye 👋'
    ), '\n')

    setTimeout(() => process.exit(0), 500)
  })
}

export default primary
