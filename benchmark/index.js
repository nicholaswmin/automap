import { PerformanceRunner } from './performance-runner/index.js'
import { Paper, Board } from './paper/index.js'
import { Repository, utils } from '../index.js'

const redis = utils.ioredis()
const repo = new Repository(Paper, redis)

const runner = new PerformanceRunner()

const fetch = performance.timerify(repo.fetch.bind(repo))
const save = performance.timerify(repo.save.bind(repo))

// Each array item is a Task

await runner.run([
  {
    name: 'create_paper',
    cycles: 1,
    fn: async ({ i, cycle }) => {
      const paper = new Paper({ id: 'foo' })

      await save(paper, cycle)
    }
  },
  {
    name: 'add_items',
    cycles: 5,
    fn: async ({ i, cycle }) => {
      const paper = await fetch({ id: 'foo' }, cycle)

      await paper.addItemToActiveBoard({
        id: 'i_' + utils.randomID(),
        json: utils.payloadKB(5)
      })

      const markA = performance.mark('markA')
      const markB = performance.mark('markB')

      performance.measure('markAB', 'markA', 'markB')

      await save(paper, cycle)
    }
  },
  {
    name: 'create_board',
    cycles: 1,
    fn: async ({ i, cycle }) => {
      const paper = await fetch({ id: 'foo' }, cycle)

      await paper.addBoard({ id: 'b_' +  utils.randomID() })

      await save(paper, cycle)
    }
  },
  {
    name: 'add_items',
    cycles: 20,
    fn: async ({ i, cycle }) => {
      const paper = await fetch({ id: 'foo' }, cycle)

      await paper.addItemToActiveBoard({
        id: 'i_' + utils.randomID(),
        json: utils.payloadKB(5)
      })

      performance.mark('payload', { detail: { value: 5, unit: 'kb'  } })

      await save(paper, cycle)
    }
  },
  {
    name: 'delete_board',
    cycles: 1,
    fn: async ({ i, cycle }) => {
      const paper = await fetch({ id: 'foo' }, cycle)

      await paper.deleteBoard({ id: paper.boards.at(-2).id })

      await save(paper, cycle)
    }
  }
])

redis.disconnect()

runner.printTimeline().printAggregates()
