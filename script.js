// Seleção de elementos do DOM
const cells = document.querySelectorAll('[data-cell]');
const restartButton = document.getElementById('restartButton');
const undoButton = document.getElementById('undoButton');
const playerTurnDisplay = document.getElementById('playerTurn');
const scoreXDisplay = document.getElementById('scoreX');
const scoreODisplay = document.getElementById('scoreO');
const resetScoreButton = document.getElementById('resetScore');
const modeSelection = document.getElementsByName('mode');
const aiSettings = document.getElementById('aiSettings');
const aiDifficultySelect = document.getElementById('aiDifficulty');
const moveHistoryList = document.getElementById('moveHistory');
const themeButtons = document.querySelectorAll('.theme-button');
const toggleVersionButton = document.getElementById('toggleVersion');

// Elementos dos Modais
const playerNamesForm = document.getElementById('playerNamesForm');
const playerXNameInput = document.getElementById('playerXName');
const playerONameInput = document.getElementById('playerOName');
const playerNamesSection = document.getElementById('playerNamesSection');

// Constantes de Classe
const X_CLASS = 'x';
const O_CLASS = 'o';
let oTurn;
let scoreX = 0;
let scoreO = 0;
let gameMode = 'twoPlayer'; // 'twoPlayer' ou 'ai'
let aiDifficulty = ''; // 'easy', 'medium', 'hard'
let board = Array(9).fill(null);
let history = []; // Histórico de jogadas
let currentVersion = 'modern'; // 'modern' ou 'legacy'

// Nomes dos Jogadores
let playerXName = 'Player X';
let playerOName = 'Player O';

// Combinações vencedoras
const WINNING_COMBINATIONS = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
];

// Inicialização do jogo
startGame();

// Adiciona event listeners
restartButton.addEventListener('click', startGame);
undoButton.addEventListener('click', undoMove);
resetScoreButton.addEventListener('click', resetScore);
modeSelection.forEach(radio => {
    radio.addEventListener('change', () => {
        gameMode = document.querySelector('input[name="mode"]:checked').value;
        aiSettings.style.display = gameMode === 'ai' ? 'block' : 'none';
        if (gameMode === 'ai') {
            aiDifficultySelect.value = '';
            disableBoard();
            playerNamesSection.style.display = 'none';
            updateScoreDisplay(); // Atualiza o placar para AI
        } else {
            enableBoard();
            playerNamesSection.style.display = 'block';
            updateScoreDisplay(); // Atualiza o placar para Dois Jogadores
            startGame();
        }
    });
});
aiDifficultySelect.addEventListener('change', () => {
    aiDifficulty = aiDifficultySelect.value;
    if (gameMode === 'ai' && aiDifficulty) {
        enableBoard();
        startGame();
    }
});
themeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const selectedTheme = button.getAttribute('data-theme');
        setActiveTheme(selectedTheme);
        themeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});
toggleVersionButton.addEventListener('click', toggleVersion);

// Evento de submissão do formulário de nomes dos jogadores
playerNamesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameX = playerXNameInput.value.trim();
    const nameO = playerONameInput.value.trim();
    if (nameX && nameO) {
        playerXName = nameX;
        playerOName = nameO;
        updateScoreDisplay();
        // Fecha o modal após salvar os nomes
        const playerNamesModal = bootstrap.Modal.getInstance(document.getElementById('playerNamesModal'));
        playerNamesModal.hide();
    }
});

