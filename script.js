const TICK_INTERVAL = 100
const X_BORDER_LIMIT = 30
const Y_BORDER_LIMIT = 30
const MARGIN = 5
let GAME
let MIN_X, MAX_X, MIN_Y, MAX_Y

let allCells = new Set()

function createTd(x, y) {
  td = document.createElement('td')
  td.setAttribute('x', x)
  td.setAttribute('y', y)
  td.title = `${x}, ${y}`
  if (findByCoords(x, y)) td.classList = ['isAlive']
  td.onclick = clickCell
  return td
}

function k(x, y) { return `${x},${y}` }
function s(key) {
  const a = key.split(',')
  const x = Number(a[0])
  const y = Number(a[1])
  return { x, y }
}

function findByCoords(reqX, reqY) {
  return allCells.has(k(reqX, reqY))
}
function findLimits() {
  MIN_X = 0
  MAX_X = 0
  MIN_Y = 0
  MAX_Y = 0
  Array.from(allCells.keys()).forEach(key => {
    const { x, y } = s(key)
    if (x < MIN_X) MIN_X = x
    if (x > MAX_X) MAX_X = x
    if (y < MIN_Y) MIN_Y = y
    if (y > MAX_Y) MAX_Y = y
  })
}

function adjustSize() {
  const tableDOM = document.querySelector('table')
  const playgroundDOM = document.querySelector('#playground')
  let tableRect = tableDOM.getBoundingClientRect()
  let playgroundRect = playgroundDOM.getBoundingClientRect()
  var r = document.querySelector(':root');

  var rs = getComputedStyle(r);
  let actualSize = Number((rs.getPropertyValue('--cell-size')).replace('px', ''))

  const ratio = [
    tableRect.width / playgroundRect.width,
    tableRect.height / playgroundRect.height
  ]
  const maxRatio = ratio[0] > ratio[1] ? ratio[0] : ratio[1]
  if (maxRatio > 1) {
    r.style.setProperty('--cell-size', `${Math.floor(actualSize / maxRatio)}px`);
  }
}

function render() {
  const tableDOM = document.querySelector('table')
  const playgroundDOM = document.querySelector('#playground')
  findLimits()
  const newTableDOM = document.createElement('table')
  for (let y = MAX_Y + MARGIN; y >= MIN_Y - MARGIN; y--) {
    if (Y_BORDER_LIMIT && Math.abs(y) > Y_BORDER_LIMIT) continue
    const newTrDOM = document.createElement('tr')
    newTrDOM.y = y
    for (let x = MIN_X - MARGIN; x <= MAX_X + MARGIN; x++) {
      if (X_BORDER_LIMIT && Math.abs(x) > X_BORDER_LIMIT) continue
      newTrDOM.appendChild(createTd(x, y))
    }
    newTableDOM.appendChild(newTrDOM)
  }
  if (tableDOM) playgroundDOM.removeChild(tableDOM)
  newTableDOM.getBoundingClientRect()
  playgroundDOM.appendChild(newTableDOM)
  adjustSize(newTableDOM)
}

function flipCell(x, y) {
  const alive = findByCoords(x, y)
  if (alive) allCells.delete(k(x, y))
  else allCells.add(k(x, y))
  if (x < MIN_X + 3 || x > MAX_X - 3 || y < MIN_Y + 3 || y < MAX_Y - 3) findLimits()
}
function clickCell(event) {
  const x = Number(event.target.attributes.x.value)
  const y = Number(event.target.attributes.y.value)
  flipCell(x, y)
  render()
}

function generateNextMap() {
  let changed = false
  const nextCells = new Set(allCells)
  const candidateCells = new Set(allCells)
  nextCells.forEach((cell) => {
    getNeighboursCoords(cell).forEach(candidateCell => {
      if (!candidateCells.has(candidateCell)) {
        candidateCells.add(candidateCell)
      }
    })
  })
  candidateCells.forEach(cell => {
    const { x, y } = s(cell)
    if (
      (X_BORDER_LIMIT && Math.abs(x) > X_BORDER_LIMIT)
      || (Y_BORDER_LIMIT && Math.abs(y) > Y_BORDER_LIMIT)) {
      nextCells.delete(cell)
      return
    }
    const alive = allCells.has(cell)
    const neighboursCount = neighboursAliveCount(x, y)
    if (!alive && neighboursCount === 3) {
      changed = true
      nextCells.add(cell)
    }
    else if ((neighboursCount > 3 || neighboursCount < 2) && alive) {
      changed = true
      nextCells.delete(cell)
    }
  })
  if (!changed) {
    playStop()
  }
  return nextCells
}

