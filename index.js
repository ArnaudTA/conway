let idx = 0
let GAME = undefined
let TICK_INTERVAL = 100
function generateMatrix(height, width) {
  const matrixNow = []
  let x = 0
  let y = 0
  for (let idxH = 0; idxH < height; idxH++) {
    const rowNow = []
    for (let idxW = 0; idxW < width; idxW++) {
      rowNow.push({ id: `cell${idx++}`, alive: false, x, y })
      x++
    }
    matrixNow.push(rowNow)
    y++
    x = 0
  }
  return matrixNow
}

function flipCoords(x, y) {
  matrixNow[y][x].alive = !matrixNow[y][x].alive
}

function stateNextStep(cell) {
  const { x, y } = cell
  const neighbours = [
    getByCoords(x - 1, y - 1),
    getByCoords(x - 1, y),
    getByCoords(x - 1, y + 1),
    getByCoords(x, y - 1),
    getByCoords(x, y + 1),
    getByCoords(x + 1, y - 1),
    getByCoords(x + 1, y),
    getByCoords(x + 1, y + 1)
  ]
  const aliveNeighboursCount = neighbours.filter(cell => cell?.alive).length
  if (!cell.alive && aliveNeighboursCount === 3) return { ...cell, alive: true }
  else if (cell.alive && (aliveNeighboursCount >= 2 && aliveNeighboursCount <= 3)) return cell
  else return { ...cell, alive: false }
}

function getByCoords(x, y, matrix) {
  matrix = matrix ? matrix : matrixNow
  for (const row of matrix) {
    for (const cell of row) {
      if (cell.x === x && cell.y === y) {
        return cell
      }
    }
  }
}

function flipMatrixId(id) {
  const cell = matrixNow.find(row => {
    return row.find(cell => {
      if (cell.id === id) {
        cell.alive = !cell.alive
        console.log('flip', id);
        return true
      }
    })
  })
}

function flipState(event) {
  flipMatrixId(event.target.id)
  event.target.classList.toggle('isAlive')
}

function clean(element) {
  element.childNodes.forEach(child => element.removeChild(child))
}

function createRow(arr) {
  tr = document.createElement('tr')
  for (const cell of arr) {
    tr.appendChild(createCell(cell))
  }
  return tr
}

function createCell(cell) {
  td = document.createElement('td')
  td.id = cell.id
  if (cell.alive) td.classList = ['isAlive']
  td.onclick = flipState
  return td
}

function generateGrid(matrix) {
  const table = document.createElement('table')
  for (const row of matrix) {
    const tr = createRow(row)
    table.appendChild(tr)
  }
  return table
}

function reset() {
  clearInterval(GAME)
  let playStopBtn = document.querySelector('#playstop')
  playStopBtn.innerHTML = 'Play'
  GAME = undefined
  let width = Number((document.querySelector("#width")).value)
  let height = Number((document.querySelector("#height")).value)
  matrixNow = generateMatrix(height, width)
  const playground = document.querySelector('#playground')
  const table = generateGrid(matrixNow)
  playground.firstChild?.remove()
  playground.appendChild(table)
}

reset()

function generateNextMatrix() {
  let changed = false
  const matrixNext = structuredClone(matrixNow)
  for (let y = 0; y < matrixNow.length; y++) {
    const rowNow = matrixNow[y];
    for (let x = 0; x < rowNow.length; x++) {
      const cellNow = rowNow[x];
      const cellNext = stateNextStep(cellNow)
      if (cellNext.alive !== cellNow.alive) {
        changed = true
        const td = document.querySelector(`#${cellNow.id}`)
        td.classList.toggle('isAlive')
      }
      matrixNext[y][x] = cellNext
    }
  }
  if (!changed) {
    playStop()
  }
  matrixNow = structuredClone(matrixNext)
}

function playStop() {
  let playStopBtn = document.querySelector('#playstop')
  if (GAME === undefined) {
    playStopBtn.innerHTML = 'Pause'
    GAME = setInterval(() => {
      generateNextMatrix()
    }, TICK_INTERVAL)
  }
  else {
    playStopBtn.innerHTML = 'Resume'
    clearInterval(GAME)
    GAME = undefined
  }
}