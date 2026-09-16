const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Usuario = require('../../models/usuario');

const ROLES = ['Agente', 'Area legal', 'Administrador'];
const ESTADOS = ['Activo', 'Inactivo'];

const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const sinPassword = (usuario) => {
    const obj = usuario.toObject();
    delete obj.password;
    return obj;
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
    }
};

const crearUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;

        if (!nombre || !apellido || !email || !password || !rol) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        if (!emailValido(email)) {
            return res.status(400).json({ mensaje: 'El formato del correo electrónico no es válido' });
        }

        if (!ROLES.includes(rol)) {
            return res.status(400).json({ mensaje: 'El rol indicado no es válido' });
        }

        const existe = await Usuario.findOne({ email: String(email).trim().toLowerCase() });
        if (existe) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico' });
        }

        const passwordHasheada = await bcrypt.hash(String(password), 10);
        const nuevo = await Usuario.create({
            nombre: String(nombre).trim(),
            apellido: String(apellido).trim(),
            email: String(email).trim().toLowerCase(),
            password: passwordHasheada,
            rol,
            estado: 'Activo'
        });

        res.status(201).json({
            mensaje: 'Usuario creado correctamente',
            usuario: sinPassword(nuevo)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico' });
        }
        res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
};

const modificarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, password, rol, estado } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        if (!nombre || !apellido || !email || !rol || !estado) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        if (!emailValido(email)) {
            return res.status(400).json({ mensaje: 'El formato del correo electrónico no es válido' });
        }

        if (!ROLES.includes(rol) || !ESTADOS.includes(estado)) {
            return res.status(400).json({ mensaje: 'Complete todos los campos obligatorios' });
        }

        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const emailNormalizado = String(email).trim().toLowerCase();
        const duplicado = await Usuario.findOne({ email: emailNormalizado, _id: { $ne: id } });
        if (duplicado) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico' });
        }

        usuario.nombre = String(nombre).trim();
        usuario.apellido = String(apellido).trim();
        usuario.email = emailNormalizado;
        usuario.rol = rol;
        usuario.estado = estado;

        if (password && String(password).trim()) {
            usuario.password = await bcrypt.hash(String(password).trim(), 10);
        }

        await usuario.save();

        res.json({
            mensaje: 'Usuario modificado correctamente',
            usuario: sinPassword(usuario)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico' });
        }
        res.status(500).json({ mensaje: 'Error al modificar el usuario', error: error.message });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        if (String(req.usuario.idUsuario) === String(id)) {
            return res.status(403).json({
                mensaje: 'No se puede eliminar la cuenta del administrador activo'
            });
        }

        const usuario = await Usuario.findByIdAndDelete(id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
    }
};

module.exports = { listarUsuarios, crearUsuario, modificarUsuario, eliminarUsuario };
