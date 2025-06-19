import { useAuthDispatch, useAuthState } from "@/shared/state/context"
import { deleteUser } from "./api"
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useUserDeleteButton(){
    const [apiProgress, setApiProgress] = useState(false);
    const { id } = useAuthState();
    const dispatch = useAuthDispatch()
    const navigate = useNavigate();

    const onDelete = useCallback(async () => {
        setApiProgress(true);
        try {
            await deleteUser(id);
            
            // Local storage'ı temizle
            localStorage.removeItem('token');
            
            // Context'teki auth state'i güncelle
            dispatch({ type: 'logout' });
            
            // Ana sayfaya yönlendir
            navigate('/');
            
        } catch (error) {
            console.error('Hesap silme hatası:', error);
            alert('Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setApiProgress(false);
        }
    }, [id, dispatch, navigate]);

    return {
        apiProgress,
        onDelete
    }
}