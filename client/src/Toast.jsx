import React, { useEffect } from 'react';

// Un solo aviso individual
const ToastItem = ({ msg, type, onClose }) => {
  // Auto-cierre a los 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Colores según el tipo de mensaje
  const styles = type === 'error' 
    ? 'border-red-500 bg-red-900/80 text-red-100' // Alguien se desconectó
    : 'border-yellow-500 bg-yellow-900/80 text-yellow-100'; // Alguien salió voluntariamente

  return (
    <div className={`
      pointer-events-auto w-72 mb-3 p-4 rounded-lg shadow-xl border-l-4 backdrop-blur-md
      flex items-start justify-between transition-all duration-500 animate-in slide-in-from-right
      ${styles}
    `}>
      <div className="flex-1 text-sm font-bold tracking-wide">
        {msg}
      </div>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
};

// El contenedor que posiciona los avisos
const ToastContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end pointer-events-none">
      {notifications.map((notif) => (
        <ToastItem 
          key={notif.id} 
          msg={notif.msg} 
          type={notif.type} 
          onClose={() => removeNotification(notif.id)} 
        />
      ))}
    </div>
  );
};

export default ToastContainer;