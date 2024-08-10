import { availableParallelism } from 'node:os'
import { join } from 'node:path'
import { dyno, view } from '@nicholaswmin/dyno'
import ioredis from './lib/ioredis/index.js'

const redis = ioredis()
const utils = {
  round: num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'n/a',
  ns_ms: num => parseFloat((num / 1000000).toFixed(2)),
  bytesToMB: bytes => Math.ceil(bytes / 1000 / 1000)
}

await redis.flushall()

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: availableParallelism(), 
    DURATION_MS: 5 * 1000, 

    MAX_ITEMS: 20,
    PAYLOAD_KB: 5
  },

  render: function({ main, threads, thread }) {
    const views = [
      new view.Table('General', [{
        'sent'   : main?.sent?.count,
        'done'   : main?.done?.count,
        'backlog': main?.sent?.count - main?.done?.count,
        'uptime' : main?.uptime?.count
      }]),

      new view.Table(
        'Cycles', 
        Object.keys(threads)
        .map(pid => ({
          'thread id'     : pid,
          'cycle (ms)'    : utils.round(threads[pid].task?.mean),
          'save (ms)'     : utils.round(threads[pid].save?.mean),
          'fetch (ms)'    : utils.round(threads[pid].fetch?.mean),
          'ping (ms)'     : utils.round(threads[pid].rping?.mean),
          'evt.loop (ns)' : utils.round(threads[pid].eloop?.mean),

        })).sort((a, b) => b[1] - a[1]).slice(0, 5)
      ),

      new view.Plot('mean/ms timings', thread, { 
        exclude: ['eloop']
      })
    ]
    
    // Render the views in the terminal
    console.clear()
    views.forEach(view => view.render())  
  }
})

console.log('dyno() exited normally. Test success!')

redis.disconnect()
