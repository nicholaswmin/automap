import Bench from 'bench'
import { setTimeout } from 'node:timers/promises'

import { Paper, Board } from './paper/index.js'
import { Repository, utils } from '../index.js'

const redis = utils.ioredis()
const repo = new Repository(Paper, redis)

const runner = new Bench()

const fetch = performance.timerify(repo.fetch.bind(repo))
const save = performance.timerify(repo.save.bind(repo))

// Each array item is a Task

await runner.run([
  {
    name: 'create_paper',
    cycles: 25,
    fn: async ({ cycle, taskname }) => {
      const paper = new Paper({ id: 'foo' })

      await save(paper)
    }
  }
])

redis.disconnect()

console.log(runner.toEntries())
