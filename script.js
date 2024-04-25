let currentPlayer = '';
let playerChoice = '';
let botChoice = '';
const cells = document.querySelectorAll('[data-cell]');
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
  [0, 4, 8], [2, 4, 6] // Diagonais
];

const chooseXBtn = document.getElementById('chooseX');
const chooseOBtn = document.getElementById('chooseO');

chooseXBtn.addEventListener('click', () => {
  playerChoice = 'X';
  botChoice = 'O';
  startGame();
});

chooseOBtn.addEventListener('click', () => {
  playerChoice = 'O';
  botChoice = 'X';
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

  // Tentar vencer
  moveMade = checkAndComplete(botChoice, availableCells);

  // Bloquear o jogador de vencer
  if (!moveMade) {
    moveMade = checkAndComplete(playerChoice, availableCells);
  }

  // Bloquear bifurcações
  if (!moveMade) {
    moveMade = blockFork(playerChoice, availableCells);
  }

  // Prevenir futuras bifurcações
  if (!moveMade) {
    moveMade = preventFutureFork(playerChoice, availableCells);
  }

  // Fazer uma jogada estratégica
  if (!moveMade) {
    moveMade = makeStrategicMove(availableCells);
  }

  // Escolher um espaço aleatório se nenhuma das opções acima for válida
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
  // Verificar se o centro está ocupado e agir de acordo
  if (cells[4].textContent !== '') {
    // Se o centro está ocupado, o bot deve tentar ocupar os cantos
    const corners = [0, 2, 6, 8];
    const opponentCorners = corners.filter(index => cells[index].textContent === player);
    if (opponentCorners.length === 1) {
      // Se o jogador ocupou apenas um canto, o bot deve ocupar o canto oposto
      const oppositeCorner = 8 - opponentCorners[0];
      if (cells[oppositeCorner].textContent === '') {
        makeMove(cells[oppositeCorner], botChoice);
        return true;
      }
    } else if (opponentCorners.length === 2) {
      // Se o jogador ocupou dois cantos opostos, o bot deve bloquear uma bifurcação
      const sideMoves = [1, 3, 5, 7];
      for (const move of sideMoves) {
        if (cells[move].textContent === '') {
          makeMove(cells[move], botChoice);
          return true;
        }
      }
    }
  }

  // Continuar com a lógica anterior para prevenir bifurcações
  for (let i = 0; i < availableCells.length; i++) {
    let testCell = availableCells[i];
    makeMove(testCell, player); // Simula a jogada do jogador
    let forks = 0;
    winningCombinations.forEach(comb => {
      if (comb.includes(parseInt(testCell.dataset.cell)) && canCreateFork(player, parseInt(testCell.dataset.cell))) {
        forks++;
      }
    });
    undoMove(testCell); // Desfaz a simulação
    if (forks > 1) {
      makeMove(testCell, botChoice); // Bloqueia a jogada se mais de uma bifurcação for possível
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