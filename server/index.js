const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const palabrasDB = require('./palabras.json');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://impostor-azure.vercel.app"],
        methods: ["GET", "POST"]
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, 
    },
});

const salas = {};      
const configSalas = {}; 
const roomTimers = {};   // Temporizadores para borrar SALAS vacías
const playerTimers = {}; // <--- NUEVO: Temporizadores para borrar JUGADORES desconectados

io.on('connection', (socket) => {
    
    socket.on('join_room', ({ roomId, nombre, userId }) => {
        
        // 1. SI LA SALA ESTABA POR BORRARSE, LA SALVAMOS
        if (roomTimers[roomId]) {
            clearTimeout(roomTimers[roomId]);
            delete roomTimers[roomId];
        }

        // 2. SI EL JUGADOR ERA UN FANTASMA, LO REVIVIMOS
        if (playerTimers[userId]) { // <--- FANTASMA
            clearTimeout(playerTimers[userId]);
            delete playerTimers[userId];
            console.log(`Jugador ${userId} reconectado a tiempo.`);
        }

        if (!salas[roomId]) {
            salas[roomId] = [];
            configSalas[roomId] = { maxPlayers: 10, category: "Futbolistas", adminId: userId }; 
        }

        // Lógica de recuperación o ingreso
        const usuarioExistente = salas[roomId].find(u => u.userId === userId);

        if (!usuarioExistente) {
            // Si es NUEVO, revisamos cupo
            const limite = configSalas[roomId].maxPlayers;
            if (salas[roomId].length >= limite) {
                socket.emit('error_sala', '⛔ ¡Misión abortada! La nave está llena.');
                return; 
            }
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        if (usuarioExistente) {
            // <--- FANTASMA: VOLVIÓ
            usuarioExistente.id = socket.id; // Actualizamos socket
            usuarioExistente.nombre = nombre;
            usuarioExistente.isOnline = true; // <--- Lo marcamos ONLINE de nuevo
        } else {
            // NUEVO JUGADOR
            salas[roomId].push({ 
                id: socket.id, 
                userId, 
                nombre, 
                isReady: false,
                isOnline: true // <--- Nuevo estado por defecto
            });
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

    socket.on('change_max_players', (nuevoMax) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            if (nuevoMax >= 1 && nuevoMax <= 15) { 
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

    // EVENTO: SALIR VOLUNTARIAMENTE (Sin fantasma)
    socket.on('salir_sala', () => {
        const roomId = socket.roomId;
        const userId = socket.userId;
        
        // Si sale queriendo, borramos su timer de fantasma si existiera
        if (playerTimers[userId]) {
            clearTimeout(playerTimers[userId]);
            delete playerTimers[userId];
        }

        if (roomId && salas[roomId]) {
            const index = salas[roomId].findIndex(u => u.userId === userId);
            if (index !== -1) {
                salas[roomId].splice(index, 1);

                asignarNuevoAdmin(roomId, userId);
                io.to(roomId).emit('update_players', salas[roomId]);
            }
            // Chequeo de sala vacía
            checkSalaVacia(roomId);
            
            socket.leave(roomId);
            socket.roomId = null;
        }
    });

    // EVENTO: DESCONEXIÓN (Activa el Fantasma)
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        const userId = socket.userId;

        if (roomId && salas[roomId]) {
            const user = salas[roomId].find(u => u.userId === userId);
            
            if (user) {
                // 1. MARCAR COMO OFFLINE (Gris en el frontend)
                user.isOnline = false; 
                user.isReady = false;
                io.to(roomId).emit('update_players', salas[roomId]);

                console.log(`Usuario ${userId} desconectado. Esperando 60s...`);

                // 2. ACTIVAR BOMBA DE TIEMPO (60 segundos)
                playerTimers[userId] = setTimeout(() => {
                    if (salas[roomId]) {
                        // Si pasó el tiempo y sigue offline, lo borramos
                        const index = salas[roomId].findIndex(u => u.userId === userId);
                        if (index !== -1) {
                            salas[roomId].splice(index, 1);
                            console.log(`Usuario ${userId} eliminado por inactividad.`);
                            asignarNuevoAdmin(roomId, userId);
                            io.to(roomId).emit('update_players', salas[roomId]);
                        }
                        // Revisamos si al borrarlo la sala quedó vacía
                        checkSalaVacia(roomId);
                    }
                    delete playerTimers[userId];
                }, 60000); 
            }
        }
    });

    socket.on('start_game', () => {
        const roomId = socket.roomId;
        // validar que exista la sala y que pide el admin
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId){

            const jugadores = salas[roomId];
            const config = configSalas[roomId];

            // elegir la palabra segun la categoria
            const palabrasDisponibles = palabrasDB[config.category] || ["Palabra Generica"];
            const palabraSecreta = palabrasDisponibles[Math.floor(Math.random() * palabrasDisponibles.length)];

            // elegir al impostor
            const impostorIndex = Math.floor(Math.random() * jugadores.length);

            // Repartir roles (mensajes privados)
            jugadores.forEach((jugador, index) => {
                const esImpostor = index === impostorIndex;

                // enviar a cada socket su rol
                io.to(jugador.id).emit('game_started', {
                    role: esImpostor ? 'impostor' : 'tripulante',
                    word: esImpostor ? null : palabraSecreta
                });
            });
            console.log('Partida inciada en sala ${roomId}. Palabra: ${palabraSecreta}');
        }
    });
});

// Función auxiliar para borrar sala con espera
function checkSalaVacia(roomId) {
    if (salas[roomId] && salas[roomId].length === 0) {
        // Solo borramos la sala si REALMENTE no hay nadie (ni conectados ni fantasmas en el array)
        // Nota: Como los fantasmas siguen en el array 'salas', la sala no se borra hasta que el último fantasma muere.
        console.log(`Sala ${roomId} totalmente vacía. Borrando en 30s...`);
        roomTimers[roomId] = setTimeout(() => {
            if (salas[roomId] && salas[roomId].length === 0) {
                delete salas[roomId];
                delete configSalas[roomId];
                delete roomTimers[roomId];
                console.log(`Sala ${roomId} eliminada definitivamente.`);
            }
        }, 30000);
    }
}

function asignarNuevoAdmin(roomId, idJugadorSaliente){
    // verifico que la sala y su config existan
    if(salas[roomId] && configSalas[roomId] && salas[roomId].length > 0){
        // si el que se fue era admin
        if(configSalas[roomId].adminId === idJugadorSaliente){
            // asigno el nuevo admin al primer jugador de la sala
            const nuevoAdmin = salas[roomId][0];

            if(nuevoAdmin){
                configSalas[roomId].adminId = nuevoAdmin.userId;
                console.log(`Nuevo admin en sala ${roomId}: ${nuevoAdmin.nombre}`);

                io.to(roomId).emit('update_config', configSalas[roomId]);
            }
        }
    }
}

server.listen(3001, () => {
    console.log('SERVIDOR CORRIENDO EN PUERTO 3001');
});