import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/http';
import { encabezadoAuth, haySesion } from '../utils/sesion';

// Intervalo mínimo entre renovaciones para no consultar en cada clic
const INTERVALO_RENOVACION_MS = 60 * 1000;

// Mantiene viva la sesión mientras el usuario navega (incluido el catálogo público):
// en cada cambio de pantalla valida el token y el backend devuelve uno renovado.
const SesionActiva = () => {
    const location = useLocation();
    const ultimaRenovacion = useRef(0);

    useEffect(() => {
        if (!haySesion()) return;
        const ahora = Date.now();
        if (ahora - ultimaRenovacion.current < INTERVALO_RENOVACION_MS) return;
        ultimaRenovacion.current = ahora;

        axios.get(`${API_URL}/api/auth/sesion`, encabezadoAuth()).catch(() => {
            /* el interceptor global maneja la sesión vencida */
        });
    }, [location.pathname]);

    return null;
};

export default SesionActiva;
