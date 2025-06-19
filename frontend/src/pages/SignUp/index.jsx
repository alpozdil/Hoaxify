import { useEffect, useMemo, useState } from "react";
import { signUp, resendActivationEmail } from "./api";
import { Input } from "@/shared/components/Input";
import { useTranslation } from "react-i18next";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { Button } from "@/shared/components/Button";
import { Link } from "react-router-dom";

export function SignUp() {
  const [username, setUsername] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [passwordRepeat, setPasswordRepeat] = useState();
  const [apiProgress, setApiProgress] = useState();
  const [successMessage, setSuccessMessage] = useState();
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState();
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendApiProgress, setResendApiProgress] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        username: undefined,
      };
    });
  }, [username]);

  useEffect(() => {
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        email: undefined,
      };
    });
  }, [email]);

  useEffect(() => {
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        password: undefined,
      };
    });
  }, [password]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage();
    setGeneralError();
    setApiProgress(true);
    setShowResendButton(false);

    try {
      const response = await signUp({
        username,
        email,
        password,
      });
      setSuccessMessage(response.data.message);
    } catch (axiosError) {
      if (axiosError.response?.data) {
        if (axiosError.response.data.status === 400) {
          if (axiosError.response.data.validationErrors?.email === "E-posta adresi kullaniliyor") {
            setShowResendButton(true);
            setGeneralError("Bu e-posta adresi kullanılıyor. Aktivasyon e-postasını yeniden göndermek için aşağıdaki butona tıklayın.");
          } else {
            setErrors(axiosError.response.data.validationErrors);
          }
        } else {
          setGeneralError(axiosError.response.data.message);
        }
      } else {
        setGeneralError(t("genericError"));
      }
    } finally {
      setApiProgress(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setGeneralError("Lütfen e-posta adresinizi girin");
      return;
    }

    setResendApiProgress(true);
    setGeneralError();
    setSuccessMessage();

    try {
      const response = await resendActivationEmail(email);
      setSuccessMessage(response.data.message);
      setShowResendButton(false);
    } catch (axiosError) {
      if (axiosError.response?.data) {
        setGeneralError(axiosError.response.data.message);
      } else {
        setGeneralError("Aktivasyon e-postası gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setResendApiProgress(false);
    }
  };

  const passwordRepeatError = useMemo(() => {
    if (password && password !== passwordRepeat) {
      return t("passwordMismatch");
    }
    return "";
  }, [password, passwordRepeat]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient">
            {t("signUp")}
          </h2>
          <p className="mt-2 text-gray-600">Yeni hesap oluşturun</p>
        </div>
        
        <form className="card space-y-6" onSubmit={onSubmit}>
          <div className="card-body">
            <Input
              id="username"
              label={t("username")}
              error={errors.username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Input
              id="email"
              label={t("email")}
              error={errors.email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              id="password"
              label={t("password")}
              error={errors.password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
            <Input
              id="passwordRepeat"
              label={t("passwordRepeat")}
              error={passwordRepeatError}
              onChange={(event) => setPasswordRepeat(event.target.value)}
              type="password"
            />
            {successMessage && <Alert>{successMessage}</Alert>}
            {generalError && <Alert styleType="danger">{generalError}</Alert>}
            
            <div className="flex flex-col space-y-4">
              <Button
                disabled={!password || password !== passwordRepeat}
                apiProgress={apiProgress}
              >
                {t("signUp")}
              </Button>
              
              {showResendButton && (
                <Button
                  styleType="secondary"
                  onClick={handleResendEmail}
                  disabled={!email}
                  apiProgress={resendApiProgress}
                >
                  Aktivasyon E-postasını Yeniden Gönder
                </Button>
              )}
              
              <p className="text-center text-gray-600 text-sm">
                Zaten hesabınız var mı?{" "}
                <Link 
                  to="/login" 
                  className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
