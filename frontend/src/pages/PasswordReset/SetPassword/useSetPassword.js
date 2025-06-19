import { useCallback, useState } from "react";
import { resetPassword } from "./api";
import { useNavigate, useSearchParams } from "react-router-dom";

export function useSetPassword() {
  const [apiProgress, setApiProgress] = useState(false);
  const [password, setPassword] = useState();
  const [passwordRepeat, setPasswordRepeat] = useState();
  const [success, setSuccess] = useState();
  const [generalError, setGeneralError] = useState()
  const [errors, setErrors] = useState({});
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const onSubmit = useCallback(async (event) => {
    event.preventDefault();
    setApiProgress(true);
    setSuccess();
    setErrors({});
    setGeneralError()
    
    const token = searchParams.get("tk");
    
    // Token yoksa hata ver
    if (!token) {
      setGeneralError("Geçersiz şifre yenileme bağlantısı. Lütfen yeni bir şifre yenileme talebi gönderin.");
      setApiProgress(false);
      return;
    }

    try {
      const response = await resetPassword(token, { password });
      setSuccess(response.data.message);
      navigate("/login")
    } catch (axiosError) {
      console.error("Şifre yenileme hatası:", axiosError);
      
      if (axiosError.response?.data) {
        if (axiosError.response.data.status === 400) {
          setErrors(axiosError.response.data.validationErrors || {});
        } else {
          setGeneralError(
            axiosError.response.data.message || 
            "Şifre yenileme işlemi başarısız oldu."
          );
        }
      } else if (axiosError.response?.status === 404) {
        setGeneralError("Şifre yenileme bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre yenileme talebi gönderin.");
      } else {
        setGeneralError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.");
      }
    } finally {
      setApiProgress(false);
    }
  }, [password, searchParams, navigate]);



  return {
    apiProgress,
    onChangePassword: (event) => {
      setPassword(event.target.value),
      setErrors({})
    },
    onChangePasswordRepeat: (event) => setPasswordRepeat(event.target.value),
    onSubmit,
    success,
    errors: {
      password: errors.password,
      passwordRepeat: password !== passwordRepeat ? 'Şifreler eşleşmiyor' : ''
    },
    generalError,
    disabled: password ? password !== passwordRepeat : true

  };
}