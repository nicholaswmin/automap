import { styleText as style } from 'node:util'
import utils from './utils.js'

const performanceEntryViews = {
  'cycle': (ctx, entry) => {
    const { i, step } = entry.detail[0]

    i === 1 ? ctx.currentTable.addRows([
      ctx.computeSeparator(['type', 'name', 'value']),
      {
        type: style(['magenta'], '---'),
        name: style(['magenta', 'bold', 'underline'], step),
        value: style(['magenta'], '---'),
      },
      ctx.computeSeparator(['type', 'name', 'value'])
    ]) : ctx.currentTable.addRows([
      ctx.computeSeparator(['type', 'name', 'value'])
    ])

    return {
      type: style(['white', 'bold', 'underline'], 'cycle'),
      name: style(['white', 'bold', 'underline'], `${step}  ${i}`),
      value: style(
        ['green', 'bold', 'underline'],
        utils.toMillis(entry.duration)
      )
    }
  },

  'connect': (ctx, entry) => {
    return {
      type: style(['blue'], 'connect'),
      name: 'connect',
      value: utils.toMillis(entry.duration)
    }
  },

  'net': (ctx, entry) => {
    return {
      type: style(['blue'], 'net'),
      name: 'net',
      value: utils.toMillis(entry.duration)
    }
  },

  'dns': (ctx, entry) => {
    return {
      type: style(['blue'], 'dns'),
      name: 'dns',
      value: utils.toMillis(entry.duration)
    }
  },

  'function': (ctx, entry) => {
    return {
      type: 'function',
      name: entry.name.replace('bound', ''),
      value: utils.toMillis(entry.duration)
    }
  },

  'gc': (ctx, entry) => {
    return {
      type: 'gc',
      name: 'gc',
      value: utils.toMillis(entry.duration)
    }
  },

  'mark': (ctx, entry) => {
    const value = entry.detail?.value || ' -- '
    const unit = entry.detail?.unit?.trim() || ''

    return {
      type:  style(['cyan'], 'mark'),
      name:  style(['cyan'], entry.name),
      value: style(['cyan'], value + ' ' + unit
    )}
  },

  'measure': (ctx, entry) => {
    return {
      type:  style(['blue'], 'measure'),
      name:  style(['blue'], entry.name),
      value: style(['blue'], utils.toMillis(entry.duration))
    }
  }
}

export default performanceEntryViews
