
import { PerformanceRunner } from './performance-runner/index.js'
import { Paper, Board } from './paper/index.js'
import { Repository, utils } from '../index.js'

const redis = utils.ioredis()
const repo = new Repository(Paper, redis)

const runner = new PerformanceRunner({ title: 'automap paper' })

const fetch = performance.timerify(repo.fetch.bind(repo))
const save = performance.timerify(repo.save.bind(repo))

await runner.run([
  {
    name: 'create_paper',
    times: 1,
    fn: async ({ i, step }) => {
      const paper = new Paper({ id: 'foo' })

      await save(paper, step)
    }
  },
  {
    name: 'add_items',
    times: 5,
    fn: async ({ i, step }) => {
      const paper = await fetch({ id: 'foo' }, step)

      await paper.addItemToActiveBoard({
        id: 'i_' + utils.randomID(),
        json: utils.payloadKB(5)
      })

      await save(paper, step)
    }
  },
  {
    name: 'create_board',
    times: 1,
    fn: async ({ i, step }) => {
      const paper = await fetch({ id: 'foo' }, step)

      await paper.addBoard({ id: 'b_' +  utils.randomID() })

      await save(paper, step)
    }
  },
  {
    name: 'add_items',
    times: 20,
    fn: async ({ i, step }) => {
      const paper = await fetch({ id: 'foo' }, step)

      await paper.addItemToActiveBoard({
        id: 'i_' + utils.randomID(),
        json: utils.payloadKB(5)
      })
      performance.mark('payload', { detail: { value: '5 kb' }})

      await save(paper, step)
    }
  },
  {
    name: 'delete_board',
    times: 1,
    fn: async ({ i, step }) => {
      const paper = await fetch({ id: 'foo' }, step)

      await paper.deleteBoard({ id: paper.boards.at(-2).id })

      await save(paper, step)
    }
  }
])

redis.disconnect()

await runner.end()
