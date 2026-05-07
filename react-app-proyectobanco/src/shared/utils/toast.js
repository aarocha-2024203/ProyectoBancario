import toast from 'react-hot-toast';

export const showSuccess = (msg) =>
  toast.success(msg, { duration: 4000 });

export const showError = (msg) =>
  toast.error(msg, { duration: 5000 });

export const showInfo = (msg) =>
  toast(msg, { icon: 'ℹ️', duration: 4000 });

// Extrae el mensaje de error desde la respuesta del backend
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Ocurrió un error inesperado'
  );
};