// Função para iniciar ou reiniciar o jogo
function startGame() {
    board = Array(9).fill(null);
    history = [];
    oTurn = false; // X sempre inicia
    updatePlayerDisplay();
    updateMoveHistory();
    cells.forEach(cell => {
        cell.classList.remove(X_CLASS, O_CLASS, 'winning-cell', 'draw', 'animate');
        cell.removeEventListener('click', handleClick);
        cell.textContent = '';
        cell.removeAttribute('data-player');
        if (gameMode === 'ai' && !aiDifficulty) {
            cell.disabled = true;
            cell.style.pointerEvents = 'none';
        } else {
            cell.disabled = false;
            cell.style.pointerEvents = 'auto';
            cell.addEventListener('click', handleClick, { once: true });
        }
    });

    if (gameMode === 'ai') {
        // Iniciar sempre com X
        updatePlayerDisplay();
    } else {
        // Mostrar o modal para definir nomes dos jogadores no modo Dois Jogadores
        const playerNamesModalElement = document.getElementById('playerNamesModal');
        const playerNamesModal = new bootstrap.Modal(playerNamesModalElement);
        playerNamesModal.show();
    }
}

// Função para habilitar o tabuleiro
function enableBoard() {
    cells.forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.disabled = false;
    });
}

// Função para desabilitar o tabuleiro
function disableBoard() {
    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
        cell.disabled = true;
    });
}

// Função para lidar com o clique nas células
function handleClick(e) {
    const cell = e.target;
    const index = Array.from(cells).indexOf(cell);
    const currentClass = oTurn ? O_CLASS : X_CLASS;

    placeMark(cell, currentClass, index);
    addToHistory(currentClass, index);
    if (checkWin(currentClass)) {
        endGame(false, currentClass);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        if (gameMode === 'ai' && oTurn) {
            setTimeout(aiMove, 500); // Delay para melhor experiência
        }
    }
}

// Função para colocar a marca no tabuleiro
function placeMark(cell, currentClass, index) {
    cell.classList.add(currentClass, 'animate');
    cell.setAttribute('data-player', currentClass.toUpperCase());
    cell.textContent = currentClass.toUpperCase();
    board[index] = currentClass;
    updateMoveHistory();
}

// Função para adicionar jogadas ao histórico
function addToHistory(player, index) {
    history.push({ player, index });
    updateMoveHistory();
}

// Função para atualizar o histórico de jogadas
function updateMoveHistory() {
    moveHistoryList.innerHTML = '';
    history.forEach((move, idx) => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        let playerName = '';
        if (gameMode === 'twoPlayer') {
            playerName = move.player === X_CLASS ? playerXName : playerOName;
        } else {
            playerName = move.player === X_CLASS ? 'Player' : 'IA';
        }
        li.innerHTML = `<span>Jogada ${idx + 1}: <strong>${playerName}</strong> no ${indexToPosition(move.index)}</span>`;
        moveHistoryList.appendChild(li);
    });
}

// Função para converter índice em posição (1-9)
function indexToPosition(index) {
    const positions = [
        '1 (Canto Superior Esquerdo)', 
        '2 (Topo Central)', 
        '3 (Canto Superior Direito)',
        '4 (Meio Esquerdo)', 
        '5 (Centro)', 
        '6 (Meio Direito)',
        '7 (Canto Inferior Esquerdo)', 
        '8 (Inferior Central)', 
        '9 (Canto Inferior Direito)'
    ];
    return positions[index];
}

// Função para alternar as jogadas
function swapTurns() {
    oTurn = !oTurn;
    updatePlayerDisplay();
}

// Atualiza o display do jogador atual
function updatePlayerDisplay() {
    let currentPlayer = '';
    if (gameMode === 'twoPlayer') {
        currentPlayer = oTurn ? playerOName : playerXName;
    } else {
        currentPlayer = oTurn ? 'IA' : 'Player';
    }
    playerTurnDisplay.textContent = currentPlayer;
    playerTurnDisplay.classList.remove('text-danger', 'text-primary');
    if (gameMode === 'twoPlayer') {
        playerTurnDisplay.classList.add(oTurn ? 'text-primary' : 'text-danger');
    } else {
        playerTurnDisplay.classList.add(oTurn ? 'text-primary' : 'text-danger');
    }
}

// Verifica se há um vencedor
function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => board[index] === currentClass);
    });
}

// Verifica se houve empate
function isDraw() {
    return board.every(cell => cell !== null);
}

