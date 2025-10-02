document.addEventListener('DOMContentLoaded', function() {
    // Game state variables
    let board = ['', '', '', '', '', '', '', '', ''];
    let gameActive = true;
    let playerSymbol = 'X';
    let aiSymbol = 'O';
    let difficulty = 'hard';
    let moveHistory = [];
    let gameHistory = [];
    let stats = {
        wins: 0,
        losses: 0,
        draws: 0
    };
    let isAITurn = false;

    // Load click sound
    const clickSound = new Audio('click.wav');

    function playClickSound() {
        clickSound.currentTime = 0; // restart if already playing
        clickSound.play();
    }

    // DOM elements
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const restartButton = document.getElementById('restart');
    const hintButton = document.getElementById('hint');
    const undoButton = document.getElementById('undo');
    const gameOverModal = document.getElementById('gameOverModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const playAgainButton = document.getElementById('playAgain');
    const playerXButton = document.getElementById('player-x');
    const playerOButton = document.getElementById('player-o');
    const winsElement = document.getElementById('wins');
    const lossesElement = document.getElementById('losses');
    const drawsElement = document.getElementById('draws');
    const historyList = document.getElementById('history-list');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');

    // Initialize the game
    function initGame() {
        createBoard();
        updateStatus();
        loadStats();
        loadGameHistory();

        // Event listeners
        restartButton.addEventListener('click', () => { playClickSound(); restartGame(); });
        hintButton.addEventListener('click', () => { playClickSound(); showHint(); });
        undoButton.addEventListener('click', () => { playClickSound(); undoMove(); });
        playAgainButton.addEventListener('click', () => { playClickSound(); restartGame(); });
        playerXButton.addEventListener('click', () => { playClickSound(); setPlayerSymbol('X'); });
        playerOButton.addEventListener('click', () => { playClickSound(); setPlayerSymbol('O'); });

        difficultyButtons.forEach(button => {
            button.addEventListener('click', function() {
                playClickSound();
                setDifficulty(this.dataset.difficulty);
            });
        });

        // Start the game with AI move if player is O
        if (playerSymbol === 'O') {
            startAITurn();
        }
    }

    // Create the game board
    function createBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', () => {
                playClickSound();
                handleCellClick(i);
            });
            boardElement.appendChild(cell);
        }
    }

    // Handle cell click
    function handleCellClick(index) {
        if (!gameActive || board[index] !== '' || isAITurn) return;
        makeMove(index, playerSymbol);
        if (gameActive && !checkGameOver()) {
            startAITurn();
        }
    }

    // Start AI turn
    function startAITurn() {
        if (!gameActive || isAITurn) return;
        isAITurn = true;
        updateStatus();

        setTimeout(() => {
            const aiMove = getAIMove();
            if (aiMove !== -1) {
                makeMove(aiMove, aiSymbol);
            }
            isAITurn = false;
            updateStatus();
        }, 500);
    }

    // Make a move
    function makeMove(index, symbol) {
        board[index] = symbol;
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = symbol;
        cell.classList.add(symbol.toLowerCase());
        moveHistory.push({index, symbol});
        checkGameOver();
    }

    // Check if game is over
    function checkGameOver() {
        const winningCombination = checkWin();
        if (winningCombination) {
            endGame(winningCombination);
            return true;
        } else if (isBoardFull()) {
            endGame(null);
            return true;
        }
        return false;
    }

    // AI move selection
    function getAIMove() {
        if (difficulty === 'easy') return getRandomMove();
        if (difficulty === 'medium') return Math.random() < 0.7 ? getBestMove() : getRandomMove();
        return getBestMove();
    }

    function getRandomMove() {
        const emptyCells = board.map((cell, index) => cell === '' ? index : null).filter(cell => cell !== null);
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
    }

    function getBestMove() {
        return minimax(board, aiSymbol).index;
    }

    // Minimax algorithm
    function minimax(newBoard, player) {
        const availableSpots = newBoard.map((cell, index) => cell === '' ? index : null).filter(cell => cell !== null);

        if (checkWinForBoard(newBoard, playerSymbol)) return { score: -10 };
        if (checkWinForBoard(newBoard, aiSymbol)) return { score: 10 };
        if (availableSpots.length === 0) return { score: 0 };

        const moves = [];
        for (let i = 0; i < availableSpots.length; i++) {
            const move = {};
            move.index = availableSpots[i];
            newBoard[availableSpots[i]] = player;

            if (player === aiSymbol) move.score = minimax(newBoard, playerSymbol).score;
            else move.score = minimax(newBoard, aiSymbol).score;

            newBoard[availableSpots[i]] = '';
            moves.push(move);
        }

        let bestMove;
        if (player === aiSymbol) {
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }

        return moves[bestMove];
    }

    function checkWinForBoard(boardState, player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winPatterns.some(pattern => pattern.every(index => boardState[index] === player));
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return pattern;
        }
        return null;
    }

    function isBoardFull() {
        return board.every(cell => cell !== '');
    }

    function updateStatus() {
        if (!gameActive) {
            statusElement.textContent = "Game Over";
            boardElement.classList.remove('ai-thinking');
            return;
        }
        if (isAITurn) {
            statusElement.textContent = "AI is thinking...";
            boardElement.classList.add('ai-thinking');
        } else {
            statusElement.textContent = "Your turn! Make a move.";
            boardElement.classList.remove('ai-thinking');
        }
    }

    function endGame(winningCombination) {
        gameActive = false;
        isAITurn = false;
        boardElement.classList.remove('ai-thinking');

        if (winningCombination) {
            winningCombination.forEach(index => {
                document.querySelector(`.cell[data-index="${index}"]`).classList.add('winning');
            });
            const winner = board[winningCombination[0]];
            if (winner === playerSymbol) {
                modalTitle.textContent = "Congratulations!";
                modalMessage.textContent = "You won against the AI!";
                stats.wins++;
                createConfetti();
                addToHistory('win');
            } else {
                modalTitle.textContent = "Game Over";
                modalMessage.textContent = "The AI won. Better luck next time!";
                stats.losses++;
                addToHistory('loss');
            }
        } else {
            modalTitle.textContent = "It's a Draw!";
            modalMessage.textContent = "The game ended in a tie.";
            stats.draws++;
            addToHistory('draw');
        }

        updateStats();
        saveStats();
        saveGameHistory();
        gameOverModal.style.display = 'flex';
    }

    function restartGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;
        isAITurn = false;
        moveHistory = [];
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        boardElement.classList.remove('ai-thinking');
        updateStatus();
        gameOverModal.style.display = 'none';
        if (playerSymbol === 'O') startAITurn();
    }

    function showHint() {
        if (!gameActive || isAITurn) return;
        const hintMove = getBestMove();
        const cell = document.querySelector(`.cell[data-index="${hintMove}"]`);
        cell.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        setTimeout(() => { cell.style.backgroundColor = ''; }, 1000);
    }

    function undoMove() {
        if (moveHistory.length < 2 || !gameActive || isAITurn) return;
        const aiMove = moveHistory.pop();
        const playerMove = moveHistory.pop();
        board[aiMove.index] = '';
        board[playerMove.index] = '';
        document.querySelector(`.cell[data-index="${aiMove.index}"]`).textContent = '';
        document.querySelector(`.cell[data-index="${aiMove.index}"]`).className = 'cell';
        document.querySelector(`.cell[data-index="${playerMove.index}"]`).textContent = '';
        document.querySelector(`.cell[data-index="${playerMove.index}"]`).className = 'cell';
        isAITurn = false;
        boardElement.classList.remove('ai-thinking');
        updateStatus();
    }

    function setPlayerSymbol(symbol) {
        playerSymbol = symbol;
        aiSymbol = symbol === 'X' ? 'O' : 'X';
        if (symbol === 'X') {
            playerXButton.classList.add('btn-primary');
            playerXButton.classList.remove('btn-secondary');
            playerOButton.classList.add('btn-secondary');
            playerOButton.classList.remove('btn-primary');
        } else {
            playerOButton.classList.add('btn-primary');
            playerOButton.classList.remove('btn-secondary');
            playerXButton.classList.add('btn-secondary');
            playerXButton.classList.remove('btn-primary');
        }
        restartGame();
    }

    function setDifficulty(level) {
        difficulty = level;
        difficultyButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.difficulty === level);
        });
    }

    function updateStats() {
        winsElement.textContent = stats.wins;
        lossesElement.textContent = stats.losses;
        drawsElement.textContent = stats.draws;
    }

    function addToHistory(result) {
        const now = new Date();
        const timestamp = now.toLocaleString();
        gameHistory.unshift({ result, timestamp, difficulty });
        if (gameHistory.length > 10) gameHistory.pop();
        updateHistoryDisplay();
    }

    function updateHistoryDisplay() {
        historyList.innerHTML = '';
        gameHistory.forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item', game.result);
            let resultText = game.result === 'win' ? 'Win' : game.result === 'loss' ? 'Loss' : 'Draw';
            historyItem.innerHTML = `<span>${resultText}</span><span>${game.difficulty}</span><span>${game.timestamp}</span>`;
            historyList.appendChild(historyItem);
        });
    }

    function saveStats() {
        localStorage.setItem('ticTacToeStats', JSON.stringify(stats));
    }

    function loadStats() {
        const savedStats = localStorage.getItem('ticTacToeStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
            updateStats();
        }
    }

    function saveGameHistory() {
        localStorage.setItem('ticTacToeHistory', JSON.stringify(gameHistory));
    }

    function loadGameHistory() {
        const savedHistory = localStorage.getItem('ticTacToeHistory');
        if (savedHistory) {
            gameHistory = JSON.parse(savedHistory);
            updateHistoryDisplay();
        }
    }

    function createConfetti() {
        const colors = ['#4a6fa5', '#6b8cbc', '#ff6b6b', '#2ecc71', '#f39c12'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
            document.body.appendChild(confetti);
            setTimeout(() => { confetti.remove(); }, 5000);
        }
    }

    // Initialize the game
    initGame();
});
