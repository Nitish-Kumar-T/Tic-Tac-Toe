const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const restartButton = document.getElementById('restart');
const twoPlayerModeButton = document.getElementById('two-player-mode');
const aiModeButton = document.getElementById('ai-mode');
const xScoreElement = document.getElementById('x-score');
const oScoreElement = document.getElementById('o-score');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const aiDifficultySelect = document.getElementById('ai-difficulty');

let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let aiMode = false;
let scores = { X: 0, O: 0 };
let aiDifficulty = 'easy';
let moveHistory = [];
let redoStack = [];

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const clickSound = new Audio('click.mp3');
const winSound = new Audio('win.mp3');
const drawSound = new Audio('draw.mp3');

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
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
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

    cellPlayed(cells[bestMove], bestMove);
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

    for (let i = 0; i < 9; i++) {
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
        for (let i = 0; i < 9; i++) {
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
        for (let i = 0; i < 9; i++) {
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
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a] === 'O' ? 1 : -1;
        }
    }
    if (!gameState.includes('')) return 0;
    return null;
}

function restartGame() {
    currentPlayer = 'X';
    gameState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    status.textContent = `Player ${currentPlayer}'s turn`;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o');
    });
    moveHistory = [];
    redoStack = [];

    if (aiMode && currentPlayer === 'O') {
        setTimeout(aiMove, 500);
    }
}

function setGameMode(mode) {
    aiMode = mode === 'ai';
    restartGame();
    status.textContent = aiMode ? "Playing against AI" : "2 Player Mode";
    aiDifficultySelect.style.display = aiMode ? 'inline-block' : 'none';
}

function undo() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    redoStack.push(lastMove);

    gameState[lastMove.cell] = '';
    cells[lastMove.cell].textContent = '';
    cells[lastMove.cell].classList.remove(lastMove.player.toLowerCase());

    currentPlayer = lastMove.player === 'X' ? 'O' : 'X';
    status.textContent = `Player ${currentPlayer}'s turn`;
    gameActive = true;

    if (aiMode && moveHistory.length > 0) {
        const aiMove = moveHistory.pop();
        redoStack.push(aiMove);

        gameState[aiMove.cell] = '';
        cells[aiMove.cell].textContent = '';
        cells[aiMove.cell].classList.remove(aiMove.player.toLowerCase());

        currentPlayer = 'X';
    }
}

function redo() {
    if (redoStack.length === 0) return;

    const move = redoStack.pop();
    moveHistory.push(move);

    gameState[move.cell] = move.player;
    cells[move.cell].textContent = move.player;
    cells[move.cell].classList.add(move.player.toLowerCase());

    currentPlayer = move.player === 'X' ? 'O' : 'X';
    status.textContent = `Player ${currentPlayer}'s turn`;
    checkResult();

    if (aiMode && currentPlayer === 'O' && redoStack.length > 0) {
        const aiMove = redoStack.pop();
        moveHistory.push(aiMove);

        gameState[aiMove.cell] = aiMove.player;
        cells[aiMove.cell].textContent = aiMove.player;
        cells[aiMove.cell].classList.add(aiMove.player.toLowerCase());

        currentPlayer = 'X';
        checkResult();
    }
}

cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

restartButton.addEventListener('click', restartGame);
twoPlayerModeButton.addEventListener('click', () => setGameMode('two-player'));
aiModeButton.addEventListener('click', () => setGameMode('ai'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);
aiDifficultySelect.addEventListener('change', (e) => {
    aiDifficulty = e.target.value;
});

status.textContent = `Player ${currentPlayer}'s turn`;