# ProyectoPr.Pr — Sistema de Gestión Inmobiliaria

Proyecto desarrollado por Micaela Zirafa, Elias Villanueva y Brisa Gutiérrez.

## Requisitos previos

Antes de arrancar necesitás tener instalado:

- [Node.js LTS](https://nodejs.org) — incluye npm
- [XAMPP](https://www.apachefriends.org/download.html) — incluye MySQL y Apache
- [Git](https://git-scm.com/downloads)

## Cómo levantar el proyecto

### 1. Clonar el repositorio

git clone https://github.com/MicaZirStudent/ProyectoPr.Pr.git
cd ProyectoPr.Pr

### 2. Levantar XAMPP

Abrí el panel de XAMPP y dale Start a Apache y MySQL.

### 3. Levantar el backend

cd backend
npm install
npm start

### 4. Levantar el frontend

Abrí otra terminal y escribí:

cd frontend
npm install
npm start

Se abre solo el navegador en http://localhost:3000

## Estructura del proyecto

ProyectoPr.Pr/
├── frontend/         # React — interfaz de usuario
│   └── src/
└── backend/          # Node.js — servidor y API
    └── src/
        ├── controllers/
        ├── routes/
        ├── middleware/
        └── config/

## División del trabajo

- Micaela — CU 1 al 4 (Acceso y Publicaciones)
- ?? — CU 5 al 8 (Legal y Búsqueda pública)
- ?? — CU 9 al 12 (Turnos y Administración)
