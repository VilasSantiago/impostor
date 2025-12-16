const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { SocketAddress } = require('net');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://impostor-azure.vercel.app"],
        methods: ["GET", "POST"]
    },
    // Mantén esto para ayudar a la estabilidad
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, 
    },
});

const salas = {};      
const configSalas = {}; 

io.on('connection', (socket) => {
    
    // Recibimos userId en el evento join_room
    socket.on('join_room', ({ roomId, nombre, userId }) => {
        
        // 1. Crear sala si no existe
        if (!salas[roomId]) {
            salas[roomId] = [];
            configSalas[roomId] = { 
                maxPlayers: 10, 
                category: "Futbolistas",
                adminId: userId // <--- EL PRIMERO EN CREARLA ES EL REY PARA SIEMPRE
            }; 
        }

        // 2. Validar límite
        const limite = configSalas[roomId].maxPlayers;
        // Permitimos entrar si la sala está llena PERO es el Admin reconectándose (Excepción VIP)
        const esElAdmin = configSalas[roomId].adminId === userId;
        
        if (salas[roomId].length >= limite && !esElAdmin) {
            // Solo bloqueamos si no es el admin tratando de volver
            // (Nota: Para hacerlo perfecto tendríamos que chequear si ya estaba en la lista, pero esto sirve por ahora)
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId; // Guardamos el userId en el socket para usarlo al desconectar

        // 3. Lógica de Lista de Jugadores
        // Buscamos si este usuario ya estaba en la lista (por si refrescó rápido)
        const indiceExistente = salas[roomId].findIndex(u => u.userId === userId);

        if (indiceExistente !== -1) {
            // SI YA EXISTÍA: Actualizamos su socket.id y nombre, pero MANTENEMOS SU POSICIÓN
            salas[roomId][indiceExistente].id = socket.id;
            salas[roomId][indiceExistente].nombre = nombre; // Por si se cambió el nombre
            salas[roomId][indiceExistente].isReady = false; // Al refrescar se quita el "Listo"
        } else {
            // SI ES NUEVO: Lo agregamos al final
            salas[roomId].push({ id: socket.id, userId, nombre, isReady: false });
        }

        io.to(roomId).emit('update_players', salas[roomId]);
        io.to(roomId).emit('update_config', configSalas[roomId]);
    });

    socket.on('player_ready', () => {
        const roomId = socket.roomId;
        if (roomId && salas[roomId]) {
            const player = salas[roomId].find(p => p.id === socket.id);
            if (player) {
                player.isReady = !player.isReady;
                io.to(roomId).emit('update_players', salas[roomId]);
            }
        }
    });

    // Validamos acciones de Admin usando userId
    socket.on('change_max_players', (nuevoMax) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            if (nuevoMax >= 4 && nuevoMax <= 15) {
                configSalas[roomId].maxPlayers = nuevoMax;
                io.to(roomId).emit('update_config', configSalas[roomId]);
            }
        }
    });

    socket.on('change_category', (nuevaCategoria) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            configSalas[roomId].category = nuevaCategoria;
            io.to(roomId).emit('update_config', configSalas[roomId]);
        }
    });

    socket.on('salir_sala', () => {
        const roomId = socket.roomId;
        const userId = socket.userId;

        if (roomId && salas[roomId]) {
            // Buscamos y borramos el usuario
            const index = salas[roomId].findIndex(u => u.userId === userId);

            if (index !== -1) {
                salas[roomId].splice(index, 1); // Lo borramos de la lista

                //aviso a los que quedan
                io.to(roomId).emit('update_players', salas[roomId]);
            }

            // su no queda nadie, borramos la sala
            if (salas[roomId].lenght === 0) {
                delete salas[roomId];
                delete configSalas[roomId];
            }

            // desconectamos al socket de la sala
            socket.leave(roomId);
            socket.roomId = null;
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && salas[roomId]) {
            // Lo quitamos de la lista visual
            const index = salas[roomId].findIndex(player => player.id === socket.id);
            if (index !== -1) {
                salas[roomId].splice(index, 1);
                io.to(roomId).emit('update_players', salas[roomId]);
            }

            // NOTA IMPORTANTE:
            // NO borramos 'adminId' de configSalas. 
            // Si el admin se fue (refrescó), la sala se queda "sin admin" un segundo,
            // pero cuando vuelva a entrar con su userId, el servidor dirá: "Ah, tú eres el adminId, toma el control".

            if (salas[roomId].length === 0) {
                // Solo si la sala queda vacía de verdad, borramos la config
                delete salas[roomId];
                delete configSalas[roomId];
            }
        }
    });
});

server.listen(3001, () => {
    console.log('SERVIDOR CORRIENDO EN PUERTO 3001');
});