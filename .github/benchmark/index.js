import cluster from 'node:cluster'

import { constants, primary, worker } from './process/index.js'

cluster.isPrimary
  ? primary(cluster, await constants(cluster))
  : worker()
