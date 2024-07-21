import throttle from 'throttleit'

const worker = async ({ tracker, forEach = () => {}, after = () => {} }) => {
  process.sendThrottled = throttle(process.send, 100)
  const result = { completedCount: 0, pid: process.pid }

  tracker
    .on('task:run', async row => {
      ++result.completedCount

      process.sendThrottled({
        name: 'update',
        result: row
      })
    })
    .once('finish', result => {
      process.sendThrottled({ name: 'finish', result })
    })

  process.on('SIGTERM', () =>
    tracker.stop()
      .then(() => after())
      .then(() => process.exit(0)))

  tracker.start(forEach)

  process.on('message', tracker.enqueue.bind(tracker))
  process.on('message', () => process.send({ name: 'received', result }))

  process.on('error', err => {
    setTimeout(() => {
      console.error(process.pid, err)
    })
  }, 100)
}

export default worker
