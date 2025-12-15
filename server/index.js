const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // Permitimos una lista (array) de orígenes:
        origin: [
            "http://localhost:5173",           // Para cuando trabajes en tu PC
            "https://impostor-azure.vercel.app" // Tu URL real de Vercel
        ],
        methods: ["GET", "POST"]
    },
    connectionStateRecovery: {
        // Ayuda a recuperar el estado si se cae el wifi brevemente
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    },
    pingTimeout: 60000, // 1 minuto antes de dar por muerto al cliente
    pingInterval: 25000, // Cada 25 segundos, enviar un ping al cliente
});

const salas = {};      // Jugadores: { roomId: [ {id, nombre, isReady, ...} ] }
const configSalas = {}; // Configuración: { roomId: { maxPlayers: 10 } }

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    socket.on('join_room', ({ roomId, nombre }) => {
        if (!salas[roomId]) {
            salas[roomId] = [];
            // AHORA GUARDAMOS TAMBIÉN LA CATEGORÍA
            configSalas[roomId] = { 
                maxPlayers: 10, 
                category: "Futbolistas" // <--- Valor por defecto
            }; 
        }

        // ... (verificación de limite igual que antes) ...

        socket.join(roomId);
        socket.roomId = roomId;

        const yaExiste = salas[roomId].find(u => u.id === socket.id);
        if (!yaExiste) {
            salas[roomId].push({ id: socket.id, nombre, isReady: false });
        }

        io.to(roomId).emit('update_players', salas[roomId]);
        io.to(roomId).emit('update_config', configSalas[roomId]);
    });

    // --- NUEVO: MARCAR COMO LISTO ---
    socket.on('player_ready', () => {
        const roomId = socket.roomId;
        if (roomId && salas[roomId]) {
            const player = salas[roomId].find(p => p.id === socket.id);
            if (player) {
                player.isReady = !player.isReady; // Alternar estado (true/false)
                io.to(roomId).emit('update_players', salas[roomId]);
            }
        }
    });

    // --- NUEVO: CAMBIAR CONFIGURACIÓN (Solo Admin) ---
    socket.on('change_max_players', (nuevoMax) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId]) {
            // Validación simple: Mínimo 4, Máximo 15
            if (nuevoMax >= 4 && nuevoMax <= 15) {
                configSalas[roomId].maxPlayers = nuevoMax;
                io.to(roomId).emit('update_config', configSalas[roomId]);
            }
        }
    });

    // --- NUEVO EVENTO: CAMBIAR CATEGORÍA ---
    socket.on('change_category', (nuevaCategoria) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId]) {
            configSalas[roomId].category = nuevaCategoria;
            io.to(roomId).emit('update_config', configSalas[roomId]);
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && salas[roomId]) {
            const index = salas[roomId].findIndex(player => player.id === socket.id);
            if (index !== -1) {
                salas[roomId].splice(index, 1);
                io.to(roomId).emit('update_players', salas[roomId]);
            }
            if (salas[roomId].length === 0) {
                delete salas[roomId];
                delete configSalas[roomId];
            }
        }
    });
});

server.listen(3001, () => {
    console.log('SERVIDOR CORRIENDO EN PUERTO 3001');
});