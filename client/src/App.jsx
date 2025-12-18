// client/src/App.jsx
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';
import Game from './Game';

const BACKEND_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const socket = io(BACKEND_URL);

// Generador de ID persistente
const getUserId = () => {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("userId", id);
  }
  return id;
};

// COMPONENTE PRINCIPAL DE RUTAS
function App() {
  return (
      <BrowserRouter>
        {/* Contenedor global con fondo oscuro para evitar espacios blancos al cargar */}
        <div className="min-h-screen bg-slate-950 text-yellow-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sala/:roomId" element={<Lobby />} />
          </Routes>
        </div>
      </BrowserRouter>
  );
}

// --- PANTALLA DE INICIO (HOME) ---
function Home() {
  const [nombre, setNombre] = useState("");
  const [salaId, setSalaId] = useState("");
  const navigate = useNavigate();

  const crearSala = () => {
    if(!nombre.trim()) return alert("Por favor ingresa tu nombre.");
    const id = Math.random().toString(36).substring(7).toUpperCase();
    navigate(`/sala/${id}?nombre=${nombre}`);
  };

  const unirseSala = () => {
    if(!nombre.trim() || !salaId.trim()) return alert("Faltan datos.");
    navigate(`/sala/${salaId}?nombre=${nombre}`);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 overflow-hidden bg-slate-950">
      
      {/* TÍTULO DORADO CON GRADIENTE */}
      <h1 className="flex flex-col items-center font-extrabold tracking-tighter drop-shadow-2xl">
        <span className="text-4xl text-transparent md:text-6xl bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600">
          EL
        </span>
        <span className="text-6xl md:text-9xl leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]">
          IMPOSTOR
        </span>
      </h1>

      {/* INPUT NOMBRE */}
      <div className="w-full max-w-sm mt-12">
        <label className="block mb-2 text-sm font-bold tracking-widest text-center text-yellow-600">IDENTIFICACIÓN</label>
        <input 
          className="w-full h-14 bg-slate-900 border-2 border-slate-700 rounded-xl text-center text-xl text-yellow-100 placeholder:text-slate-600 focus:outline-none focus:border-yellow-500 focus:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all duration-300 uppercase font-bold"
          placeholder="TU NOMBRE" 
          maxLength={12}
          onChange={(e) => setNombre(e.target.value)} 
        />
      </div>

      {/* BOTONES Y ACCIONES */}
      <div className="flex flex-col w-full max-w-sm gap-6 mt-8">
        
        {/* BOTÓN CREAR */}
        <button 
          onClick={crearSala} 
          className="w-full h-16 text-2xl font-black tracking-widest uppercase transition-all border-b-4 border-yellow-900 shadow-lg rounded-xl bg-gradient-to-r from-yellow-700 to-yellow-500 hover:from-yellow-600 hover:to-yellow-400 text-slate-900 active:border-b-0 active:translate-y-1 hover:shadow-yellow-500/20"
        >
          Crear Sala
        </button>
        
        {/* SEPARADOR */}
        <div className="flex items-center gap-2 opacity-50">
            <div className="flex-1 h-px bg-yellow-800"></div>
            <span className="text-xs text-yellow-700">O ÚNETE A UNA</span>
            <div className="flex-1 h-px bg-yellow-800"></div>
        </div>

        {/* ZONA UNIRSE */}
        <div className="flex gap-2">
          <input 
            className="flex-1 text-lg text-center text-yellow-100 uppercase transition-all border-2 h-14 bg-slate-900 border-slate-700 rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-yellow-500"
            placeholder="CÓDIGO SALA" 
            onChange={(e) => setSalaId(e.target.value.toUpperCase())} 
          />
          <button 
            onClick={unirseSala}
            className="w-32 font-bold text-yellow-500 transition-all border-2 border-yellow-700 h-14 rounded-xl hover:bg-yellow-900/30 hover:text-yellow-300 hover:border-yellow-400 active:scale-95"
          >
            ENTRAR
          </button>
        </div>
      </div>
      
    </div>
  );
}

// --- CONFIGURACIÓN Y LOBBY ---

const CATEGORIAS = [
  "Futbolistas", "Equipos de Fútbol", "Cantantes", "Famosos", 
  "Películas", "Animales", "Países", "Marcas de Autos", "Comida", "Objetos de la Casa"
];

