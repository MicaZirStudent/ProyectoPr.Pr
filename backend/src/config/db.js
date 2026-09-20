require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB conectado correctamente');
    } catch (error) {
        console.error('Error al conectar MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;