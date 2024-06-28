import { styleText as style } from 'node:util'
import utils from './utils.js'

const performanceEntryViews = {
  'connect': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'connect'),
      name: 'connect',
      value: utils.toMs(entry.duration)
    }
  },

  'net': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'net'),
      name: 'net',
      value: utils.toMs(entry.duration)
    }
  },

  'dns': (entry, ctx, table) => {
    return {
      type: style(['blue'], 'dns'),
      name: 'dns',
      value: utils.toMs(entry.duration)
    }
  },

  'function': (entry, ctx, table) => {
    return {
      type: 'function',
      name: entry.name.replace('bound', ''),
      value: utils.toMs(entry.duration)
    }
  },

  'gc': (entry, ctx, table) => {
    return {
      type: 'gc',
      name: 'gc',
      value: utils.toMs(entry.duration)
    }
  },

  'mark': (entry, ctx, table) => {
    const value = entry.detail?.value || ' -- '
    const unit = entry.detail?.unit?.trim() || ''

    return {
      type:  style(['cyan'], 'mark'),
      name:  style(['cyan'], entry.name),
      value: style(['cyan'], value + ' ' + unit
    )}
  },

  'measure': (entry, ctx, table) => {
    return {
      type:  style(['blue'], 'measure'),
      name:  style(['blue'], entry.name),
      value: style(['blue'], utils.toMs(entry.duration))
    }
  }
}

export default performanceEntryViews
