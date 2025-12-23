const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const palabrasDB = require('./palabras.json');

const app = express();
app.use(cors());

const server = http.createServer(app);

/*
Inicializacion del servicio en tiempo real.
cors: url's permitidas.
connectionStateRecovery: permite reconectar en un tiempo determinado.
*/
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", 
                "https://impostor-azure.vercel.app"],
        methods: ["GET", "POST"]
    },
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, 
    },
});

const salas = {};      
const configSalas = {}; 
const roomTimers = {};
const playerTimers = {}; 
const activeGames = {}; 

io.on('connection', (socket) => {
    /*
    Evento: Unirse a una sala.
    Datos: { roomId, nombre, userId }.
    Timers: Comprueba si la sala o el jugador estan a punto de borrarse.
    Creacion: Si la sala no existe, la crea con valores por defecto.
    Identidad: Verifica si el usuario es nuevo o vuelve (reconexion).
    Seguridad: Si es nuevo y la sala esta llena, te bloquea.
    Persistencia: Si entras y la partida ya empezo, busca al usuario en la
    base de datos de las partidas activas y te reenvia tu carta para poder
    seguir jugando.
    */
    socket.on('join_room', ({ roomId, nombre, userId }) => {
        
        if (roomTimers[roomId]) {
            clearTimeout(roomTimers[roomId]);
            delete roomTimers[roomId];
        }

        if (playerTimers[userId]) { 
            clearTimeout(playerTimers[userId]);
            delete playerTimers[userId];
            console.log(`Jugador ${userId} reconectado a tiempo.`);
        }

        if (!salas[roomId]) {
            salas[roomId] = [];
            configSalas[roomId] = { maxPlayers: 10, category: "Futbolistas", adminId: userId }; 
        }

        const usuarioExistente = salas[roomId].find(u => u.userId === userId);

        if (!usuarioExistente) {
            const limite = configSalas[roomId].maxPlayers;
            if (salas[roomId].length >= limite) {
                socket.emit('error_sala', '⛔ ¡Misión abortada! La nave está llena.');
                return; 
            }
            if (configSalas[roomId].status === 'lobby'){
            socket.emit('error_sala', '⛔ La partida ya comenzó. Espera a la siguiente ronda.');
            return;
        }
        }

        

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        if (usuarioExistente) {
            usuarioExistente.id = socket.id; 
            usuarioExistente.nombre = nombre;
            usuarioExistente.isOnline = true; 
        } else {
            salas[roomId].push({ 
                id: socket.id, 
                userId, 
                nombre, 
                isReady: false,
                isOnline: true 
            });
        }

        io.to(roomId).emit('update_players', salas[roomId]);
        io.to(roomId).emit('update_config', configSalas[roomId]);

        if (configSalas[roomId].status === 'playing' && activeGames[roomId]) {
            const juego = activeGames[roomId];
            const esImpostor = juego.impostorId === userId;

            socket.emit('game_started', {
                role: esImpostor ? 'impostor' : 'tripulante',
                word: esImpostor ? null : juego.word
            });
            console.log(`Jugador ${nombre} reconectado a partida en curso en sala ${roomId}.`);
        }
    });

    /*
    Evento: Jugador listo/no listo.
    Cambia el estado del jugador listo/no listo y notifica a todos.
    */
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

    /*
    Evento: Cambiar configuración de la sala.
    Solo el admin puede cambiar la configuración.
    Notifica a todos los jugadores de la sala.
    */
    socket.on('change_max_players', (nuevoMax) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            if (nuevoMax >= 1 && nuevoMax <= 15) { 
                configSalas[roomId].maxPlayers = nuevoMax;
                io.to(roomId).emit('update_config', configSalas[roomId]);
            }
        }
    });

    /*
    Evento: Cambiar categoría de palabras.
    Solo el admin puede cambiar la categoría.
    Notifica a todos los jugadores de la sala.
    */
    socket.on('change_category', (nuevaCategoria) => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            configSalas[roomId].category = nuevaCategoria;
            io.to(roomId).emit('update_config', configSalas[roomId]);
        }
    });

    /*
    Evento: Salir de la sala.
    Elimina inmediatamente al jugador de la lista, asigna un nuevo admin
    si hace falta, y le dice al socket que abandone el canal.
    */
    socket.on('salir_sala', () => {
        const roomId = socket.roomId;
        const userId = socket.userId;
        
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

            checkSalaVacia(roomId);
            
            socket.leave(roomId);
            socket.roomId = null;
        }
    });

    /*
    Evento: Desconexión del socket.
    Marca al jugador como offline y activa un timer de 60s.
    Si el jugador vuelve no vuelve en ese tiempo, se le elimina
    de la sala definitivamente.
    */
    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        const userId = socket.userId;

        if (roomId && salas[roomId]) {
            const user = salas[roomId].find(u => u.userId === userId);
            
            if (user) {
                user.isOnline = false; 
                user.isReady = false;
                io.to(roomId).emit('update_players', salas[roomId]);

                console.log(`Usuario ${userId} desconectado. Esperando 60s...`);

                playerTimers[userId] = setTimeout(() => {
                    if (salas[roomId]) {
                        const index = salas[roomId].findIndex(u => u.userId === userId);
                        if (index !== -1) {
                            salas[roomId].splice(index, 1);
                            console.log(`Usuario ${userId} eliminado por inactividad.`);
                            asignarNuevoAdmin(roomId, userId);
                            io.to(roomId).emit('update_players', salas[roomId]);
                        }
                        checkSalaVacia(roomId);
                    }
                    delete playerTimers[userId];
                }, 5 * 60 * 1000); 
            }
        }
    });

    /*
    Evento: Iniciar partida.
    Solo el admin puede iniciar la partida.
    Se cambia el estado de la sala a 'playing'.
    Se elige una palabra al azar de la categoria seleccionada.
    Elige un impostor al azar.
    Reparte los roles a cada jugador (mensaje privado).
    */
    socket.on('start_game', () => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId){

            const jugadores = salas[roomId];
            const config = configSalas[roomId];

            config.status = 'playing';

            const palabrasDisponibles = palabrasDB[config.category] || ["Palabra Generica"];
            const palabraSecreta = palabrasDisponibles[Math.floor(Math.random() * palabrasDisponibles.length)];

            const impostorIndex = Math.floor(Math.random() * jugadores.length);

            const impostorUserId = jugadores[impostorIndex].userId;
            activeGames[roomId] = {
                word: palabraSecreta,
                impostorId: impostorUserId
            };

            jugadores.forEach((jugador, index) => {
                const esImpostor = index === impostorIndex;

                io.to(jugador.id).emit('game_started', {
                    role: esImpostor ? 'impostor' : 'tripulante',
                    word: esImpostor ? null : palabraSecreta
                });
            });
            console.log('Partida inciada en sala ${roomId}. Palabra: ${palabraSecreta}');
        }
    });

    /*
    Evento: Revelar la verdad.
    Solo el admin puede revelar la verdad.
    El servidor busca quien era el impsotor y envia a todos los jugadores
    el nombre del impostor y la palabra secreta.
    Cambia el estado a 'revealed' para evitar reconexiones raras.
    */
    socket.on('reveal_game', () => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            
            const juego = activeGames[roomId];
            const jugadores = salas[roomId];

            if (juego) {
                const impostorData = jugadores.find(j => j.userId === juego.impostorId);
                const nombreImpostor = impostorData ? impostorData.nombre : "Desconocido";

                io.to(roomId).emit('game_revealed', {
                    impostorName: nombreImpostor,
                    word: juego.word
                });
                
                configSalas[roomId].status = 'revealed';
            }
        }
    });

    /*
    Evento: Siguiente ronda.
    Solo el admin puede iniciar la siguiente ronda.
    Reutiliza la logica de inciar juego, pero se ejecuta en la pantalla
    de los resultados. Genera nuevos roles y palabras, y los reparte
    sin tener que pasar por el lobby.
    */
    socket.on('next_round', () => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId] && configSalas[roomId].adminId === socket.userId) {
            
            const config = configSalas[roomId];
            const jugadores = salas[roomId];
            
            config.status = 'playing';

            const palabrasDisponibles = palabrasDB[config.category] || ["Genérico"];
            const palabraSecreta = palabrasDisponibles[Math.floor(Math.random() * palabrasDisponibles.length)];

            const impostorIndex = Math.floor(Math.random() * jugadores.length);
            const impostorUserId = jugadores[impostorIndex].userId;

            activeGames[roomId] = {
                word: palabraSecreta,
                impostorId: impostorUserId
            };

            jugadores.forEach((jugador, index) => {
                const esImpostor = index === impostorIndex;
                io.to(jugador.id).emit('game_started', {
                    role: esImpostor ? 'impostor' : 'tripulante',
                    word: esImpostor ? null : palabraSecreta
                });
            });

            console.log(`Nueva ronda en ${roomId}. Palabra: ${palabraSecreta}`);
        }
    });

    /*
    Evento: Volver al lobby.
    Solo el admin puede volver al lobby.
    Borra los datos de la partida activa, pone a todos los jugadores en
    "No Listo" y manda la orden al front de quitar la pantalla de juego y
    mostrar la configuracion de nuevo.
    */
    socket.on('return_to_lobby', () => {
        const roomId = socket.roomId;
        if (roomId && configSalas[roomId]) {

            configSalas[roomId].status = 'lobby';

            delete activeGames[roomId];

            if (salas[roomId]) {
                salas[roomId].forEach(p => p.isReady = false);
            }

            io.to(roomId).emit('update_players', salas[roomId]); 
            io.to(roomId).emit('game_reset'); 
            
            console.log(`Sala ${roomId} volvió al lobby.`);
        }
    });

});

// Función auxiliar para borrar sala con espera
function checkSalaVacia(roomId) {
    if (salas[roomId] && salas[roomId].length === 0) {
        // Solo borramos la sala si REALMENTE no hay nadie (ni conectados ni fantasmas en el array)
        // Nota: Como los fantasmas siguen en el array 'salas', la sala no se borra hasta que el último fantasma muere.
        console.log(`Sala ${roomId} totalmente vacía. Borrando en 2min...`);
        roomTimers[roomId] = setTimeout(() => {
            if (salas[roomId] && salas[roomId].length === 0) {
                delete salas[roomId];
                delete configSalas[roomId];
                delete activeGames[roomId];
                delete roomTimers[roomId];
                console.log(`Sala ${roomId} eliminada definitivamente.`);
            }
        }, 2 * 60 * 1000);
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

app.get('/health', (req, res) => {
    res.send('Servidor de Impostor Activo');
});

server.listen(3001, () => {
    console.log('SERVIDOR CORRIENDO EN PUERTO 3001');
});