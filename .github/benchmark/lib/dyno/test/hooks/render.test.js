import test from 'node:test'

import { Dyno, prompt } from '../../index.js'

test('Dyno: render hook arguments', async t => {
  let dyno, args = []

  t.before(async () => {
    
    dyno = new Dyno({
      task: './test/hooks/tasks/task.js',
      parameters: await prompt({
        TASKS_SECOND: 1,
        THREAD_COUNT: 1,
        DURATION_SECONDS: 3
      }),

      render: ({ runner, threads }) => {
        args.push({ runner, threads })
      }
    })

    await dyno.start()
  })

  await t.test('runs the hook', async t => {
    t.assert.ok(args.length, 'collected arguments is empty')
  })
  
  await t.test('passes "runner" stat rows', async t => {
    const result = args.filter(stat => stat.runner)
    
    t.assert.ok(result.length, 'no "runner" rows found')
  })
  
  await t.test('passes "threads" stat rows', async t => {
    const result = args.filter(stat => stat.threads)
    
    t.assert.ok(result.length, 'no "thread" rows found')
  })
})
