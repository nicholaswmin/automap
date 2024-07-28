// Task file with `performance.timerify`-wrapped function
// - check if it appears in thread stats


import { task } from '../../../index.js'

task(async () => {
  const foo = () => new Promise(resolve => setTimeout(
    resolve, Math.round(Math.random() * 10)
  ))

  const timerified = performance.timerify(foo)

  await timerified()
  await timerified()
})
