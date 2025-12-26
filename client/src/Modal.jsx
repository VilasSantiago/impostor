// client/src/Modal.jsx
import React from 'react';

// Agregamos el prop 'isAlert' con valor false por defecto
const Modal = ({ isOpen, onClose, onConfirm, title, message, isAlert = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-200 bg-black/70 backdrop-blur-sm animate-in fade-in">
      
      <div className="flex flex-col w-full max-w-sm gap-4 p-6 transition-all transform scale-100 border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl">
        
        {/* Icono (Cambiamos el color si es Alerta o Confirmación) */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-2 ${isAlert ? 'bg-yellow-900/20' : 'bg-red-900/20'}`}>
          <svg className={`h-6 w-6 ${isAlert ? 'text-yellow-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-black tracking-widest text-white uppercase">
            {title}
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {message}
          </p>
        </div>

        {/* Lógica de Botones */}
        <div className="flex gap-3 mt-4">
          
          {/* Si NO es alerta, mostramos el botón Cancelar */}
          {!isAlert && (
            <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-bold tracking-wider uppercase transition-colors bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
            >
                Cancelar
            </button>
          )}
          
          <button
            onClick={onConfirm} // En alertas, este botón solo cierra el modal
            className={`px-4 py-3 text-sm font-bold tracking-wider text-white uppercase transition-all rounded-xl shadow-lg 
                ${isAlert 
                    ? 'w-full bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20' // Estilo Alerta
                    : 'flex-1 bg-red-600 hover:bg-red-500 shadow-red-500/30' // Estilo Peligro
                }`}
          >
            {isAlert ? "ENTENDIDO" : "CONFIRMAR"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;