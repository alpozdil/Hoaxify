import { Button } from "@/shared/components/Button";
import { useUserDeleteButton } from "./useUserDeleteButton";
import { useState } from "react";

export function UserDeleteButton(){
    const {apiProgress, onDelete} = useUserDeleteButton();
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleDeleteClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = () => {
        onDelete();
        setShowConfirmModal(false);
    };

    return (
        <>
            <Button 
                styleType="outline-danger" 
                onClick={handleDeleteClick}
                disabled={apiProgress}
                className="btn-sm"
            >
                <i className="bi bi-trash3"></i>
                {apiProgress ? " Siliniyor..." : " Hesabı Sil"}
            </Button>

            {showConfirmModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title text-danger">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    Hesabı Kalıcı Olarak Sil
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowConfirmModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-danger">
                                    <strong>⚠️ DİKKAT:</strong> Bu işlem geri alınamaz!
                                </div>
                                <p className="mb-3">
                                    Hesabınızı sildiğinizde:
                                </p>
                                <ul className="list-unstyled">
                                    <li>✗ Tüm gönderileriniz silinecek</li>
                                    <li>✗ Tüm yorumlarınız silinecek</li>
                                    <li>✗ Tüm mesajlarınız silinecek</li>
                                    <li>✗ Takip ilişkileriniz silinecek</li>
                                    <li>✗ Profil bilgileriniz tamamen silinecek</li>
                                </ul>
                                <p className="text-muted mt-3">
                                    Silinen hesap aynı e-posta adresi ile yeniden oluşturulabilir.
                                </p>
                            </div>
                            <div className="modal-footer border-0">
                                <Button 
                                    styleType="secondary" 
                                    onClick={() => setShowConfirmModal(false)}
                                    className="me-2"
                                >
                                    İptal
                                </Button>
                                <Button 
                                    styleType="danger" 
                                    onClick={handleConfirmDelete}
                                    disabled={apiProgress}
                                >
                                    {apiProgress ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Siliniyor...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash3 me-2"></i>
                                            Evet, Hesabımı Sil
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}