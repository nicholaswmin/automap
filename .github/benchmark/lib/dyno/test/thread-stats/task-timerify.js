// Task file with `performance.timerify`-wrapped function
// - check if it appears in thread stats


import { thread } from '../../index.js'

thread(async parameters => {
  const foo = () => new Promise(resolve => setTimeout(
    resolve, Math.round(Math.random() * 10)
  ))

  const timerified = performance.timerify(foo)

  await timerified()
  await timerified()
}, {
  before: () => {},
  after: () => { }
})