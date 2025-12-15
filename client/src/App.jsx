// client/src/App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { use, useState } from 'react';
import './App.css'; // Puedes limpiar este archivo css si quieres luego
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(BACKEND_URL);

function App() {
  //Estado para controlar dark mode
  const [darkMode, setDarkMode] = useState(false);
  //Funcion para alternar darkmode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  }
  return (
   <div class={darkMode ? "dark" : ""}>
    <div class="h-screen md:h-screen w-full bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200 font-mono transition-colors duration-300 flex flex-col items-center">
      <button onClick={toggleDarkMode} class="size-12 rounded-md bg-slate-700 dark:bg-slate-300 hover:scale-110 tranistion-transform duration-300 absolute bottom-4 right-4">
        {darkMode ? '🌞' : '🌙'}
      </button>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sala/:roomId" element={<Lobby />} />
        </Routes>
      </BrowserRouter>
    </div>
   </div>
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
    <div class="p-48 flex flex-col items-center justify-center gap-4">
      <h1 class="min-h-16  text-balance md:text-sm text-3xl font-bold font-mono">EL IMPOSTOR</h1>
      <input 
        class="rounded-xl p-2 text-black"
        placeholder="Tu Nombre" 
        onChange={(e) => setNombre(e.target.value)} 
      />
      <div class="w-screen h-[1px] bg-gray-200 "></div>
      <br />

      <div class="flex flex-col md:flex-row p-6 gap-4">
        <button onClick={crearSala} class="dark:bg-indigo-200 dark:text-indigo-900 bg-indigo-900 text-indigo-200 rounded-xl text-center text-lg
        hover:scale-110 tranistion-transform duration-300">Crear Nueva Sala</button>
      <br /><br />
      <input 
        placeholder="ID de Sala" 
        onChange={(e) => setSalaId(e.target.value)} 
      />
      <button class="dark:bg-indigo-200 dark:text-indigo-900 bg-indigo-900 text-indigo-200 rounded-xl text-center text-lg
        hover:scale-110 tranistion-transform duration-300" onClick={unirseSala}>Unirse</button>
      </div>
      
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
    <div class="bg-red-600">
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