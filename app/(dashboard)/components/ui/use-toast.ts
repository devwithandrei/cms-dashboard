import { toast } from 'react-hot-toast';

export const useToast = () => {
    const toastSuccess = (message: string) => {
        toast.success(message);
    };

    const toastError = (message: string) => {
        toast.error(message);
    };

    return { toastSuccess, toastError };
};
