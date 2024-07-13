import throttle from 'throttleit'

const worker = async ({ tracker, taskFn, onEnd = () => {} }) => {
  process.send = throttle(process.send, 100)

  tracker
    .on('task:run', async row => {
      process.send({
        name: 'update',
        result: row
      })
    })
    .once('finish', result => {
      process.send({ name: 'finish', result })
    })

  process.on('SIGTERM', () =>
    tracker.stop()
      .then(() => onEnd())
      .then(() => {
        console.info(process.pid, 'exited')
        process.exit(0)
      }))

  tracker.start(taskFn)

  process.on('message', tracker.enqueue.bind(tracker))

  process.on('error', err => {
    setTimeout(() => {
      console.error(process.pid, err)
    })
  }, 100)
}

export default worker
