import { availableParallelism } from 'node:os'
import { join } from 'node:path'
import { dyno, Table } from './lib/dyno/index.js'
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
    TASKS_PER_SECOND: 10,
    TEST_SECONDS: 5,
    THREAD_COUNT: availableParallelism(),

    MAX_ITEMS: 20,
    PAYLOAD_KB: 5
  },

  render: function(threads) {
    const pid  = process.pid.toString()
    const pids = Object.keys(threads)
    const main = threads[pid]

    const views = [
      new Table('Tasks')
      .setHeading('sent', 'done', 'backlog', 'uptime (secs)')
      .addRowMatrix([
        [
          main.sent?.count        || 'n/a',
          main.done?.count        || 'n/a',
          (main.sent?.count 
          - main.finished?.count) || 'n/a',
          main.uptime?.count      || 'n/a'
        ]
      ]),

      new Table(`Threads, top 5 of ${pids.length - 1}, sorted by: 'task.mean'`)
        .setHeading(
          'thread id', 
          'task (ms)', 
          'save (ms)', 
          'fetch (ms)', 
          'ping (ms)',
          'evt.loop (ms)'
        ).addRowMatrix(

        pids.filter(_pid => _pid !== pid)
        .map(pid => {
          return [
            pid,
            utils.round(threads[pid]['task']?.mean)  || 'n/a',
            utils.round(threads[pid]['save']?.mean)  || 'n/a',
            utils.round(threads[pid]['fetch']?.mean) || 'n/a',
            utils.round(threads[pid]['rping']?.mean) || 'n/a',
            utils.ns_ms(threads[pid]['eloop']?.mean) || 'n/a'
          ]
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5))
    ]
    
    process.argv.some(f => f.includes('no-clear')) ? 0 : console.clear()
    views.forEach(view => console.log(view.toString()))  
  }
})

console.log('dyno() exited with: 0')

redis.disconnect()