function getNeighboursCoords(coord) {
  const { x, y } = s(coord)
  let leftX = x - 1
  let rightX = x + 1
  let downY = y - 1
  let upY = y + 1
  if (x === -X_BORDER_LIMIT) leftX = X_BORDER_LIMIT
  else if (x === X_BORDER_LIMIT) rightX = -X_BORDER_LIMIT
  if (y === -Y_BORDER_LIMIT) downY = Y_BORDER_LIMIT
  else if (y === Y_BORDER_LIMIT) upY = -Y_BORDER_LIMIT
  const neighbours = [
    k(leftX, downY),
    k(leftX, upY),
    k(leftX, y),
    k(x, downY),
    k(x, upY),
    k(rightX, y),
    k(rightX, upY),
    k(rightX, downY),
  ]
  return neighbours.filter(cell => cell)
}
function neighboursAliveCount(x, y) {
  let leftX = x - 1
  let rightX = x + 1
  let downY = y - 1
  let upY = y + 1
  if (x === -X_BORDER_LIMIT) leftX = X_BORDER_LIMIT
  else if (x === X_BORDER_LIMIT) rightX = -X_BORDER_LIMIT
  if (y === -Y_BORDER_LIMIT) downY = Y_BORDER_LIMIT
  else if (y === Y_BORDER_LIMIT) upY = -Y_BORDER_LIMIT
  const neighbours = [
    k(leftX, downY),
    k(leftX, y),
    k(leftX, upY),
    k(x, downY),
    k(x, upY),
    k(rightX, downY),
    k(rightX, y),
    k(rightX, upY),
  ]
  return neighbours.filter(cell => allCells.has(cell)).length
}
function nextStep() {
  console.time('Process')
  allCells = generateNextMap()
  console.timeEnd('Process')
  console.time('Render')
  render()
  console.timeEnd('Render')
}
// function timer(ms) { return new Promise(res => setTimeout(res, ms)); }
async function playStop() {
  let playStopBtn = document.querySelector('#playstop')
  if (GAME === undefined) {
    playStopBtn.innerHTML = 'Pause'
    // GAME = true
    // while (GAME) {
    //   allCells = generateNextMap()
    //   render()
    //   await timer(TICK_INTERVAL)
    // }
    GAME = setInterval(nextStep, TICK_INTERVAL)
  }
  else {
    playStopBtn.innerHTML = 'Resume'
    clearInterval(GAME)
    GAME = undefined
  }
}
function reset() {
  clearInterval(GAME)
  let playStopBtn = document.querySelector('#playstop')
  playStopBtn.innerHTML = 'Play'
  GAME = undefined
  var r = document.querySelector(':root');
  r.style.setProperty('--cell-size', `60px`);
  document.querySelector('body').focus()

  init()
  render()
}

function init(label) {
  MIN_X = 0
  MAX_X = 0
  MIN_Y = 0
  MAX_Y = 0
  load(label)
  findLimits()
}

function getCurrentLabel() {
  return (document.querySelector('#pattern-store')).value
}
function save() {
  const label = (new Date()).toLocaleString()
  store.push(
    {
      label,
      map: Array.from(allCells.keys())
    }
  )
  const option = document.createElement('option')
  option.value = label
  option.text = label
  const select = document.querySelector('#pattern-store')
  select.add(option)
}

function load(reqLabel) {
  const currentLabel = reqLabel || getCurrentLabel()
  allCells = new Set()
  store.find(({ label }) => currentLabel === label).map.map(coord => allCells.add(coord))
  render()
}

