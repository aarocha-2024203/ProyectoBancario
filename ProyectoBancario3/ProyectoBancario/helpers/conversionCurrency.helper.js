import https from 'node:https';

//URL base del API de divisas
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Funcion para obtener la clave del API desde las variables de entorno
const getApiKey = () => {
    //Buscamos la clave en las variables de entorno
    const key = process.env.EXCHANGE_RATE_API_KEY;
    //Si no existe o no esta configurada, lanzamos un error para evitar llamadas fallidas al API
    if (!key) {
        throw new Error('EXCHANGE_RATE_API_KEY no configurada en el entorno');
    }
    //Si existe la retornamos
    return key;
};

/*Creamos un pequeño cache en memoria,
aquí guardamos temporalmente las tasas de cambio para no estar llamando la API a cada rato*/
const rateCache = {};

//Funcion que hace la peticion al API de divisas y lo convierte en JSON
const fetchJson = (url) => new Promise((resolve, reject) => {
    //Hacemos la petición HTTPS al API
    https.get(url, (res) => {
        let data = '';
        // Cada vez que llega un pedazo de información, lo vamos guardando
        res.on('data', (chunk) => { data += chunk; });
        // Cuando termina de llegar toda la informacion
        res.on('end', () => {
            try {
                // Intentamos convertir la respuesta en formato JSON
                const json = JSON.parse(data);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        });
    }).on('error', reject); // Si ocurre un error en la petición, lo enviamos
});

//funcion para obtener la tasa de cambio entre dos monedas
export const getExchangeRate = async (fromCode, toCode) => {
    const API_KEY = getApiKey(); // Obtenemos la clave del API de las variables de entorno
    
    // Creamos una clave para el cache, por ejemplo: "USD_GTQ"
    const key = `${fromCode}_${toCode}`;
    // Revisamos si ya tenemos esa tasa guardada en memoria
    const cached = rateCache[key];
    const now = Date.now();
    // Si existe en cache y aun no ha expirado, la devolvemos directamente
    if (cached && cached.expiresAt > now) return cached.rate;
    // Si no está en cache, construimos la URL para llamar la API
    const url = `${BASE_URL}/${API_KEY}/pair/${encodeURIComponent(fromCode)}/${encodeURIComponent(toCode)}`;
    // Hacemos la petición
    const json = await fetchJson(url);
    // Validamos que la respuesta sea correcta
    if (!json || json.result !== 'success' || typeof json.conversion_rate !== 'number') {
        throw new Error('Error al obtener tasa de cambio de ExchangeRate-API');
    }
    // Guardamos la tasa en una variable
    const rate = Number(json.conversion_rate);
    // Cache por 10 minutos
    rateCache[key] = { rate, expiresAt: now + 10 * 60 * 1000 };
    //Retornamos la tasa
    return rate;
};

//Funcion para convertir una cantidad de dinero de una moneda a otra
export const convertAmount = async (amount, fromCode, toCode) => {
    // Si la cantidad es 0 o las monedas son iguales, no hacemos nada
    if (!amount || fromCode === toCode) return Number(amount);
    // Obtenemos la tasa de cambio
    const rate = await getExchangeRate(fromCode, toCode);
    // Multiplicamos el monto por la tasa
    return Number(amount) * Number(rate);
};
// Exportamos las funciones para poder usarlas en otros archivos
export default { getExchangeRate, convertAmount };
