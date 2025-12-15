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
    <div class="bg-gradient-to-r from-purple-600 dark:from-black
    dark:via-purple-950 via-pink-600 dark:to-purple-900 to-red-600 
    bg-[length:200%_200%] animate-gradient h-screen w-full overflow-hidden font-game 
    transition-colors duration-300 flex flex-col items-center">
      <button onClick={toggleDarkMode} class="size-12 rounded-md bg-slate-700 
      dark:bg-slate-300 hover:scale-110 tranistion-transform duration-300 absolute bottom-4 
      right-4">
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
    <div class="flex flex-col items-center justify-center gap-4 h-screen w-full
    overflow-hidden ">
      <h1 class="min-h-16 text-balance md:text-sm text-6xl font-extrabold flex flex-col 
      items-center dark:text-slate-50 text-slate-900 tranistion-transform duration-300">
        <span class="text-6xl leading-none  ">
          EL
        </span>
        <span class="text-6xl leading-none  ">
          IMPOSTOR
        </span>
      </h1>
      <input 
        class="rounded-xl dark:border-slate-300 border-slate-900 dark:bg-slate-900 
        bg-slate-300 border-4 p-2
        text-center text-lg mt-8 dark:placeholder:text-slate-300 placeholder:text-slate-900
        placeholder:font-italic h-14 w-72 tranistion-transform duration-300"
        placeholder="Tu Nombre" 
        onChange={(e) => setNombre(e.target.value)} />
      <div class="flex flex-col p-6 mt-16">
        <button onClick={crearSala} class="dark:border-slate-300 border-slate-900 border-4 
        rounded-xl text-center text-2xl hover:scale-110 tranistion-transform duration-300
      dark:text-slate-300 text-slate-900 h-14 md:mt-6
        dark:bg-slate-900 bg-slate-300 w-full font-bold">CREAR NUEVA SALA</button>
        
      <div class="flex flex-col md:flex-row p-6 gap-4 ">
        <input class="rounded-xl border-4 text-center dark:border-slate-300 border-slate-900
         dark:bg-gray-900 bg-slate-300 h-14 dark:placeholder:text-slate-300 placeholder:text-slate-900
         tranistion-transform duration-300"
        placeholder="ID de Sala" 
        onChange={(e) => setSalaId(e.target.value)} 
        />
        <button class="rounded-xl text-center text-2xl hover:scale-110 tranistion-transform 
        duration-300 border-4 dark:border-gray-300 border-slate-900 
        dark:bg-gray-900 bg-slate-300 h-14 w-60 dark:text-slate-300 text-slate-900
        font-bold" onClick={unirseSala}>UNIRSE</button>
      </div>
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