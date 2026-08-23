const jwt = require('jsonwebtoken');
const Usuario = require('../../models/usuario');

const registrar = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;

        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
        }

        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo' });
        }

        const nuevoUsuario = new Usuario({
            nombre,
            apellido,
            email,
            password,
            rol
        });

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario creado correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Body recibido:', req.body);

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuario = await Usuario.findOne({ email });
        console.log('Usuario encontrado:', usuario);

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        if (password !== usuario.password) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { idUsuario: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                idUsuario: usuario._id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message });
    }
};

module.exports = { registrar, login };