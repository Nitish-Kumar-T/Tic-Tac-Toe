const board = document.getElementById('board');
const status = document.getElementById('status');
const restartButton = document.getElementById('restart');
const twoPlayerModeButton = document.getElementById('two-player-mode');
const aiModeButton = document.getElementById('ai-mode');
const xScoreElement = document.getElementById('x-score');
const oScoreElement = document.getElementById('o-score');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const aiDifficultySelect = document.getElementById('ai-difficulty');
const boardSizeSelect = document.getElementById('board-size-select');
const themeSelect = document.getElementById('theme-select');

let currentPlayer = 'X';
let gameState = [];
let gameActive = true;
let aiMode = false;
let scores = { X: 0, O: 0 };
let aiDifficulty = 'easy';
let moveHistory = [];
let redoStack = [];
let boardSize = 3;

const clickSound = new Audio('click.mp3');
const winSound = new Audio('win.mp3');
const drawSound = new Audio('draw.mp3');

function initializeGame() {
    boardSize = parseInt(boardSizeSelect.value);
    gameState = Array(boardSize * boardSize).fill('');
    board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    board.innerHTML = '';
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-cell-index', i);
        cell.style.width = `${300 / boardSize}px`;
        cell.style.height = `${300 / boardSize}px`;
        cell.style.fontSize = `${120 / boardSize}px`;
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
    }
    currentPlayer = 'X';
    gameActive = true;
    moveHistory = [];
    redoStack = [];
    status.textContent = `Player ${currentPlayer}'s turn`;
}

function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    if (gameState[clickedCellIndex] !== '' || !gameActive) {
        return;
    }

    cellPlayed(clickedCell, clickedCellIndex);
    checkResult();

    moveHistory.push({
        cell: clickedCellIndex,
        player: currentPlayer
    });
    redoStack = [];

    if (aiMode && gameActive && currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
}

function cellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add(currentPlayer.toLowerCase());
    clickSound.play();
}

function checkResult() {
    const winningConditions = getWinningConditions();
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        if (a === '') continue;
        
        let win = true;
        for (let j = 1; j < boardSize; j++) {
            if (gameState[winCondition[j]] !== a) {
                win = false;
                break;
            }
        }
        
        if (win) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        status.textContent = `Player ${currentPlayer} wins!`;
        gameActive = false;
        winSound.play();
        updateScore(currentPlayer);
        return;
    }

    if (!gameState.includes('')) {
        status.textContent = "It's a draw!";
        gameActive = false;
        drawSound.play();
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    status.textContent = `Player ${currentPlayer}'s turn`;
}

function getWinningConditions() {
    const winningConditions = [];

    for (let i = 0; i < boardSize; i++) {
        winningConditions.push(Array.from({length: boardSize}, (_, j) => i * boardSize + j));
    }

    for (let i = 0; i < boardSize; i++) {
        winningConditions.push(Array.from({length: boardSize}, (_, j) => i + j * boardSize));
    }

    winningConditions.push(Array.from({length: boardSize}, (_, i) => i * (boardSize + 1)));
    winningConditions.push(Array.from({length: boardSize}, (_, i) => (i + 1) * (boardSize - 1)));

    return winningConditions;
}

function updateScore(winner) {
    scores[winner]++;
    xScoreElement.textContent = `X: ${scores.X}`;
    oScoreElement.textContent = `O: ${scores.O}`;
}

function aiMove() {
    let bestMove;
    
    switch (aiDifficulty) {
        case 'easy':
            bestMove = getRandomEmptyCell();
            break;
        case 'medium':
            bestMove = Math.random() < 0.5 ? getBestMove() : getRandomEmptyCell();
            break;
        case 'hard':
            bestMove = getBestMove();
            break;
    }

    cellPlayed(board.children[bestMove], bestMove);
    checkResult();

    moveHistory.push({
        cell: bestMove,
        player: currentPlayer
    });
    redoStack = [];
}

function getRandomEmptyCell() {
    const emptyCells = gameState.reduce((acc, cell, index) => {
        if (cell === '') acc.push(index);
        return acc;
    }, []);
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestMove;

    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'O';
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    let result = checkWinner();
    if (result !== null) {
        return result;
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner() {
    const winningConditions = getWinningConditions();
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        if (a === '') continue;
        
        let win = true;
        for (let j = 1; j < boardSize; j++) {
            if (gameState[winCondition[j]] !== a) {
                win = false;
                break;
            }
        }
        
        if (win) {
            return a === 'O' ? 1 : -1;
        }
    }
    if (!gameState.includes('')) return 0;
    return null;
}

function undo() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    redoStack.push(lastMove);

    gameState[lastMove.cell] = '';
    board.children[lastMove.cell].textContent = '';
    board.children[lastMove.cell].classList.remove(lastMove.player.toLowerCase());

    currentPlayer = lastMove.player === 'X' ? 'O' : 'X';
    status.textContent = `Player ${currentPlayer}'s turn`;
    gameActive = true;

    if (aiMode && moveHistory.length > 0) {
        const aiMove = moveHistory.pop();
        redoStack.push(aiMove);

        gameState[aiMove.cell] = '';
        board.children[aiMove.cell].textContent = '';
        board.children[aiMove.cell].classList.remove(aiMove.player.toLowerCase());

        currentPlayer = 'X';
    }
}

function redo() {
    if (redoStack.length === 0) return;

    const move = redoStack.pop();
    moveHistory.push(move);

    gameState[move.cell] = move.player;
    board.children[move.cell].textContent = move.player;
    board.children[move.cell].classList.add(move.player.toLowerCase());

    currentPlayer = move.player === 'X' ? 'O' : 'X';
    status.textContent = `Player ${currentPlayer}'s turn`;
    checkResult();
}

document.addEventListener('DOMContentLoaded', initializeGame);
boardSizeSelect.addEventListener('change', initializeGame);
restartButton.addEventListener('click', initializeGame);
twoPlayerModeButton.addEventListener('click', () => {
    aiMode = false;
    aiDifficultySelect.style.display = 'none';
    initializeGame();
});
aiModeButton.addEventListener('click', () => {
    aiMode = true;
    aiDifficultySelect.style.display = 'inline-block';
    initializeGame();
});
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
aiDifficultySelect.addEventListener('change', (e) => {
    aiDifficulty = e.target.value;
});

themeSelect.addEventListener('change', (e) => {
    document.body.className = e.target.value;
});

initializeGame();
