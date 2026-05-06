import Account from '../src/accounts/accounts.model.js';

// valida el pago mensual minimo para que la persona pueda adquirir una cuenta
export const validateMinimumIncome = (income) => {
    //decimos que si income es undefined o null
    //el campo no sera valido
    if (income === undefined || income === null) {
        throw new Error('El ingreso del usuario es requerido');
    }
    //convertimos el infreso en un numero para poder validar que sea un numero valido
    const normalizedIncome = Number(income);

    //verificamos si la conversion que hicimos es un numero valido y si no mandamos un error
    if (Number.isNaN(normalizedIncome)) {
        throw new Error('El ingreso del usuario no es un numero valido');
    }

    //volvemos a verificar si el numero es menor a 100 y si lo es mandamos un error
    //y entonces tiene que poner un ingreso minimo de 100 para poder tener su cuenta
    if (normalizedIncome < 100) {
        throw new Error(
            'El usuario no cumple con el ingreso minimo de Q100 para crear una cuenta'
        );
    }

    return true;
};

// ingresamos como va a ser la estructura del numero de cuenta
// este tiene que llevar 3 letras mayusculas, un guion, 3 numeros, un guion y 4 numeros
const ACCOUNT_NUMBER_REGEX = /^[A-Z]{3}-\d{3}-\d{4}$/;

//nuestra funcion para crear el num de la cuenta
export const generateAccountNumber = () => {
    //generamos la segunda parte del bloque de 3 digits
    const firstBlock = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    //generamos la tercera parte del bloque de 4 digits
    const secondBlock = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return `ACC-${firstBlock}-${secondBlock}`;
};

//Validamos que solo exista un numero de cuenta
export const validateUniqueAccountNumber = async (number) => {
    //verificamos que el numero de cuenta tenga el formato correcto
    if (!ACCOUNT_NUMBER_REGEX.test(number)) {
        throw new Error('El numero de cuenta debe tener el formato ABC-000-0000');
    }
    //buscamos en la base de datos si ya existe una cuenta con ese numero de cuenta
    const existingAccount = await Account.findOne({ accountNumber: number });

    //decimos que si la cuenta existe, entonces mandamos un error diciendo que ya esxiste esa cuenta
    if (existingAccount) {
        throw new Error('El numero de cuenta ya existe');
    }

    return true;
};

//validamos que el numero de cuenta tenga el formato correcto
const DPI_REGEX = /^\d{13}$/;

//validamos que el numero de telefono tenga el formato correcto
const PHONE_REGEX = /^\d{8}$/;

//verificamos que el valor no sea indefinido o nulo y que no sea una cadena vacia o que tenga espacios en blanco
const hasValue = (value) => value !== undefined && value !== null && `${value}`.trim() !== '';

//validamos los datos de la cuenta
export const validateAccountHolderData = (accountData, { partial = false } = {}) => {

    //definimos los campos que son requeridos 
    const requiredStringFields = [
        { key: 'address', message: 'La direccion es requerida' },
        { key: 'jobName', message: 'El nombre del trabajo es requerido' }
    ];

    //recorremos cada campo de forma obligatoria 
    for (const field of requiredStringFields) {
        //obtenemos el valor del campo
        const value = accountData[field.key];
        //si el campo no es opcional y no tiene valor
        //  mandamos un error con el mensaje correspondiente
        if (!partial && !hasValue(value)) {
            throw new Error(field.message);
        }

        if (value !== undefined && typeof value !== 'string') {
            throw new Error(`El campo ${field.key} debe ser texto`);
        }
    }

    if (!partial && !hasValue(accountData.dpi)) {
        throw new Error('El DPI es requerido');
    }

    if (accountData.dpi !== undefined && !DPI_REGEX.test(String(accountData.dpi).trim())) {
        throw new Error('El DPI debe tener 13 digitos');
    }

    if (!partial && !hasValue(accountData.phone)) {
        throw new Error('El celular es requerido');
    }

    if (accountData.phone !== undefined && !PHONE_REGEX.test(String(accountData.phone).trim())) {
        throw new Error('El celular debe tener 8 digitos');
    }

    if (!partial && !hasValue(accountData.monthlyIncome)) {
        throw new Error('El ingreso mensual es requerido');
    }

    if (accountData.monthlyIncome !== undefined) {
        const monthlyIncome = Number(accountData.monthlyIncome);

        if (Number.isNaN(monthlyIncome)) {
            throw new Error('El ingreso mensual no es un numero valido');
        }

        if (monthlyIncome < 0) {
            throw new Error('El ingreso mensual no puede ser negativo');
        }
    }

    return true;
};
