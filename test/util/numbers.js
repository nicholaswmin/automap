const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const nanoToMs = ns => round(ns / 1e+6)

export { round, nanoToMs }
