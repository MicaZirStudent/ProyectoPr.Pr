# ProyectoPr.Pr — Sistema de Gestión Inmobiliaria SOLUTION

Proyecto desarrollado por Micaela Zirafa, Elias Villanueva y Brisa Gutiérrez.
Materia: Prácticas Profesionalizantes — 2026.

## Paso 1 — Instalar los programas necesarios

Instalá todo en este orden:

### 1.1 Node.js
Entrá a https://nodejs.org y descargá la versión LTS.
Para verificar:
node -v
npm -v

### 1.2 Git
Entrá a https://git-scm.com/downloads y descargá la versión para Windows.
Para verificar:
git --version

### 1.3 Cursor (IDE con IA)
Entrá a https://cursor.com/download y descargá la versión para Windows.
Al abrirlo por primera vez te ofrece importar la configuración de VS Code, aceptá.

### 1.4 MongoDB Community Server
Entrá a https://mongodb.com/try/download/community y descargá la versión para Windows.
Durante la instalación:
- Tildá Install MongoDB as a Service
- Tildá Install MongoDB Compass (interfaz gráfica)

Para verificar que el servicio está corriendo abrí MongoDB Compass
y conectate a mongodb://localhost:27017

## Paso 2 — Configurar Git con tu identidad

Abrí la terminal y escribí estos comandos con tus datos del terciario:

git config --global user.name "Tu Nombre"
git config --global user.email "tuDNI@terciariourquiza.edu.ar"

## Paso 3 — Clonar el repositorio

git clone https://github.com/MicaZirStudent/ProyectoPr.Pr.git
cd ProyectoPr.Pr

## Paso 4 — Instalar las dependencias

Frontend:
cd frontend
npm install
cd ..

Backend:
cd backend
npm install
cd ..

## Paso 5 — Configurar la base de datos

### 5.1 Verificar que MongoDB está corriendo
Abrí MongoDB Compass y conectate a mongodb://localhost:27017
Si conecta, está todo bien.

### 5.2 Crear el usuario administrador
Dentro de la carpeta backend/ ejecutá:

node crearAdmin.js

Esto crea el usuario administrador en la base de datos.
Credenciales:
- Email: admin@solution.com
- Contraseña: admin123

La base de datos solution se crea automáticamente.

## Paso 6 — Configurar el archivo .env

Dentro de la carpeta backend/ copiá el archivo .env.example
y renombralo como .env. Completá con estos datos:

MONGO_URI=mongodb://localhost:27017/solution
JWT_SECRET=una_clave_secreta_cualquiera
PORT=3001

## Paso 7 — Levantar el proyecto

Necesitás dos terminales abiertas al mismo tiempo.

Terminal 1 — Backend:
cd backend
node index.js

Tiene que aparecer:
- MongoDB conectado correctamente
- Servidor corriendo en http://localhost:3001

Terminal 2 — Frontend:
cd frontend
npm start

El navegador se abre solo en http://localhost:3000

## Trazabilidad de commits

Cada commit debe:
- Realizarse con la cuenta del terciario (DNI@terciariourquiza.edu.ar)
- Incluir el prompt utilizado en Cursor/IA
- Incluir el link al ticket de Trello correspondiente

Formato:
git commit -m "TASK-XX Descripcion - Prompts: prompt usado - Ticket: link de trello"

Tablero Trello: https://trello.com/b/5vqLCS8p/solution

## División del trabajo

- Micaela Zirafa — CU-01 al CU-04 (Acceso y Publicaciones)
- Brisa Gutierrez — CU-05 al CU-08 (Legal y Búsqueda pública)
- Elias Villanueva — CU-09 al CU-12 (Turnos y Administración)

## Estructura del proyecto

ProyectoPr.Pr/
├── frontend/          # React — interfaz de usuario
│   └── src/
├── backend/           # Node.js/Express — servidor y API
│   ├── models/        # Modelos de Mongoose (MongoDB)
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       └── config/

## Stack tecnológico

- Frontend: React
- Backend: Node.js + Express
- Base de datos: MongoDB + Mongoose
- IDE: Cursor (con IA integrada)
- Control de versiones: GitHub
- Gestión de tareas: Trello
- IA utilizada: Claude (Anthropic) + Cursor Grok
