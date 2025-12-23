# 🕵️‍♂️ El Impostor - Multiplayer Party Game

> Un juego de deducción social en tiempo real desarrollado con el stack MERN y WebSockets.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🔗 Demo en Vivo

¡Puedes probar el juego ahora mismo sin instalar nada!
👉 **[Jugar a El Impostor](https://impostor-azure.vercel.app)**

*(Nota: Como el servidor está alojado en un servicio gratuito, puede tardar unos segundos en "despertar" la primera vez que entras).*

## 📖 Descripción

**El Impostor** es un proyecto **Open Source** de juego web multijugador inspirado en la dinámica de "Spyfall". Un grupo de jugadores entra a una sala virtual; a todos menos a uno se les asigna una palabra secreta. El jugador restante es el **Impostor**.

El objetivo de la tripulación es descubrir quién es el impostor mediante preguntas y deducciones, mientras que el objetivo del impostor es pasar desapercibido o adivinar la palabra secreta.

🚀 **¡Este proyecto es de la comunidad!** Animo a desarrolladores de todos los niveles a explorar el código, aprender de él y contribuir con nuevas ideas.

## ✨ Características Principales

* **Comunicación en Tiempo Real:** Sincronización instantánea de estados del juego utilizando **Socket.IO**.
* **Sistema de Salas:** Creación y unión a salas privadas mediante códigos únicos.
* **Persistencia de Sesión:** Sistema robusto de reconexión (F5) y manejo de "Usuarios Fantasma" ante desconexiones.
* **Gestión de Admin:** Controles exclusivos para el creador de la sala.
* **UI/UX Responsiva:** Diseño moderno y animado con **Tailwind CSS**.

## 🛠️ Tecnologías Utilizadas

### Frontend (Cliente)
* **React (Vite)**
* **Tailwind CSS**
* **Socket.IO Client**
* **React Router DOM**

### Backend (Servidor)
* **Node.js & Express**
* **Socket.IO Server**
* **Nodemon**

## 🚀 Instalación y Configuración Local

Si quieres correr el proyecto en tu máquina para probar cambios o aprender:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/VilasSantiago/impostor.git](https://github.com/VilasSantiago/impostor.git)
cd impostor
