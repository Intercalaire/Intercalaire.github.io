const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const rooms = {};

server.on('connection', function(socket) {
    let currentRoom = null;
    let playerId = null;

    socket.on('message', function(message) {
        const data = JSON.parse(message);
        if (data.type === 'join') {
            const room = data.room;
            if (rooms[room]) {
                rooms[room].push(socket);
                socket.send(JSON.stringify({ type: 'joined' }));
            } else {
                socket.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
            }
        } else if (data.type === 'create') {
            const room = data.room;
            if (!rooms[room]) {
                rooms[room] = [socket];
                socket.send(JSON.stringify({ type: 'created' }));
            } else {
                socket.send(JSON.stringify({ type: 'error', message: 'Room already exists' }));
            }
            currentRoom = room;
            playerId = socket._socket.remoteAddress + ':' + socket._socket.remotePort;
            broadcastPlayerUpdate(currentRoom, playerId, 'add');
        } else if (data.type === 'move') {
            if (currentRoom) {
                rooms[currentRoom].forEach(client => {
                    if (client !== socket) {
                        client.send(JSON.stringify({ type: 'update', id: playerId, x: data.x, y: data.y }));
                    }
                });
            }
        }
    });

    socket.on('close', function() {
        if (currentRoom) {
            rooms[currentRoom] = rooms[currentRoom].filter(s => s !== socket);
            broadcastPlayerUpdate(currentRoom, playerId, 'remove');
        }
    });

    function broadcastPlayerUpdate(room, playerId, action) {
        rooms[room].forEach(client => {
            client.send(JSON.stringify({ type: action, id: playerId }));
        });
    }
});