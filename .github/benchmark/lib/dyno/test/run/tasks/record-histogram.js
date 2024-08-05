import { run } from '../../../index.js'
import histogram from '../../../src/histogram/index.js'

run(async function task(parameters) {
  histogram(process.pid.toString()).record(parameters.FOO)
})
