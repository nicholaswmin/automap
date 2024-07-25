class Foreman {
  constructor({ cluster, numWorkers }) {
    this.workers = {}
    this.cluster = cluster
    this.numWorkers = numWorkers > 0 ? numWorkers : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${numWorkers}`)
    })()

    this.cluster.once('exit', (worker, code) => {
      if (code > 0)
        console.error('error in worker:', worker.process.pid)

      this.stop().finally(() => process.exit(code || 0))
    })
  }

  async start() {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = await this.#forkWorker()
      this.workers[worker.process.pid] = worker
    }

    return this.workers
  }

  async stop() {
    const deaths = Object.values(this.workers)
      .map(worker => {
        return new Promise((resolve, reject) => {
          return worker.isDead() ? resolve()
            : worker
              .on('exit', code => {
                const pid = worker.process.pid
                return worker.exitedAfterDisconnect
                  ? resolve()
                  : reject(new Error(`${pid} exited abnormally, code: ${code}`))
              })
              .on('error', reject)
              .disconnect(() => worker.send('shutdown'))
        })
    })

    return await Promise.all(deaths)
  }

  #forkWorker() {
    return new Promise((resolve, reject) => {
      return this.cluster.fork()
        .once('online', function() { resolve(this) })
        .once('error', function(err) { reject(err) })
    })
  }
}

export default Foreman
