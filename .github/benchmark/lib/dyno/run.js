import { join } from 'node:path'
import { dyno } from './index.js'

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 2, 
    DURATION_MS: 10 * 1000, 
    RAND_FACTOR: 5
  },

  render: function(stats) {
    console.clear()

    console.dir(stats[process.pid], { depth: 3 })
  }
})

console.log('dyno() exited with: 0')