function Lobby() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const nombre = searchParams.get("nombre");
  
  const [jugadores, setJugadores] = useState([]);
  const [config, setConfig] = useState({ maxPlayers: 10, category: "Futbolistas", adminId: null });
  const [gameData, setGameData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const myUserId = getUserId();

  // 1. EFECTO DE "ESCUCHA" (Configura los listeners una sola vez y limpia al salir)
  useEffect(() => {
    // Definimos las funciones manejadoras
    const handleUpdatePlayers = (lista) => setJugadores(lista);
    const handleUpdateConfig = (cfg) => setConfig(cfg);
    const handleErrorSala = (msg) => {
        setErrorMsg(msg);
        alert(msg);
        navigate("/");
    };
    // Nuevo handler para iniciar el juego
    const handleGameStart = (data) => {
        setGameData(data); 
    };
   
    // Activamos los listeners
    socket.on("update_players", handleUpdatePlayers);
    socket.on("update_config", handleUpdateConfig);
    socket.on("error_sala", handleErrorSala);
    socket.on("game_started", handleGameStart); // <--- AGREGADO

    // Limpiamos al salir (Fundamental para no tener duplicados)
    return () => {
      socket.off("update_players", handleUpdatePlayers);
      socket.off("update_config", handleUpdateConfig);
      socket.off("error_sala", handleErrorSala);
      socket.off("game_started", handleGameStart);
    };
  }, [navigate]); // Array de dependencias mínimo

  // 2. EFECTO DE "ACCIÓN" (Solo se ejecuta cuando entras a la sala)
  useEffect(() => {
    if (!nombre || !roomId) return;

    // Solo emitimos, NO ponemos socket.on aquí adentro
    socket.emit("join_room", { 
        roomId, 
        nombre, 
        userId: myUserId 
    });

  }, [roomId, nombre, myUserId]);
    

  const soyAdmin = config.adminId === myUserId; 
  const miUsuario = jugadores.find(p => p.id === socket.id); // OJO: Aquí podrías querer buscar por userId si usaste persistencia total, pero por socket.id funciona para el estado visual inmediato
  const estoyListo = miUsuario?.isReady || false;
  const puedenIniciar = jugadores.length >= 2 && jugadores.every(p => p.isReady);

  const cambiarMaxJugadores = (e) => {
      const nuevoMax = parseInt(e.target.value);
      socket.emit("change_max_players", nuevoMax);
  };

  const cambiarCategoria = (e) => {
      socket.emit("change_category", e.target.value);
  };

  const toggleListo = () => socket.emit("player_ready");
  
  const iniciarJuego = () => {
      if(soyAdmin && puedenIniciar) {
          socket.emit("start_game");
      }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(roomId);
    alert("Código copiado");
  };

  const salirDeSala = () => {
    const confirmar = window.confirm("¿Estás seguro que quieres salir de la sala?");
    if (confirmar) {
      socket.emit("salir_sala");
      navigate("/");
    }
  };

  if (errorMsg) return <div className="flex items-center justify-center h-screen text-2xl font-bold text-red-500 bg-slate-950">{errorMsg}</div>;
  if (gameData) return <Game role={gameData.role} word={gameData.word} />;
  return (
    <div className="relative flex flex-col items-center justify-between w-full h-screen overflow-hidden bg-slate-950 text-yellow-50">
      
      {/* BOTÓN SALIR */}
      <button 
        onClick={salirDeSala}
        className="absolute z-50 flex items-center gap-2 p-2 transition-all top-20 left-2 md:top-16 md:left-24 text-slate-500 hover:text-red-500 group"
      >
        <div className="p-2 transition-colors border rounded-full bg-slate-900 border-slate-700 group-hover:bg-red-900/20 group-hover:border-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </div>
        <span className="hidden text-sm font-bold tracking-wider md:block group-hover:text-red-500">ABANDONAR</span>
      </button>

      {/* CONTENEDOR PRINCIPAL CON PADDING */}
      <div className="flex flex-col items-center w-full h-full max-w-6xl p-4 md:p-6">

        {/* CABECERA (Código) */}
        <div className="flex flex-col items-center w-full gap-4 mt-12 md:mt-4 shrink-0">
            <div onClick={copiarCodigo} className="relative flex flex-col items-center px-12 py-4 transition-all border border-yellow-600/50 cursor-pointer group bg-slate-900/50 backdrop-blur-md rounded-xl hover:bg-yellow-900/20 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <span className="mb-1 text-xs font-bold tracking-widest text-yellow-600 uppercase group-hover:text-yellow-400">Código de Misión</span>
            <p className="text-4xl font-black tracking-widest text-white md:text-5xl drop-shadow-md">
                {roomId}
            </p>
            <span className="absolute -bottom-6 text-[10px] text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity">CLICK PARA COPIAR</span>
            </div>
        </div>

        {/* ZONA CENTRAL */}
        <div className="flex flex-col flex-1 w-full gap-6 pb-4 mt-8 overflow-y-auto lg:overflow-hidden lg:flex-row custom-scrollbar">
            
            {/* LISTA DE JUGADORES */}
            <div className="flex flex-col flex-1 p-6 border bg-slate-900/80 backdrop-blur-sm rounded-2xl border-slate-800 min-h-[300px] shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-700">
                    <h3 className="text-xl font-bold tracking-wider text-yellow-500">TRIPULACIÓN</h3>
                    <span className={`px-3 py-1 rounded font-bold text-sm ${jugadores.length === config.maxPlayers ? 'bg-red-900 text-red-200' : 'bg-slate-800 text-slate-400'}`}>
                    {jugadores.length} / {config.maxPlayers}
                    </span>
                </div>

                <div className="grid content-start h-full grid-cols-2 gap-4 pr-2 overflow-y-auto sm:grid-cols-3 custom-scrollbar">
                    {jugadores.map((jugador, index) => (
                    <div 
                        key={index} 
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 h-fit
                            ${jugador.isReady 
                                ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                                : 'bg-slate-800 border-slate-700'}
                            
                            ${/* <--- FANTASMA: EFECTO VISUAL */
                              !jugador.isOnline ? 'opacity-40 grayscale border-dashed border-slate-600' : 'opacity-100'}
                        `}
                    >
                        {/* Corona */}
                        {config.adminId === jugador.userId && <span className="absolute text-sm top-1 right-2">👑</span>}
                        
                        {/* Estado Texto */}
                        <div className={`absolute top-2 left-2 text-[9px] font-black tracking-widest ${jugador.isReady ? 'text-green-400' : 'text-slate-500'}`}>
                            {/* Si no está online mostramos "OFFLINE" */}
                            {!jugador.isOnline ? 'OFFLINE' : (jugador.isReady ? 'LISTO' : 'ESPERANDO')}
                        </div>

                        {/* Avatar */}
                        <div className={`w-14 h-14 shrink-0 aspect-square rounded-full flex items-center justify-center text-2xl font-black text-slate-900 shadow-lg mb-2 border-4 mt-2
                            ${jugador.isReady 
                                ? 'border-green-500 bg-green-400' 
                                : 'border-slate-600 bg-slate-400'
                            }`}>
                        {jugador.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className={`w-full text-sm font-bold text-center truncate ${jugador.isReady ? 'text-green-100' : 'text-slate-400'}`}>
                        {jugador.nombre} {jugador.id === socket.id ? '(Tú)' : ''}
                        </span>
                    </div>
                    ))}
                </div>
            </div>

            {/* CONFIGURACIÓN */}
            <div className="flex flex-col justify-between flex-1 p-6 border shadow-2xl bg-slate-900/80 backdrop-blur-sm rounded-2xl border-slate-800 shrink-0">
                <div>
                    <h3 className="pb-4 mb-6 text-xl font-bold tracking-wider text-yellow-500 border-b border-slate-700">CONFIGURACIÓN</h3>
                    
                    {/* CATEGORÍA */}
                    <div className="mb-6">
                        <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-500">
                            Temática
                        </label>
                        <div className="relative">
                            <select 
                                value={config.category} 
                                onChange={cambiarCategoria}
                                disabled={!soyAdmin} 
                                className={`w-full p-4 rounded-xl border-2 appearance-none font-bold uppercase tracking-wider focus:outline-none transition-colors text-sm
                                    ${soyAdmin 
                                        ? 'bg-slate-800 border-yellow-600/50 text-yellow-100 cursor-pointer hover:bg-slate-700 hover:border-yellow-500' 
                                        : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                {CATEGORIAS.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* JUGADORES */}
                    <div className="mb-6">
                        <label className="block mb-2 text-xs font-bold tracking-widest uppercase text-slate-500">Límite</label>
                        <select 
                            value={config.maxPlayers} 
                            onChange={cambiarMaxJugadores}
                            disabled={!soyAdmin}
                            className={`w-full p-3 rounded-xl border-2 focus:outline-none font-bold
                                ${soyAdmin ? 'bg-slate-800 border-yellow-600/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'}
                            `}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                                <option key={num} value={num}>{num} Jugadores</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* CONTROLES */}
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={toggleListo}
                        className={`w-full font-black py-4 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-lg
                        ${estoyListo 
                            ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-800 text-slate-900' 
                            : 'bg-slate-700 hover:bg-slate-600 border-slate-900 text-slate-300'
                        }`}
                    >
                        {estoyListo ? "CANCELAR" : "ESTOY LISTO"}
                    </button>

                    {soyAdmin && (
                        <button 
                            onClick={iniciarJuego}
                            disabled={!puedenIniciar}
                            className="w-full py-4 text-xl font-black tracking-widest text-white uppercase transition-all border-b-8 border-red-900 shadow-lg bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 rounded-xl active:border-b-0 active:translate-y-2 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            {puedenIniciar ? "INICIAR PARTIDA" : "ESPERANDO..."}
                        </button>
                    )}
                    
                    {!soyAdmin && (
                        <div className="mt-2 text-xs tracking-widest text-center uppercase text-slate-500 animate-pulse">
                            {puedenIniciar ? "El líder está iniciando..." : "Esperando al líder..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;