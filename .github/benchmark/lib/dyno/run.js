import { join } from 'node:path'
import { dyno } from './index.js'

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    TASKS_PER_SECOND: 10,
    THREAD_COUNT: 2,
    TEST_SECONDS: 10,
    RAND_FACTOR: 5
  },

  render: function(measures) {
    console.clear()

    console.dir(measures[process.pid]['uptime'].histogram.count, { depth: 3 })
  }
})

console.log('dyno() exited with: 0')
