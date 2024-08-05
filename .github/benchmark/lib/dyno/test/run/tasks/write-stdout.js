import { run } from '../../../index.js'

run(async function task(parameters) {
  console.log(process.pid, 'says:', parameters.FOO)
})