// Finaliza o jogo, declarando vencedor ou empate
function endGame(draw, winner = null) {
    if (draw) {
        document.getElementById('game').classList.add('draw');
        highlightDraw();
        setTimeout(() => alert("Empate!"), 100);
    } else {
        document.getElementById('game').classList.add('winner');
        highlightWinningCells(winner);
        let winnerName = '';
        if (gameMode === 'twoPlayer') {
            winnerName = winner === X_CLASS ? playerXName : playerOName;
        } else {
            winnerName = winner === X_CLASS ? 'Player' : 'IA';
        }
        setTimeout(() => alert(`${winnerName} Venceu!`), 100);
        if (winner === X_CLASS) {
            if (gameMode === 'twoPlayer') {
                scoreX += 1;
            } else {
                scoreX += 1; // Player
            }
        } else {
            if (gameMode === 'twoPlayer') {
                scoreO += 1;
            } else {
                scoreO += 1; // IA
            }
        }
        updateScoreDisplay();
    }

    cells.forEach(cell => {
        cell.removeEventListener('click', handleClick);
    });
}

// Função para resetar a pontuação
function resetScore() {
    scoreX = 0;
    scoreO = 0;
    updateScoreDisplay();
}

// Função para atualizar o quadro de pontuação
function updateScoreDisplay() {
    let nameX = gameMode === 'twoPlayer' ? playerXName : 'Player';
    let nameO = gameMode === 'twoPlayer' ? playerOName : 'IA';
    scoreXDisplay.innerHTML = `<strong>${nameX}</strong>: ${scoreX}`;
    scoreODisplay.innerHTML = `<strong>${nameO}</strong>: ${scoreO}`;
}

// Função para desfazer a última jogada
function undoMove() {
    if (history.length === 0) return;
    const lastMove = history.pop();
    const cell = cells[lastMove.index];
    cell.classList.remove(lastMove.player, 'animate');
    cell.removeAttribute('data-player');
    cell.textContent = '';
    board[lastMove.index] = null;
    document.getElementById('game').classList.remove('winner', 'draw');
    updateMoveHistory();
    swapTurns();
}

// Função para destacar as células vencedoras
function highlightWinningCells(winner) {
    WINNING_COMBINATIONS.forEach(combination => {
        if (combination.every(index => board[index] === winner)) {
            combination.forEach(index => {
                cells[index].classList.add('winning-cell');
            });
        }
    });
}

// Função para destacar o empate
function highlightDraw() {
    cells.forEach(cell => {
        cell.classList.add('draw');
    });
}

// Função para definir o tema ativo
function setActiveTheme(theme) {
    // Remover todas as classes de tema do body
    document.body.classList.remove('dark-theme', 'pastel-theme');

    // Remover estilos inline para garantir que o tema padrão seja claro
    if (theme === 'default') {
        // Tema claro padrão
        document.documentElement.style.removeProperty('--bg-color');
        document.documentElement.style.removeProperty('--text-color');
        document.documentElement.style.removeProperty('--card-bg');
        document.documentElement.style.removeProperty('--card-border');
        document.documentElement.style.removeProperty('--cell-bg');
        document.documentElement.style.removeProperty('--cell-hover-bg');
        document.documentElement.style.removeProperty('--winning-bg');
        document.documentElement.style.removeProperty('--draw-bg');
    } else if (theme === 'dark') {
        // Tema escuro
        document.body.classList.add('dark-theme');
    } else if (theme === 'pastel') {
        // Tema pastel com cores aleatórias
        applyRandomPastelTheme();
    }
}

