import { EventEmitter } from 'node:events'

const localbus = new EventEmitter()

if (process.isWorker) {
  console.log('wow')
  process.exit(1)
}

export { localbus }
