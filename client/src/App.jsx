// client/src/App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { use, useState } from 'react';
import './App.css'; // Puedes limpiar este archivo css si quieres luego

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(BACKEND_URL);

// Generador de ID persistente
const getUserId = () => {
  let id = localStorage.getItem("userId");
  if (!id) {
    // Generamos uno aleatorio y lo guardamos
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("userId", id);
  }
  return id;
};

function App() {
  //Estado para controlar dark mode
  const [darkMode, setDarkMode] = useState(true);
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
    if(nombre === "") {
      alert("Por favor ingresa tu nombre.");
      return;
    }
    // Generamos un ID aleatorio simple (ej: "x7z9")
    const id = Math.random().toString(36).substring(7);
    navigate(`/sala/${id}?nombre=${nombre}`);
  };

  const unirseSala = () => {
    if(nombre === "" || salaId === "") {
      alert("Por favor ingresa tu nombre y el ID de la sala.");
      return;
    }
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
        placeholder:font-italic h-14 w-72 tranistion-transform duration-300 dark:text-slate-300"
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
         tranistion-transform duration-300 dark:text-slate-300"
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
// --- PANTALLA DE LOBBY ---
// Definimos las categorías fuera del componente para que sea fácil editar
const CATEGORIAS = [
  "Futbolistas",
  "Equipos de Fútbol",
  "Cantantes",
  "Famosos",
  "Películas",
  "Animales",
  "Países",
  "Marcas de Autos",
  "Comida",
  "Objetos de la Casa"
];

function Lobby() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const nombre = searchParams.get("nombre");
  
  const [jugadores, setJugadores] = useState([]);
  const [config, setConfig] = useState({ maxPlayers: 10, category: "Futbolistas", adminId: null }); // Agregué adminId inicial
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Obtenemos el ID (Asegúrate de que la función getUserId esté definida FUERA del componente)
  const myUserId = getUserId();

  useEffect(() => {
    if (!nombre || !roomId) return;

    // 2. CORRECCIÓN AQUÍ: La propiedad debe llamarse "userId" para que el servidor la lea
    socket.emit("join_room", { 
        roomId, 
        nombre, 
        userId: myUserId // <--- CAMBIO IMPORTANTE (Clave: Valor)
    });

    socket.on("update_players", (lista) => setJugadores(lista));
    socket.on("update_config", (cfg) => setConfig(cfg));
    socket.on("error_sala", (msg) => {
        setErrorMsg(msg);
        alert(msg);
    });

    return () => {
      socket.off("update_players");
      socket.off("update_config");
      socket.off("error_sala");
    };
  }, [roomId, nombre]);

  // 3. ACTUALIZAR LÓGICA DE ADMIN
  // Ya no miramos si eres el [0], miramos si tu ID coincide con el del dueño
  const soyAdmin = config.adminId === myUserId; 

  // ... resto del código (estoyListo, puedenIniciar, return, etc.)


  const miUsuario = jugadores.find(p => p.id === myUserId);
  const estoyListo = miUsuario?.isReady || false;
  const puedenIniciar = jugadores.length >= 2 && jugadores.every(p => p.isReady);

  const cambiarMaxJugadores = (e) => {
      const nuevoMax = parseInt(e.target.value);
      socket.emit("change_max_players", nuevoMax);
  };

  // NUEVA FUNCIÓN PARA CAMBIAR CATEGORÍA
  const cambiarCategoria = (e) => {
      socket.emit("change_category", e.target.value);
  };

  const toggleListo = () => socket.emit("player_ready");
  
  const iniciarJuego = () => {
      if(soyAdmin && puedenIniciar) {
          alert(`¡JUEGO INICIADO!\nCategoría: ${config.category}\nJugadores: ${config.maxPlayers}`);
          // socket.emit('start_game')
      }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(roomId);
    alert("Código copiado");
  };

  if (errorMsg) return <div className="flex items-center justify-center h-screen text-2xl text-red-500 font-game">{errorMsg}</div>;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-6xl p-4 mx-auto md:p-6">
      
      {/* CABECERA */}
      <div className="flex flex-col items-center w-full gap-4 mt-4 animate-fade-in-down">
        <div onClick={copiarCodigo} className="relative flex flex-col items-center px-12 py-4 transition-all border-2 cursor-pointer group bg-black/40 backdrop-blur-md border-game-accent rounded-xl hover:bg-game-accent/10">
          <span className="mb-1 text-xs font-bold tracking-widest uppercase text-slate-400">Código de Misión</span>
          <p className="text-3xl md:text-5xl font-game text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {roomId}
          </p>
        </div>
      </div>

      {/* ZONA CENTRAL */}
      <div className="flex flex-col flex-1 w-full gap-6 mt-8 overflow-hidden lg:flex-row">
        
        {/* LISTA DE JUGADORES (Izquierda) */}
        <div className="flex flex-col flex-1 p-6 border bg-slate-900/60 backdrop-blur-sm rounded-2xl border-slate-700">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-700">
            <h3 className="text-xl text-slate-300 font-game">TRIPULACIÓN</h3>
            <span className={`px-3 py-1 rounded font-bold text-sm ${jugadores.length === config.maxPlayers ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-300'}`}>
              {jugadores.length} / {config.maxPlayers}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pr-2 overflow-y-auto sm:grid-cols-3 custom-scrollbar">
            {jugadores.map((jugador, index) => (
              <div 
                key={index} 
                className={`relative flex flex-col items-center p-3 rounded-lg border transition-all duration-300
                    ${jugador.isReady 
                        ? 'bg-green-900/40 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                        : 'bg-slate-800/80 border-slate-600'}
                `}
              >
                {config.adminId === jugador.userId && <span className="absolute text-xs text-yellow-400 top-1 right-2">👑</span>}
                <div className={`absolute top-1 left-2 text-[10px] font-bold ${jugador.isReady ? 'text-green-400' : 'text-slate-500'}`}>
                    {jugador.isReady ? 'LISTO' : 'ESPERANDO'}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg mb-2 border-2 
                    ${jugador.isReady ? 'border-green-400 bg-green-600' : 'border-slate-400 bg-slate-600'}`}>
                  {jugador.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="w-full text-sm font-bold text-center truncate text-slate-200">
                  {jugador.nombre} {jugador.id === socket.id ? '(Tú)' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CONFIGURACIÓN (Derecha) */}
        <div className="flex flex-col justify-between flex-1 p-6 border bg-slate-900/60 backdrop-blur-sm rounded-2xl border-slate-700">
           <div>
               <h3 className="pb-4 mb-6 text-xl text-white border-b font-game border-slate-700">CONFIGURACIÓN</h3>
               
               {/* 1. SELECTOR DE CATEGORÍA (NUEVO) */}
               <div className="mb-4">
                   <label className="block mb-2 text-sm font-bold tracking-wide uppercase text-slate-300">
                       Temática de la Misión
                   </label>
                   <div className="relative">
                       <select 
                           value={config.category} 
                           onChange={cambiarCategoria}
                           disabled={!soyAdmin} // Solo Admin puede cambiar
                           className={`w-full p-4 rounded-xl border-2 appearance-none font-bold uppercase tracking-wider focus:outline-none transition-colors
                               ${soyAdmin 
                                   ? 'bg-slate-800 border-game-accent text-slate-300 cursor-pointer hover:bg-slate-700' 
                                   : 'bg-slate-800/50 border-slate-600 text-slate-400 cursor-not-allowed'}
                           `}
                       >
                           {CATEGORIAS.map(cat => (
                               <option key={cat} value={cat}>{cat}</option>
                           ))}
                       </select>
                       {/* Flechita decorativa */}
                       <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-300">
                           <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                       </div>
                   </div>
                   {!soyAdmin && <p className="mt-1 text-xs text-right text-slate-500">Solo el líder puede cambiar esto</p>}
               </div>

               {/* 2. SELECTOR DE JUGADORES */}
               <div className="mb-6">
                   <label className="block mb-2 text-sm font-bold uppercase text-slate-400">Límite de Jugadores</label>
                   <select 
                       value={config.maxPlayers} 
                       onChange={cambiarMaxJugadores}
                       disabled={!soyAdmin}
                       className={`w-full bg-slate-800 border p-3 rounded-lg focus:outline-none 
                           ${soyAdmin ? 'border-slate-500 text-white' : 'border-slate-700 text-slate-500 cursor-not-allowed'}
                       `}
                   >
                       {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                           <option key={num} value={num}>{num} Jugadores</option>
                       ))}
                   </select>
               </div>
           </div>

           {/* CONTROLES */}
           <div className="flex flex-col gap-3">
               <button 
                  onClick={toggleListo}
                  className={`w-full font-bold py-4 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest
                    ${estoyListo 
                        ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-800 text-white' 
                        : 'bg-slate-600 hover:bg-slate-500 border-slate-800 text-slate-200'
                    }`}
               >
                   {estoyListo ? "⚠️ CANCELAR (NO ESTOY LISTO)" : "✅ MARCAR COMO LISTO"}
               </button>

               {soyAdmin && (
                   <button 
                     onClick={iniciarJuego}
                     disabled={!puedenIniciar}
                     className="w-full py-4 text-xl text-white uppercase transition-all bg-red-600 border-b-8 border-red-900 shadow-lg hover:bg-red-500 font-game rounded-xl active:border-b-0 active:translate-y-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                   >
                     {puedenIniciar ? "🚀 INICIAR PARTIDA" : "ESPERANDO A TODOS..."}
                   </button>
               )}
               
               {!soyAdmin && (
                   <div className="text-sm text-center text-slate-500 animate-pulse">
                       {puedenIniciar ? "El líder está a punto de iniciar..." : "Esperando que el líder inicie..."}
                   </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default App;