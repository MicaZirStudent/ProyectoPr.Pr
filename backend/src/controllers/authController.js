const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Usuario = require('../../models/usuario');

const MENSAJE_RECUPERO = 'Si el correo ingresado está registrado, recibirás un enlace de restablecimiento en breve';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const hashearToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

        const passwordHasheada = await bcrypt.hash(password, 10);

        const nuevoUsuario = new Usuario({
            nombre,
            apellido,
            email,
            password: passwordHasheada,
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

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        if (usuario.estado === 'Inactivo') {
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

const solicitarRecuperacion = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(200).json({ mensaje: MENSAJE_RECUPERO });
        }

        const usuario = await Usuario.findOne({
            email: String(email).trim().toLowerCase(),
            estado: 'Activo'
        });

        if (usuario) {
            const tokenPlano = crypto.randomBytes(32).toString('hex');
            usuario.reset_token = hashearToken(tokenPlano);
            usuario.reset_token_expira = new Date(Date.now() + 30 * 60 * 1000);
            usuario.reset_token_usado = false;
            await usuario.save();

            const enlace = `${FRONTEND_URL}/restablecer/${tokenPlano}`;
            // SIMULACIÓN DE CORREO (desarrollo). En producción acá iría nodemailer/SendGrid.
            console.log('--- CU-12 simulación de email ---');
            console.log('Para:', usuario.email);
            console.log('Enlace de restablecimiento:', enlace);
            console.log('---------------------------------');
        }

        res.status(200).json({ mensaje: MENSAJE_RECUPERO });
    } catch (error) {
        res.status(200).json({ mensaje: MENSAJE_RECUPERO });
    }
};

const restablecerContrasena = async (req, res) => {
    try {
        const { token, password, confirmarPassword } = req.body;

        if (!token || !password || !confirmarPassword) {
            return res.status(400).json({ mensaje: 'Complete todos los campos' });
        }

        if (password !== confirmarPassword) {
            return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
        }

        const tokenHasheado = hashearToken(token);
        const usuario = await Usuario.findOne({
            reset_token: tokenHasheado,
            reset_token_usado: false,
            reset_token_expira: { $gt: new Date() }
        });

        if (!usuario) {
            return res.status(400).json({
                mensaje: 'El enlace no es válido, expiró o ya fue utilizado'
            });
        }

        usuario.password = await bcrypt.hash(password, 10);
        usuario.reset_token = null;
        usuario.reset_token_expira = null;
        usuario.reset_token_usado = true;
        await usuario.save();

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar la contraseña', error: error.message });
    }
};

module.exports = { registrar, login, solicitarRecuperacion, restablecerContrasena };