const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://impostor-azure.vercel.app"],
        methods: ["GET", "POST"]
    }
});

// Memoria temporal
const salas = {}; 

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    socket.on('join_room', ({ roomId, nombre }) => {
        // 1. Unirse al canal de socket
        socket.join(roomId);

        // 2. IMPORTANTE: Guardamos el roomId DENTRO del objeto socket del usuario
        // Esto es como ponerle una etiqueta en la frente al usuario
        socket.roomId = roomId; // <--- ESTA ES LA CLAVE
        
        // 3. Lógica de salas
        if (!salas[roomId]) salas[roomId] = [];
        
        const yaExiste = salas[roomId].find(u => u.id === socket.id);
        if (!yaExiste) {
            salas[roomId].push({ id: socket.id, nombre, rol: null });
        }

        io.to(roomId).emit('update_players', salas[roomId]);
        console.log(`Usuario ${nombre} entró a la sala ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);

        // 4. RECUPERAMOS LA ETIQUETA
        // Ahora sí sabemos de qué sala era sin tener que adivinar
        const roomId = socket.roomId; // <--- AQUÍ LEEMOS LA ETIQUETA

        // Si el usuario tenía sala (a veces se conectan y desconectan sin entrar a sala)
        if (roomId && salas[roomId]) {
            
            // Buscar y borrar al usuario de la lista
            const index = salas[roomId].findIndex(player => player.id === socket.id);
            
            if (index !== -1) {
                salas[roomId].splice(index, 1);
                
                // Avisar a los que quedan
                io.to(roomId).emit('update_players', salas[roomId]);
            }

            // Limpieza de sala vacía
            if (salas[roomId].length === 0) {
                delete salas[roomId];
                console.log(`Sala ${roomId} eliminada por estar vacía`);
            }
        }
    });
});

server.listen(3001, () => {
    console.log('SERVIDOR CORRIENDO EN PUERTO 3001');
});