// Função para aplicar cores pastel aleatórias
function applyRandomPastelTheme() {
    const pastelColors = generatePastelColors();
    document.documentElement.style.setProperty('--bg-color', pastelColors.bgColor);
    document.documentElement.style.setProperty('--text-color', pastelColors.textColor);
    document.documentElement.style.setProperty('--card-bg', pastelColors.cardBg);
    document.documentElement.style.setProperty('--card-border', pastelColors.cardBorder);
    document.documentElement.style.setProperty('--cell-bg', pastelColors.cellBg);
    document.documentElement.style.setProperty('--cell-hover-bg', pastelColors.cellHoverBg);
    document.documentElement.style.setProperty('--winning-bg', pastelColors.winningBg);
    document.documentElement.style.setProperty('--draw-bg', pastelColors.drawBg);
}

// Função para gerar cores pastel aleatórias
function generatePastelColors() {
    function getPastelColor() {
        const hue = Math.floor(Math.random() * 360);
        const pastel = `hsl(${hue}, 100%, 85%)`;
        return pastel;
    }

    return {
        bgColor: getPastelColor(),
        textColor: getPastelColor(),
        cardBg: getPastelColor(),
        cardBorder: getPastelColor(),
        cellBg: getPastelColor(),
        cellHoverBg: getPastelColor(),
        winningBg: getPastelColor(),
        drawBg: getPastelColor()
    };
}

// Função para alternar entre versões moderna e legado
function toggleVersion() {
    if (currentVersion === 'modern') {
        document.body.classList.add('legacy-theme');
        currentVersion = 'legacy';
        toggleVersionButton.innerHTML = '<i class="fas fa-lightbulb"></i>'; // Ícone para Versão Moderna
        toggleVersionButton.title = 'Versão Moderna';
    } else {
        document.body.classList.remove('legacy-theme');
        currentVersion = 'modern';
        toggleVersionButton.innerHTML = '<i class="fas fa-map"></i>'; // Ícone para Versão Legado
        toggleVersionButton.title = 'Versão Legado';
    }
}

// Função da IA
function aiMove() {
    let move;
    if (aiDifficulty === 'easy') {
        move = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        move = getMediumMove();
    } else if (aiDifficulty === 'hard') {
        move = getBestMove(board, O_CLASS).index;
    }
    if (move !== undefined && board[move] === null) {
        const cell = cells[move];
        const currentClass = O_CLASS;
        placeMark(cell, currentClass, move);
        addToHistory(currentClass, move);
        if (checkWin(currentClass)) {
            endGame(false, currentClass);
        } else if (isDraw()) {
            endGame(true);
        } else {
            swapTurns();
        }
    }
}

// Função para obter um movimento aleatório (Fácil)
function getRandomMove() {
    const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (available.length === 0) return;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
}

// Função para obter um movimento com heurísticas (Médio)
function getMediumMove() {
    // 1. Se pode vencer, vence
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = O_CLASS;
            if (checkWin(O_CLASS)) {
                board[i] = null;
                return i;
            }
            board[i] = null;
        }
    }
    // 2. Se o jogador pode vencer, bloqueia
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = X_CLASS;
            if (checkWin(X_CLASS)) {
                board[i] = null;
                return i;
            }
            board[i] = null;
        }
    }
    // 3. Escolhe o centro
    if (board[4] === null) return 4;
    // 4. Escolhe um canto
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(idx => board[idx] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    // 5. Escolhe qualquer movimento
    return getRandomMove();
}

// Função para obter o melhor movimento usando Minimax (Difícil)
function getBestMove(newBoard, player) {
    const availSpots = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

    // Verifica se o jogador venceu
    if (checkWinner(newBoard, X_CLASS)) {
        return { score: -10 };
    } else if (checkWinner(newBoard, O_CLASS)) {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === O_CLASS) {
            const result = getBestMove(newBoard, X_CLASS);
            move.score = result.score;
        } else {
            const result = getBestMove(newBoard, O_CLASS);
            move.score = result.score;
        }

        newBoard[availSpots[i]] = null;
        moves.push(move);
    }

    let bestMove;
    if (player === O_CLASS) {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    }

    return bestMove;
}

// Função auxiliar para verificar o vencedor no Minimax
function checkWinner(boardState, player) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => boardState[index] === player);
    });
}
