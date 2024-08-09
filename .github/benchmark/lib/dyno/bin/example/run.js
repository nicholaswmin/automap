import { join } from 'node:path'
import { dyno, Table } from '{{entryFile}}'

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 5 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FIB_NUMBER: 35,
    ITERATIONS: 3
  },

  render: function(threads) {
    // render output in table format
    const pid  = process.pid.toString()
    const pids = Object.keys(threads)
    
    // primary output, mainly logs stats on cycles sent/finished etc..
    // 'sent', 'done', 'backlog', 'uptime' are provided by default
    const main = threads[pid]
      const views = [
        new Table('Tasks')
        .setHeading('sent', 'done', 'backlog', 'uptime (secs)')
        .addRowMatrix([
          [
            main.sent?.count                      || 'n/a',
            main.done?.count                      || 'n/a',
            (main.sent?.count - main.done?.count) || 0,
            main.uptime?.count                    || 'n/a'
          ]
        ]),
        
        // task output, logs stats and user-taken measurements from 'task.js' 
        // on task durations etc ...
        new Table('Task')
        .setHeading(
          'thread id', 
          'task (ms)', 
          'fibonacci (ms)'
        ).addRowMatrix(
        
        // - 'task' is provided by default
        // - 'fibonacci' is a custom measurement taken in 'task.js'
        Object.keys(threads)
        .filter(_pid => _pid !== pid)
        .map(pid => {
          return [
            pid,
            Math.round(threads[pid]['task']?.mean)       || 'n/a',
            Math.round(threads[pid]['fibonacci']?.mean)  || 'n/a'
          ]
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5))
    ]
      
    // render the table
    console.clear()
    views.forEach(view => console.log(view.toString()))  
  }
})
