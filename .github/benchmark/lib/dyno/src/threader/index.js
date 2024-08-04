import { availableParallelism } from 'node:os'
import child_process from 'node:child_process'

const forkProcess = (task, { parameters }) => new Promise((resolve, reject) => {
  const onSpawn = function ()    {  this.off('error', onError); resolve(this) }
  const onError = function (err) {  this.off('spawn', onSpawn); reject(err)   }

  child_process.fork(task, {
    env: { ...process.env, parameters: JSON.stringify(parameters) },
    silent: false
  })
  .once('spawn', onSpawn).once('error', onError)
})

const fork = async (task, { parameters, count = availableParallelism() }) => {
  const threads = await Promise.all(
      Array.from({ length: count }, () => forkProcess(task, { parameters }))
    )
    .then(threads => threads.reduce((acc, thread) => ({ 
      ...acc, [thread.pid]: thread 
    }), {}))
  
  return Object.freeze(threads)
}

const watch = (threads, { signal }) => {
  const alive = Object.values(threads).filter(thread => thread.connected)  

  return alive.length 
    ? Promise.all(alive.map(thread => new Promise((resolve, reject) => {
        const _reject = code => signal.aborted 
          ? resolve() 
          : reject(new Error(`thread: ${thread.pid} exited with: ${code}`))

        thread.once('exit', _reject).once('error', _reject)
        
        signal.addEventListener('abort', () => {
          thread.off('exit', _reject).off('error', _reject)

          resolve()
        })
      })))
    : true
}

const disconnect = async threads => {
  const timeout = 3000
  const alive = Object.values(threads).filter(thread => thread.connected)  

  if (!alive.length)
    return 0

  const deaths = alive
    .map(thread => new Promise((resolve, reject) => {
      thread.once('exit', resolve)
      thread.once('error', reject)
    }))
  
  let sigkilled = setTimeout(() => {
    console.warn('process:disconnect timed-out. Sending SIGKILL ...')
    Object.values(threads).forEach(thread => thread.kill('SIGKILL'))
    sigkilled = true
  }, timeout)
  
  alive.forEach(thread => 
    thread.connected 
      ? thread.send({ name: 'process:disconnect' }) 
      : null
  )

  return Promise.all(deaths)
    .then(() => sigkilled === true ? (() => {
      throw new Error('threads had to be SIGKILLED')
    })() : console.log('threads exited normally'))
    .then(() => clearTimeout(sigkilled))
    .then(() => alive.length)
    
}

export default { fork, disconnect, watch }
