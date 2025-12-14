// client/src/App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { use, useState } from 'react';
import './App.css'; // Puedes limpiar este archivo css si quieres luego
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sala/:roomId" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  );
}

// COMPONENTE 1: PANTALLA DE INICIO
function Home() {
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");
  const navigate = useNavigate();

  const crearSala = () => {
    // Generamos un ID aleatorio simple (ej: "x7z9")
    const id = Math.random().toString(36).substring(7);
    navigate(`/sala/${id}?nombre=${nombre}`);
  };

  const unirseSala = () => {
    navigate(`/sala/${salaId}?nombre=${nombre}`);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🕵️ El Impostor</h1>
      <input 
        placeholder="Tu Nombre" 
        onChange={(e) => setNombre(e.target.value)} 
      />
      <br /><br />
      <button onClick={crearSala}>Crear Nueva Sala</button>
      <br /><br />
      <p>--- O ---</p>
      <input 
        placeholder="ID de Sala" 
        onChange={(e) => setSalaId(e.target.value)} 
      />
      <button onClick={unirseSala}>Unirse</button>
    </div>
  );
}

// COMPONENTE 2: EL LOBBY (Haremos la lógica en el Paso 3)
function Lobby() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const nombre = searchParams.get("nombre");
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    // 1. Al cargar el componente, le decimos al server hola entre
    socket.emit("join_room", { roomId, nombre });

    // 2. Escuchamos cuando el servidor nos devuelve la lista actualizada
    socket.on("update_players", (listaServidor) => {
      setJugadores(listaServidor);
    });

    // Limpieza al salir del componente
    return () => {
      socket.off("update_players");
    };
  }, [roomId, nombre]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Sala ID: {roomId}</h2>
      <h3>Jugadores en linea:</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        {jugadores.map((jugador) => (
          <div key={jugador.id} style={{ border: '1px solid white', padding: '20px' }}>
            User: {jugador.nombre}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;