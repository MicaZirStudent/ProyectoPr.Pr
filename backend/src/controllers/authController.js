// bcrypt nos permite encriptar contraseñas (nunca se guardan en texto plano)
const bcrypt = require('bcrypt');

// jsonwebtoken nos permite generar el "token" de sesión
const jwt = require('jsonwebtoken');

// Importamos la conexión a la base de datos
const db = require('../config/db');

// Función para REGISTRAR un usuario nuevo
const registrar = async (req, res) => {
    try {
        // Sacamos los datos que React nos va a mandar en el body de la petición
        const { nombre, apellido, correoElectronico, contrasena, rol } = req.body;

        // Validamos que vengan todos los campos obligatorios
        if (!nombre || !apellido || !correoElectronico || !contrasena || !rol) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
        }

        // Encriptamos la contraseña antes de guardarla.
        // El "10" es el costo de encriptación (más alto = más seguro pero más lento)
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Insertamos el usuario en la base de datos
        const [resultado] = await db.query(
            'INSERT INTO usuario (nombre, apellido, correoElectronico, contrasena, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, correoElectronico, contrasenaEncriptada, rol]
        );

        // Respondemos con éxito
        res.status(201).json({ mensaje: 'Usuario creado correctamente', idUsuario: resultado.insertId });

    } catch (error) {
        // Si el correo ya existe, MySQL tira un error específico que detectamos acá
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico' });
        }
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

// Función para hacer LOGIN
const login = async (req, res) => {
    try {
        const { correoElectronico, contrasena } = req.body;

        if (!correoElectronico || !contrasena) {
            return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        // Buscamos al usuario por su correo electrónico
        const [usuarios] = await db.query(
            'SELECT * FROM usuario WHERE correoElectronico = ?',
            [correoElectronico]
        );

        // Si no existe ningún usuario con ese correo
        if (usuarios.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuario = usuarios[0];

        // Comparamos la contraseña que mandaron con la encriptada en la base
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        // Si todo está bien, generamos el token de sesión
        const token = jwt.sign(
            { idUsuario: usuario.idUsuario, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '30m' } // el token expira en 30 minutos, según tu RNF1
        );

        // Respondemos con el token y los datos básicos del usuario (sin la contraseña)
        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                idUsuario: usuario.idUsuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
    }
};

// Exportamos ambas funciones para poder usarlas en las rutas
module.exports = { registrar, login };