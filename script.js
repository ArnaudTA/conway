let GAME
let TICK_INTERVAL = 200
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
  // allCells.keys
  // console.log(typeof allCells);
  Array.from(allCells.keys()).forEach(key => {
    const { x, y } = s(key)
    // console.log({ x, y });
    if (x < MIN_X) MIN_X = x
    if (x > MAX_X) MAX_X = x
    if (y < MIN_Y) MIN_Y = y
    if (y > MAX_Y) MAX_Y = y
  })
  // console.log({
  //   MIN_X,
  //   MAX_X,
  //   MIN_Y,
  //   MAX_Y,
  // });
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
  for (let y = MAX_Y + 5; y >= MIN_Y - 5; y--) {
    const newTrDOM = document.createElement('tr')
    newTrDOM.y = y
    for (let x = MIN_X - 5; x <= MAX_X + 5; x++) {
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
  if (x < MIN_X + 2 || x > MAX_X - 2 || y < MIN_Y + 2 || y < MAX_Y) findLimits()
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
    getNeighboursCoords(cell).forEach(candidateCell => candidateCells.add(candidateCell))
  })
  candidateCells.forEach(cell => {
    const { x, y } = s(cell)

    const alive = allCells.has(cell)
    const neighboursCount = neighboursAliveCount(x, y)
    console.log(neighboursCount, cell, alive);
    if (!alive && neighboursCount === 3) {
      console.log('création de', cell);
      changed = true
      nextCells.add(cell)
    }
    else if ((neighboursCount > 3 || neighboursCount < 2) && alive) {
      console.log(neighboursCount, cell, alive);
      console.log('mort de', cell);
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
  const neighbours = [
    k(x - 1, y - 1),
    k(x - 1, y),
    k(x - 1, y + 1),
    k(x, y - 1),
    k(x, y + 1),
    k(x + 1, y - 1),
    k(x + 1, y),
    k(x + 1, y + 1)
  ]
  return neighbours.filter(cell => cell)
}
function neighboursAliveCount(x, y) {
  const neighbours = [
    k(x - 1, y - 1),
    k(x - 1, y),
    k(x - 1, y + 1),
    k(x, y - 1),
    k(x, y + 1),
    k(x + 1, y - 1),
    k(x + 1, y),
    k(x + 1, y + 1),
  ]
  return neighbours.filter(cell => allCells.has(cell)).length
}
function nextStep() {
  allCells = generateNextMap()
  render()
}
function timer(ms) { return new Promise(res => setTimeout(res, ms)); }
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

const a = [
  "-1,-16",
  "-1,-17",
  "34,-15",
  "34,-16",
  "1,16",
  "1,17",
  "-34,15",
  "-34,16",
  "33,-16",
  "-33,16",
  "33,-15",
  "-33,15",
  "0,-16",
  "0,16",
  "0,-17",
  "0,17",
  "14,-15",
  "-14,15",
  "26,-18",
  "14,-13",
  "26,-12",
  "6,-7",
  "-6,7",
  "-26,12",
  "-14,13",
  "-26,18",
  "6,-18",
  "6,-16",
  "29,-16",
  "13,-14",
  "29,-14",
  "6,-6",
  "-6,6",
  "-29,14",
  "-13,14",
  "-29,16",
  "-6,16",
  "-6,18",
  "5,-17",
  "28,-17",
  "23,-15",
  "27,-15",
  "30,-15",
  "13,-13",
  "18,-13",
  "28,-13",
  "7,-5",
  "-7,5",
  "-28,13",
  "-18,13",
  "-13,13",
  "-30,15",
  "-27,15",
  "-23,15",
  "-28,17",
  "-5,17",
  "9,-20",
  "7,-19",
  "9,-19",
  "5,-18",
  "25,-18",
  "6,-17",
  "24,-17",
  "5,-16",
  "23,-16",
  "7,-15",
  "9,-15",
  "29,-15",
  "9,-14",
  "23,-14",
  "15,-13",
  "24,-13",
  "25,-12",
  "8,-6",
  "6,-5",
  "-6,5",
  "-8,6",
  "-25,12",
  "-24,13",
  "-15,13",
  "-23,14",
  "-9,14",
  "-29,15",
  "-9,15",
  "-7,15",
  "-23,16",
  "-5,16",
  "-24,17",
  "-6,17",
  "-25,18",
  "-5,18",
  "-9,19",
  "-7,19",
  "-9,20"

]
const d = [
  "1,16", "1,17", "16,-1", "17,-1", "15,34",
  "16,34", "16,33", "15,33", "16,0", "0,16",
  "17,0", "0,17", "14,18", "16,18", "1,3",
  "10,9", "16,14", "18,14", "12,22", "18,22",
  "1,2", "9,9", "15,11", "19,11", "15,13",
  "19,13", "14,17", "16,17", "13,22", "17,22",
  "15,25", "2,1", "8,10", "14,12", "20,12",
  "17,14", "15,16", "16,16", "15,19", "12,23",
  "18,23", "13,24", "17,24", "14,25", "16,25",
  "1,1", "3,2", "8,9", "16,10", "17,10",
  "18,10", "9,11", "15,15", "18,15", "17,16",
  "17,17", "14,23", "16,23", "14,24", "15,24",
  "16,24", "15,26"
]
let store = [
  {
    label: "home",
    map: [
      // bottom right
      // top left
      ...a,
      // ...axialSymmetry(a),
      // top right
      // bottom left
      // ...d,
      // ...axialSymmetry(d)
    ]
  },
  {
    label: "empty",
    map: []
  },
]

init('home')
render()

function axialSymmetry(arr) { return arr.map(b => { return b.split(',').map((c) => Number(c) * -1).join(',') }) }
function turn90(arr) {
  return arr.map(b => {
    const [x, y] = b.split(',')
    return [Number(y) * -1, x].join(',')
  })
}

function xMirror(arr) {
  return arr.map(b => {
    const [x, y] = b.split(',')
    return [Number(x) * -1, y].join(',')
  })
}

document.querySelector('body').addEventListener("keydown", (event) => {
  console.log(event);
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