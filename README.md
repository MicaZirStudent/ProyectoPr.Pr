# ProyectoPr.Pr — Sistema de Gestión Inmobiliaria

Proyecto desarrollado por Micaela Zirafa, Elias Villanueva y Brisa Gutiérrez.
Materia: Prácticas Profesionalizantes — 2026.

---

## Paso 1 — Instalar los programas necesarios

Instalá todo en este orden:

### 1.1 Node.js
Entrá a https://nodejs.org y descargá la versión LTS (el botón grande de la izquierda).
Ejecutá el instalador y seguí siguiente, siguiente, finalizar sin cambiar nada.

Para verificar que quedó bien instalado, abrí la terminal (cmd) y escribí:
node -v
npm -v
Los dos tienen que mostrar un número de versión.

### 1.2 Git
Entrá a https://git-scm.com/downloads y descargá la versión para Windows.
Instalá con todas las opciones por defecto.

Para verificar:
git --version

### 1.3 XAMPP
Entrá a https://www.apachefriends.org/download.html y descargá la versión 8.0.30 (64 bit).
Instalá con todas las opciones por defecto. Cuando pregunte dónde instalarlo, dejá C:\xampp.

---

## Paso 2 — Configurar Git con tu identidad

Abrí la terminal y escribí estos dos comandos con tus datos:

git config --global user.name "Tu Nombre"
git config --global user.email "tu-mail-institucional@..."

---

## Paso 3 — Clonar el repositorio

En la terminal escribí:

git clone https://github.com/MicaZirStudent/ProyectoPr.Pr.git
cd ProyectoPr.Pr

---

## Paso 4 — Instalar las dependencias

### Frontend
cd frontend
npm install
cd ..

### Backend
cd backend
npm install
cd ..

---

## Paso 5 — Configurar la base de datos

### 5.1 Levantar XAMPP
Abrí el panel de XAMPP y dale Start a Apache y MySQL. Los dos tienen que ponerse en verde.

### 5.2 Crear la base de datos
Abrí el navegador y entrá a http://localhost/phpmyadmin
En el panel izquierdo tocá Nueva.
En nombre de la base de datos escribí: gestion_inmobiliaria
En cotejamiento elegí: utf8mb4_general_ci
Tocá Crear.

### 5.3 Importar las tablas
Seleccioná la base de datos gestion_inmobiliaria en el panel izquierdo.
Tocá la pestaña Importar arriba.
Tocá Seleccionar archivo y buscá el archivo que está en la carpeta database/ del proyecto.
Tocá Ejecutar. Tienen que aparecer todas las tablas creadas.

---

## Paso 6 — Configurar el archivo .env

Dentro de la carpeta backend/ vas a encontrar un archivo llamado .env.example.
Copialo y renombralo como .env (sin el .example).
Abrilo y completá con tus datos:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestion_inmobiliaria
JWT_SECRET=una_clave_secreta_cualquiera

La contraseña la dejás vacía si no le pusiste contraseña a MySQL en XAMPP, que es lo normal.
El JWT_SECRET puede ser cualquier texto, por ejemplo: jwt_remax_2026

---

## Paso 7 — Levantar el proyecto

Necesitás dos terminales abiertas al mismo tiempo.

### Terminal 1 — Backend
cd backend
npm start

### Terminal 2 — Frontend
cd frontend
npm start

El navegador se abre solo en http://localhost:3000

---

## División del trabajo

- Micaela — CU 1 al 4 (Acceso y Publicaciones)
- ?? — CU 5 al 8 (Legal y Búsqueda pública)
- ?? — CU 9 al 12 (Turnos y Administración)

---

## Estructura del proyecto

ProyectoPr.Pr/
├── frontend/         # React — interfaz de usuario
│   └── src/
├── backend/          # Node.js — servidor y API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       └── config/
└── database/         # Archivo SQL para importar en phpMyAdmin
