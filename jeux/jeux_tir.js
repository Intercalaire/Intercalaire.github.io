window.onload = function() {
    connectToServer();
};

function connectToServer() {
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.onopen = function() {
        const roomCode = 'default-room'; // Utiliser une salle par défaut
        socket.send(JSON.stringify({ type: 'create', room: roomCode }));
    };

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.type === 'created' || message.type === 'joined') {
            setupGame(socket);
        } else if (message.type === 'error') {
            alert(message.message);
        } else if (message.type === 'add') {
            players[message.id] = { x: 0, y: 0 }; // Ajouter un nouveau joueur
        } else if (message.type === 'remove') {
            delete players[message.id]; // Supprimer un joueur
        }
    };
}

function setupGame(socket) {
    const canvas = document.getElementById('game-canvas');
    const context = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    let score = 0;
    let startTime = null;
    const monsters = [];
    const players = {}; // Stocker les positions des autres joueurs
    let gameRunning = false;

    function spawnMonster() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const dx = (Math.random() - 0.5) * 2; // Vitesse aléatoire en x
        const dy = (Math.random() - 0.5) * 2; // Vitesse aléatoire en y
        monsters.push({ x, y, dx, dy });
    }

    function moveMonsters() {
        monsters.forEach(monster => {
            monster.x += monster.dx;
            monster.y += monster.dy;

            // Si le monstre sort du canvas, le repositionner à l'intérieur
            if (monster.x < 0 || monster.x > canvas.width) {
                monster.dx = -monster.dx;
            }
            if (monster.y < 0 || monster.y > canvas.height) {
                monster.dy = -monster.dy;
            }
        });
    }

    function drawMonsters() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        monsters.forEach(monster => {
            context.fillStyle = 'red';
            context.fillRect(monster.x, monster.y, 20, 20);
        });
    }

    function drawPlayers() {
        context.fillStyle = 'blue';
        for (const id in players) {
            const player = players[id];
            context.fillRect(player.x, player.y, 10, 10);
        }
    }

    function checkCollision(playerX, playerY) {
        for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            if (playerX >= monster.x && playerX <= monster.x + 20 && playerY >= monster.y && playerY <= monster.y + 20) {
                return true;
            }
        }
        return false;
    }

    function resetGame() {
        score = 0;
        startTime = null;
        monsters.length = 0;
        gameRunning = false;
        alert('Vous avez touché un monstre! Le jeu recommence.');
    }

    canvas.addEventListener('mousemove', function(event) {
        if (!gameRunning) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        socket.send(JSON.stringify({ type: 'move', x, y }));

        if (checkCollision(x, y)) {
            resetGame();
        }
    });

    canvas.addEventListener('mouseenter', function() {
        if (!gameRunning) {
            gameRunning = true;
            startTime = Date.now();
            gameLoop();
        }
    });

    canvas.addEventListener('mouseleave', function() {
        gameRunning = false;
    });

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.type === 'update') {
            players[message.id] = { x: message.x, y: message.y };
        } else if (message.type === 'remove') {
            delete players[message.id];
        }
    };

    function gameLoop() {
        if (!gameRunning) return;
        moveMonsters();
        drawMonsters();
        drawPlayers();

        // Calculer le score basé sur le temps de survie
        if (startTime) {
            score = Math.floor((Date.now() - startTime) / 1000);
        }

        context.fillStyle = 'black';
        context.fillText(`Score: ${score} secondes`, 10, 20);

        // Ajouter plus de monstres au fil du temps
        if (score % 5 === 0 && monsters.length < score / 5) {
            spawnMonster();
        }

        requestAnimationFrame(gameLoop);
    }

    setInterval(spawnMonster, 1000);
}