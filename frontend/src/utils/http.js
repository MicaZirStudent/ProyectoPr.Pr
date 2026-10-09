import axios from 'axios';
import { actualizarToken, cerrarSesion, haySesion } from './sesion';

export const API_URL = 'http://localhost:3001';

const HEADER_TOKEN_RENOVADO = 'x-token-renovado';

let configurado = false;

// Interceptores globales de axios:
// - guardan el token renovado que devuelve el backend (sesión deslizante)
// - si una petición autenticada responde 401, cierran la sesión y llevan al login
export const configurarHttp = () => {
    if (configurado) return;
    configurado = true;

    axios.interceptors.response.use(
        (respuesta) => {
            actualizarToken(respuesta.headers?.[HEADER_TOKEN_RENOVADO]);
            return respuesta;
        },
        (error) => {
            const enviabaToken = Boolean(error.config?.headers?.Authorization);
            if (error.response?.status === 401 && enviabaToken && haySesion()) {
                cerrarSesion();
                window.location.assign('/login?sesion=expirada');
            }
            return Promise.reject(error);
        }
    );
};
