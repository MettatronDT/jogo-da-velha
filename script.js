let currentPlayer = '';
let playerChoice = '';
let botChoice = '';
const cells = document.querySelectorAll('[data-cell]');
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const chooseXBtn = document.getElementById('chooseX');
const chooseOBtn = document.getElementById('chooseO');

chooseXBtn.addEventListener('click', () => {
  playerChoice = '✖️';
  botChoice = '⭕';
  startGame();
});

chooseOBtn.addEventListener('click', () => {
  playerChoice = '⭕';
  botChoice = '✖️';
  startGame();
});

function startGame() {
  chooseXBtn.style.display = 'none';
  chooseOBtn.style.display = 'none';
  currentPlayer = playerChoice;
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });
}

function handleCellClick() {
  if (this.textContent === '' && currentPlayer === playerChoice) {
    makeMove(this, playerChoice);
    if (!checkWin(playerChoice) && !isDraw()) {
      botMove();
    }
  }
}

function makeMove(cell, player) {
  cell.textContent = player;
  cell.setAttribute('data-player', player);
  if (checkWin(player)) {
    endGame(player === playerChoice);
  } else if (isDraw()) {
    endGame(null);
  } else {
    currentPlayer = (player === playerChoice) ? botChoice : playerChoice;
  }
}

function checkWin(player) {
  return winningCombinations.some(combination => {
    return combination.every(index => {
      return cells[index].textContent === player;
    });
  });
}

function isDraw() {
  return [...cells].every(cell => cell.textContent);
}

function endGame(winner) {
  if (winner === true) {
    showMessage('Você venceu!', 'win');
  } else if (winner === false) {
    showMessage('Você perdeu!', 'lose');
  } else {
    showMessage('Empate!', 'draw');
  }
  cells.forEach(cell => {
    cell.removeEventListener('click', handleCellClick);
  });
}

function showMessage(message, className) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.classList.add('message', className);
  document.body.appendChild(messageElement);
  setTimeout(() => {
    messageElement.remove();
    resetGame();
  }, 2000);
}

function resetGame() {
  cells.forEach(cell => {
    cell.textContent = '';
    cell.removeAttribute('data-player');
  });
  currentPlayer = '';
  chooseXBtn.style.display = 'inline-block';
  chooseOBtn.style.display = 'inline-block';
}

function botMove() {
  let availableCells = [...cells].filter(cell => cell.textContent === '');
  let moveMade = false;

  moveMade = checkAndComplete(botChoice, availableCells);

  if (!moveMade) {
    moveMade = checkAndComplete(playerChoice, availableCells);
  }

  if (!moveMade) {
    moveMade = blockFork(playerChoice, availableCells);
  }

  if (!moveMade) {
    moveMade = preventFutureFork(playerChoice, availableCells);
  }

  if (!moveMade) {
    moveMade = makeStrategicMove(availableCells);
  }

  if (!moveMade) {
    const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
    makeMove(randomCell, botChoice);
  }
}

function checkAndComplete(player, availableCells) {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (cells[a].textContent === player && cells[b].textContent === player && cells[c].textContent === '') {
      makeMove(cells[c], botChoice);
      return true;
    }
    if (cells[a].textContent === player && cells[c].textContent === player && cells[b].textContent === '') {
      makeMove(cells[b], botChoice);
      return true;
    }
    if (cells[b].textContent === player && cells[c].textContent === player && cells[a].textContent === '') {
      makeMove(cells[a], botChoice);
      return true;
    }
  }
  return false;
}

function blockFork(player, availableCells) {
  let forkCells = [];
  availableCells.forEach(cell => {
    if (canCreateFork(player, parseInt(cell.dataset.cell))) {
      forkCells.push(cell);
    }
  });

  if (forkCells.length > 0) {
    makeMove(forkCells[0], botChoice);
    return true;
  }
  return false;
}

function canCreateFork(player, cellIndex) {
  let forkCount = 0;
  winningCombinations.forEach(combination => {
    if (combination.includes(cellIndex)) {
      const potentialWin = combination.filter(index => cells[index].textContent === '' || cells[index].textContent === player);
      if (potentialWin.length === combination.length) {
        forkCount++;
      }
    }
  });
  return forkCount > 1;
}

function preventFutureFork(player, availableCells) {
  if (cells[4].textContent !== '') {
    const corners = [0, 2, 6, 8];
    const opponentCorners = corners.filter(index => cells[index].textContent === player);
    if (opponentCorners.length === 1) {
      const oppositeCorner = 8 - opponentCorners[0];
      if (cells[oppositeCorner].textContent === '') {
        makeMove(cells[oppositeCorner], botChoice);
        return true;
      }
    } else if (opponentCorners.length === 2) {
      const sideMoves = [1, 3, 5, 7];
      for (const move of sideMoves) {
        if (cells[move].textContent === '') {
          makeMove(cells[move], botChoice);
          return true;
        }
      }
    }
  }

  for (let i = 0; i < availableCells.length; i++) {
    let testCell = availableCells[i];
    makeMove(testCell, player);
    let forks = 0;
    winningCombinations.forEach(comb => {
      if (comb.includes(parseInt(testCell.dataset.cell)) && canCreateFork(player, parseInt(testCell.dataset.cell))) {
        forks++;
      }
    });
    undoMove(testCell);
    if (forks > 1) {
      makeMove(testCell, botChoice);
      return true;
    }
  }
  return false;
}
function undoMove(cell) {
  cell.textContent = '';
  cell.removeAttribute('data-player');
}

function makeStrategicMove(availableCells) {
  const strategicMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (const index of strategicMoves) {
    if (cells[index].textContent === '') {
      makeMove(cells[index], botChoice);
      return true;
    }
  }
  return false;
}