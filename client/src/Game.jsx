import { useState } from 'react';

function Game({ role, word }) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Colores y textos según el rol (se revelan al girar)
  const esImpostor = role === 'impostor';
  const textoRevelado = esImpostor ? "ERES EL IMPOSTOR" : word;
  const subtexto = esImpostor 
    ? "Engaña a todos. Que no descubran que no sabes la palabra." 
    : "Esta es la palabra clave. Encuentra al mentiroso.";
  
  const colorBorde = esImpostor ? "border-red-600" : "border-green-500";
  const colorTexto = esImpostor ? "text-red-500" : "text-green-400";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen p-4 bg-slate-950 animate-fade-in">
      
      {/* Título Superior */}
      <h2 className="mb-8 text-3xl font-black tracking-widest text-yellow-500 font-game drop-shadow-lg">
        TU IDENTIDAD
      </h2>

      {/* CONTENEDOR DE LA CARTA (Escena 3D) */}
      <div 
        className="relative group w-72 h-96 [perspective:1000px] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* LA CARTA EN SÍ (Con transición de giro) */}
        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* --- FRENTE DE LA CARTA (Incógnita) --- */}
          <div className="absolute inset-0 w-full h-full">
            <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 border-4 border-yellow-600 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] [backface-visibility:hidden]">
              <span className="text-6xl animate-pulse">🕵️‍♂️</span>
              <p className="mt-4 text-sm font-bold tracking-widest text-yellow-600 uppercase">TOCA PARA REVELAR</p>
            </div>
          </div>

          {/* --- DORSO DE LA CARTA (Revelación) --- */}
          <div className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden]">
             <div className={`flex flex-col items-center justify-center w-full h-full bg-slate-900 border-4 ${colorBorde} rounded-2xl shadow-2xl p-6 text-center`}>
                
                {esImpostor ? (
                    <div className="mb-4 text-6xl">🤫</div>
                ) : (
                    <div className="mb-4 text-6xl">🧑‍🚀</div>
                )}

                <h3 className={`text-3xl font-black font-game mb-4 uppercase ${colorTexto} drop-shadow-md`}>
                    {esImpostor ? "IMPOSTOR" : "TRIPULANTE"}
                </h3>
                
                <div className="w-full h-px mb-6 bg-slate-700"></div>

                <p className="mb-2 text-xs tracking-widest uppercase text-slate-400">TU MISIÓN:</p>
                <p className="text-xl font-bold leading-relaxed text-white uppercase">
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
        {isFlipped ? "Espera a que todos vean su carta..." : "Toca la tarjeta para ver tu rol"}
      </p>

    </div>
  );
}

export default Game;