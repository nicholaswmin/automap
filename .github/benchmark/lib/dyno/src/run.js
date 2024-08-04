import { join } from 'node:path'
import { dyno } from './index.js'

await dyno({
  task: join(import.meta.dirname, 'task.js'),

  parameters: {
    TASKS_SECOND: 100,
    THREAD_COUNT: 4,
    TEST_SECONDS: 3,

    RAND_FACTOR: 10
  },

  render: function(processMeasurements) {
    console.log('renderFn called')
    console.dir(processMeasurements, { depth: 4 })
  }
})

console.log('dyno() exited with: 0')
