import Card from '../src/card/cards.model.js';

export const generateCardNumber = () => {
    // numero fico y se le agregan 10 digitos aleatorios para completar el numero de tarjeta
    const bin = '453201';
    // creamos la parte random de la tarjeta
    const randomPart = String(Math.floor(Math.random() * 10 ** 10)).padStart(10, '0');
    return `${bin}${randomPart}`;
};
// validamos que el numero de tarjeta sea unico
export const validateUniqueCardNumber = async (cardNumber) => {
    // Busca en la base de datos si ya existe una tarjeta con ese numero
    const exists = await Card.findOne({ cardNumber });
    if (exists) throw new Error('El numero de tarjeta ya existe');
    return true;
};

//genera un numero unico para la tarjeta
export const getUniqueCardNumber = async (maxRetries = 10) => {
    // contador de intentos realizados
    let retries = 0;

    // Intenta generar un numero unico mientras no supere el maximo de intentos
    while (retries < maxRetries) {
        const candidate = generateCardNumber();

        try {
            //verifica si el numero generado es unico
            await validateUniqueCardNumber(candidate);
            return candidate;
        } catch (error) {
            if (error.message !== 'El numero de tarjeta ya existe') {
                throw error;
            }

            retries += 1;
        }
    }

    throw new Error('No se pudo generar un numero de tarjeta unico');
};