class Pattern {
  map = []
  constructor() {
  }
  turn180() {
    this.map = this.map.map(b => { return b.split(',').map((c) => Number(c) * -1).join(',') })
    return this
  }
  turn90() {
    this.map = this.map.map(b => {
      const [x, y] = b.split(',')
      return [Number(y) * -1, x].join(',')
    })
    return this
  }
  turn270() {
    this.map = this.map.map(b => {
      const [x, y] = b.split(',')
      return [y, Number(x) * -1].join(',')
    })
    return this
  }
  xMirror() {
    this.map = this.map.map(b => {
      const [x, y] = b.split(',')
      return [Number(x) * -1, y].join(',')
    })
    return this
  }
  yMirror() {
    this.map = this.map.map(b => {
      const [x, y] = b.split(',')
      return [x, Number(y) * -1].join(',')
    })
    return this
  }
  move(xDelta, yDelta) {
    console.log(this.map);
    this.map = this.map.map(b => {
      const [x, y] = b.split(',')
      return [
        xDelta
          ? Number(x) + xDelta
          : x,
        yDelta
          ? Number(y) + yDelta
          : y,
      ].join(',')
    })
    return this
  }
}
class Eater extends Pattern {
  constructor() {
    super()
    return this
  }
  map = [
    "0,0", "0,-1", "1,0", "2,-1", "2,-2", "2,-3", "3,-3"
  ]
}
class GunGlider extends Pattern {
  constructor() {
    super()
    return this
  }
  map = [
    "0,3", "0,4", "1,3", "1,4", "4,3",
    "5,2", "5,3", "5,4", "6,1", "6,5",
    "7,3", "8,0", "8,6", "9,0", "9,6",
    "10,1", "10,5", "11,2", "11,3", "11,4",
    "21,1", "25,2", "25,3", "25,7", "25,8",
    "27,3", "27,7", "28,4", "28,5", "28,6",
    "29,4", "29,5", "29,6",
    "34,4", "34,5", "35,4", "35,5",
  ]
}
class PseudoBarberpole extends Pattern {
  constructor() {
    super()
    return this
  }
  map = [
    "0,0", "0,1", "1,0", "2,2", "3,2",
    "3,4", "5,4", "5,6", "7,6", "7,8",
    "9,8", "9,9", "10,11", "11,10", "11,11"
  ]
}
class Octagon2 extends Pattern {
  constructor() {
    super()
    return this
  }
  map = [
    "0,1", "1,0", "0,4", "1,5", "4,5",
    "5,4", "4,0", "5,1", "1,2", "2,1",
    "1,3", "2,4", "3,4", "4,3", "3,1",
    "4,2",
  ]
}
class SilversP5 extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["2,0", "3,0", "0,5", "0,6", "1,6", "7,2", "7,1", "8,1", "9,2", "10,2", "10,1", "1,4", "3,3", "2,1", "4,4", "3,2", "4,3"]
}
class Fumarole extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "0,1", "1,0", "2,1", "2,2", "1,4", "1,3", "2,4", "3,5", "4,5", "6,4", "5,4", "5,2", "5,1", "6,3", "6,0", "7,0", "7,1"]
}
class PenToad extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["1,0", "0,0", "1,1", "1,2", "2,3", "3,2", "9,9", "10,8", "11,9", "11,10", "11,11", "12,11", "7,4", "5,7", "3,3", "9,8", "6,4", "6,7", "5,5", "7,6", "5,4", "7,7"]
}
class Block extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["1,0", "0,0", "1,1", "0,1"]
}
class Tub extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["1,0", "1,2", "0,1", "2,1"]
}
class Boat extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,0", "1,2", "0,1", "2,1"]
}
class Canoe extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,0", "3,2", "4,3", "4,4", "3,4", "0,1", "2,1"]
}
class Ship extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,0", "0,1", "2,1", "1,2", "2,2"]
}
class Loaf extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,2", "2,0", "1,0", "0,1", "3,1", "1,3", "2,2"]
}
class Pond extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,2", "2,0", "1,0", "0,1", "3,1", "2,3", "1,3", "3,2"]
}
class OneCellThick extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,0", "2,0", "3,0", "4,0", "5,0", "6,0", "7,0", "9,0", "10,0", "11,0", "12,0", "13,0", "17,0", "18,0", "19,0", "26,0", "27,0", "28,0", "29,0", "30,0", "31,0", "32,0", "34,0", "35,0", "36,0", "37,0", "38,0",]
}
class Bee extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,1", "1,-1", "2,2", "2,-2", "3,1", "3,0", "3,-1", "4,2", "4,3", "4,-2", "4,-3"]
}
class QuadBee extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0","1,1","1,-1","2,2","2,-2","3,1","3,0","3,-1","4,2","4,3","4,-2","4,-3","9,17","8,18","8,16","7,19","7,15","6,18","6,17","6,16","5,19","5,20","5,15","5,14","-4,13","-5,12","-3,12","-6,11","-2,11","-5,10","-4,10","-3,10","-6,9","-7,9","-2,9","-1,9","13,4","14,5","12,5","15,6","11,6","14,7","13,7","12,7","15,8","16,8","11,8","10,8"]
}
class Glider extends Pattern {
  constructor() {
    super()
    return this
  }
  map = ["0,0", "1,1", "1,-1", "2,2", "2,-2", "3,1", "3,0", "3,-1", "4,2", "4,3", "4,-2", "4,-3"]
}

let store = [
  {
    label: "home",
    map: [
      ...new Bee().map,
      ...new Bee().xMirror().move(9,17).map,
      ...new Bee().xMirror().turn90().move(-4,13).map,
      ...new Bee().xMirror().turn270().move(13,4).map,
    ]
  },
  {
    label: "empty",
    map: []
  },
]

init('home')
render()


document.querySelector('body').addEventListener("keydown", (event) => {
  switch (event.key) {
    case 'ArrowRight':
      nextStep()
      break;
    case ' ':
      playStop()
      break;
    case 'r':
    case 'R':
      reset()
    default:
      break;
  }
});
