const io = require('socket.io-client');
const URL = 'http://10.100.2.41:4000';
const socket = io(URL);

socket.on('connect', () => {
    console.log('Connected to server');

    socket.emit('signin', {
        user_name: 'FREDY_VELASQUEZ',
        tournament_id: 142857,
        user_role: 'player'
    });
});

socket.on('ok_signin', () => {
    console.log('Login');
});

function generateMove(board, playerTurnID) {
    const maxDepth = 6;
    const alpha = -Infinity;
    const beta = Infinity;
    const boardCopy = [...board.map((row) => [...row])];
    const columnIndex = minimax(boardCopy, maxDepth, alpha, beta, true, playerTurnID).columnIndex;
    return columnIndex;
}

function evaluateBoard(board, playerTurnID) {
    const opponentID = playerTurnID === 1 ? 2 : 1;
    let score = 0;

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]];
            score += evaluateWindow(window, playerTurnID, opponentID);
        }
    }

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 7; col++) {
            const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]];
            score += evaluateWindow(window, playerTurnID, opponentID);
        }
    }

    for (let row = 3; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            const window = [board[row][col], board[row - 1][col + 1], board[row - 2][col + 2], board[row - 3][col + 3]];
            score += evaluateWindow(window, playerTurnID, opponentID);
        }
    }

    for (let row = 3; row < 6; row++) {
        for (let col = 3; col < 7; col++) {
            const window = [board[row][col], board[row - 1][col - 1], board[row - 2][col - 2], board[row - 3][col - 3]];
            score += evaluateWindow(window, playerTurnID, opponentID);
        }
    }

    return score;
}

function evaluateWindow(window, playerTurnID, opponentID) {
    let score = 0;

    if (window.filter((cell) => cell === playerTurnID).length === 4) {
        score += 100;
    } else if (window.filter((cell) => cell === playerTurnID).length === 3 && window.filter((cell) => cell === 0).length === 1) {
        score += 5;
    } else if (window.filter((cell) => cell === playerTurnID).length === 2 && window.filter((cell) => cell === 0).length === 2) {
        score += 2;
    }

    if (window.filter((cell) => cell === opponentID).length === 3 && window.filter((cell) => cell === 0).length === 1) {
        score -= 4;
    }

    return score;
}

function minimax(board, depth, alpha, beta, maximizingPlayer, playerTurnID) {
    const availableMoves = getAvailableMoves(board);
    let bestMove = null;

    if (depth === 0 || availableMoves.length === 0) {
        const score = evaluateBoard(board, playerTurnID);
        return { score };
    }

    if (maximizingPlayer) {
        let maxScore = -Infinity;

        for (let move of availableMoves) {
            const newBoard = makeMove(board, move, playerTurnID);
            const result = minimax(newBoard, depth - 1, alpha, beta, false, playerTurnID);
            const score = result.score;

            if (score > maxScore) {
                maxScore = score;
                bestMove = move;
            }

            alpha = Math.max(alpha, maxScore);

            if (alpha >= beta) {
                break;
            }
        }

        return { score: maxScore, columnIndex: bestMove };
    } else {
        let minScore = Infinity;

        for (let move of availableMoves) {
            const newBoard = makeMove(board, move, playerTurnID === 1 ? 2 : 1);
            const result = minimax(newBoard, depth - 1, alpha, beta, true, playerTurnID);
            const score = result.score;

            if (score < minScore) {
                minScore = score;
                bestMove = move;
            }

            beta = Math.min(beta, minScore);

            if (alpha >= beta) {
                break;
            }
        }

        return { score: minScore, columnIndex: bestMove };
    }
}

function getAvailableMoves(board) {
    const availableMoves = [];

    for (let col = 0; col < 7; col++) {
        if (board[0][col] === 0) {
            availableMoves.push(col);
        }
    }

    return availableMoves;
}

function makeMove(board, columnIndex, playerTurnID) {
    const newBoard = [...board.map((row) => [...row])];

    for (let row = 5; row >= 0; row--) {
        if (newBoard[row][columnIndex] === 0) {
            newBoard[row][columnIndex] = playerTurnID;
            break;
        }
    }

    return newBoard;
}

socket.on('ready', function(data) {
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var board = data.board;

    console.log('Soy el jugador:', playerTurnID);
    console.log('Soy el board:', board);

    const move = generateMove(board, playerTurnID);
    socket.emit('play', {
        tournament_id: 142857,
        player_turn_id: playerTurnID,
        game_id: gameID,
        movement: move
    });
});

socket.on('finish', function(data) {
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var winnerTurnID = data.winner_turn_id;
    var board = data.board;

    console.log(board);
    console.log('El jugador ganador es:', winnerTurnID);

    const move = generateMove(board, playerTurnID);

    console.log(winnerTurnID);
    console.log(board);
    socket.emit('player_ready', {
        tournament_id: 142857,
        player_turn_id: playerTurnID,
        game_id: gameID,
        movement: move
    });
});
