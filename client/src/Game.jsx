import { useState } from 'react';

function Game({ role, word, isRevealed, impostorName, finalWord, onReveal, onNextRound, onReturnToLobby, soyAdmin }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // --- MODO 1: RESULTADOS (PANTALLA DE REVELACIÓN) ---
  if (isRevealed) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen p-4 overflow-hidden bg-slate-950 animate-fade-in text-yellow-50">
        
        <h2 className="mb-8 text-4xl font-black tracking-widest text-center text-yellow-500 font-game drop-shadow-lg">
            FIN DE RONDA
        </h2>

        {/* CAJA DEL IMPOSTOR */}
        <div className="w-full max-w-sm p-6 mb-6 text-center border-4 border-red-600 rounded-3xl bg-slate-900/80 shadow-[0_0_40px_rgba(220,38,38,0.3)] animate-bounce-small">
            <p className="mb-2 text-xs font-bold tracking-widest text-red-400 uppercase">EL IMPOSTOR ERA</p>
            <p className="text-4xl font-black text-white uppercase break-words">{impostorName}</p>
        </div>

        {/* CAJA DE LA PALABRA */}
        <div className="w-full max-w-sm p-4 mb-12 text-center border-2 border-green-500 rounded-2xl bg-slate-900/80">
            <p className="mb-1 text-xs font-bold tracking-widest text-green-400 uppercase">LA PALABRA ERA</p>
            <p className="text-2xl font-black text-white uppercase">{finalWord}</p>
        </div>

        {/* BOTÓN DE ADMIN: CONTINUAR */}
        {soyAdmin ? (
            <button 
                onClick={onNextRound}
                className="w-full max-w-xs py-5 text-xl font-black tracking-widest text-slate-900 uppercase transition-all bg-yellow-500 border-b-8 border-yellow-700 rounded-xl hover:bg-yellow-400 hover:scale-105 active:border-b-0 active:translate-y-2 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            >
                SIGUIENTE RONDA ➡️
            </button>
        ) : (
            <p className="text-sm tracking-widest uppercase text-slate-500 animate-pulse">
                Esperando al líder...
            </p>
        )}
        <button 
                onClick={onReturnToLobby}
                className="w-full max-w-sm py-3 mt-4 text-sm font-bold tracking-widest uppercase transition-all border-2 text-slate-400 border-slate-700 rounded-xl hover:bg-slate-800 hover:text-white hover:border-slate-500"
            >
                ⚙️ Volver al Lobby
            </button>

      </div>
    );
  }

  // --- MODO 2: JUEGO (LA CARTA) ---
  const esImpostor = role === 'impostor';
  const textoRevelado = esImpostor ? "ERES EL IMPOSTOR" : word;
  const subtexto = esImpostor 
    ? "Engaña a todos. Que no descubran que no sabes la palabra." 
    : "Esta es la palabra clave. Encuentra al mentiroso.";
  
  const colorBorde = esImpostor ? "border-red-600" : "border-green-500";
  const colorTexto = esImpostor ? "text-red-500" : "text-green-400";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen p-4 bg-slate-950 animate-fade-in">
      
      <h2 className="mb-8 text-3xl font-black tracking-widest text-yellow-500 font-game drop-shadow-lg">
        TU IDENTIDAD
      </h2>

      {/* CARTA GIRATORIA (Sin cambios) */}
      <div 
        className="relative group w-72 h-96 [perspective:1000px] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* FRENTE */}
          <div className="absolute inset-0 w-full h-full">
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 border-4 border-yellow-600 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] [backface-visibility:hidden]">
              <span className="text-6xl animate-pulse">🕵️‍♂️</span>
              <p className="mt-4 text-sm font-bold tracking-widest text-yellow-600 uppercase">TOCA PARA REVELAR</p>
            </div>
          </div>

          {/* DORSO */}
          <div className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden]">
             <div className={`flex flex-col items-center justify-center w-full h-full bg-slate-900 border-4 ${colorBorde} rounded-2xl shadow-2xl p-6 text-center`}>
                <div className="mb-4 text-6xl">{esImpostor ? "🤫" : "🧑‍🚀"}</div>
                <h3 className={`text-3xl font-black font-game mb-4 uppercase ${colorTexto} drop-shadow-md`}>
                    {esImpostor ? "IMPOSTOR" : "TRIPULANTE"}
                </h3>
                <div className="w-full h-px mb-6 bg-slate-700"></div>
                <p className="mb-2 text-xs font-bold tracking-widest uppercase text-slate-400">TU MISIÓN:</p>
                <p className="text-xl font-black leading-relaxed text-white uppercase">
                    {textoRevelado}
                </p>
                <p className="mt-6 text-[10px] text-slate-500 italic">
                    {subtexto}
                </p>
             </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-slate-500 animate-pulse">
        {isFlipped ? "¡Shhh! No le digas a nadie." : "Toca la tarjeta para ver tu rol"}
      </p>

      {/* BOTÓN REVELAR (SOLO ADMIN) */}
      {soyAdmin && (
         <button 
            onClick={onReveal}
            className="px-8 py-3 mt-12 text-sm font-bold tracking-widest text-red-500 uppercase transition-all border-2 rounded-full bg-red-900/20 border-red-500/50 hover:bg-red-900/50 hover:border-red-500 hover:text-white"
         >
            👁️ Revelar Impostor
         </button>
      )}

    </div>
  );
}

export default Game;