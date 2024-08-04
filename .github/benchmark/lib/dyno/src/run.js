import { join } from 'node:path'
import { dyno } from './index.js'

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    TASKS_SECOND: 5,
    THREAD_COUNT: 4,
    TEST_SECONDS: 5,
    RAND_FACTOR: 10
  },

  render: function(measures) {
    console.dir(measures[Object.keys(measures).at(-1)], { depth: 4 })
  }
})

console.log('dyno() exited with: 0')
