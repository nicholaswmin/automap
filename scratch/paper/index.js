import { List, AppendList, utils } from '../../index.js'

class ViewPosition {
  constructor({ x = 0, y = 0 } = {}) {
    this.x = x
    this.y = y
  }
}

class Board {
  constructor({
    id = 1111111,
    viewPosition = { x: 0, y: 0 },
    items = []
  } = {},
  ) {
    this.id = id
    this.items = new AppendList({ from: items })
    this.viewPosition = new ViewPosition(viewPosition)
  }

  addItem(item) {
    this.items.push(item)

    return this
  }

  static cloneFrom(board, { id }) {
    return new Board({ id: id, viewPosition: board.viewPosition })
  }

  static fromJSON({ id, viewPosition, items }) {
    return new Board({ id, viewPosition, items })
  }
}

class User {
  constructor({ id, name }) {
    this.id = id
    this.name = name
  }
}

class Paper {
  constructor({
    id = utils.randomID(),
    activeBoardId = 1111111,
    boards = [{ id: 1111111 }],
    users = []
  } = {}) {
    if (typeof id === 'undefined')
      throw Paper.createMissingArgumentError('id')

    if (Array.isArray(boards) && !boards.find(b => b.id == activeBoardId))
      throw Paper.createBoardNotFoundError(activeBoardId)

    this.id = id

    this.activeBoardId = activeBoardId
    this.boards = new List({ type: Board, from: boards })
    this.users = new List({ type: User, from: users })
  }

  addUser({ id, name }) {
    this.users.push(new User({ id, name }))

    return this
  }

  addItemToActiveBoard(item) {
    const board = this.getActiveBoard()

    if (!board)
      throw Paper.createActiveBoardNotFoundError()

    board.addItem(item)

    return this
  }

  getActiveBoard() {
    return this.boards.find(board => board.id == this.activeBoardId)
  }

  switchBoard({ id }) {
    const board = this._findBoardById({ id })

    if (!board)
      throw Paper.createBoardNotFoundError()

    this.activeBoardId = board.id

    return this
  }

  addBoard({ id }) {
    // @TODO Add max boards limits

    const existing = this._findBoardById({ id })

    if (existing)
      throw Paper.createBoardExistsError(id)

    const board = new Board({ id })

    this.boards.push(board)

    return this
  }

  deleteBoard({ id }) {
    if (this.boards.length === 1)
      throw Paper.createRefuseEmptyError()

    const index = this._findBoardIndexById({ id })

    if (index < 0)
      throw Paper.createBoardNotFoundError(id)

    this.boards.splice(index, 1)

    return this
  }

  moveBoardToIndex({ id, index }) {
    const board = this._findBoardById({ id })

    if (typeof index === 'undefined' || index < 0)
      throw Paper.createNegativeIndexError(index)

    if (!board)
      throw Paper.createBoardNotFoundError(id)

    const currentIndex = this._findBoardIndexById({ id })

    this.boards.splice(currentIndex, 1)
    this.boards.splice(index, 0, board)

    return this
  }

  duplicateBoard({ id, newId }) {
    // @TODO Add max boards limits

    const board = this._findBoardById({ id })

    if (!board)
      throw Paper.createBoardNotFoundError(id)

    if (!newId)
      throw Paper.createInvalidBoardIdError(newId)

    const created = Board.cloneFrom(board, { id: newId })
    const index = this._findBoardIndexById({ id })

    this.boards.splice(index + 1, 0, created)

    return this
  }

  _findBoardById({ id }) {
    return this.boards.find(b => b.id == id )
  }

  _findBoardIndexById({ id }) {
    return this.boards.findIndex(b => b.id == id )
  }

  static createMissingArgumentError(argument = '?') {
    throw new Error(`Required parameter is missing: ${argument}`)
  }

  static createBoardNotFoundError(id) {
    throw new Error(`Cannot find board: ${id}`)
  }

  static createActiveBoardNotFoundError() {
    throw new Error(`Cannot find a board that matches the activeBoardId`)
  }

  static createBoardExistsError(id) {
    throw new Error(`Board: ${id} already exists`)
  }

  static createNegativeIndexError(index) {
    throw new Error(`index ${index} cannot be less than 0`)
  }

  static createRefuseEmptyError() {
    throw new Error('Cannot delete only remaining board')
  }

  static createInvalidBoardIdError(id) {
    throw new Error(`id: ${id} is invalid`)
  }

  static fromJSON(data) {
    return new Paper(data)
  }
}

export { Paper, Board }
