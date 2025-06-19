import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/shared/components/Alert";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { login } from "./api";
import { useAuthDispatch } from "@/shared/state/context";
import { Link, useNavigate } from "react-router-dom";
import { storeToken } from "@/shared/state/storage";

export function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [apiProgress, setApiProgress] = useState();
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAuthDispatch();

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
    setGeneralError();
    setApiProgress(true);

    try {
        const response = await login({ email, password })
        if (response.data.token) {
          storeToken(response.data.token);
        }
        dispatch({type: 'login-success', data: response.data})
        navigate("/feed")
    } catch (axiosError) {
        if (axiosError.response?.data) {
          if (axiosError.response.data.status === 400) {
            setErrors(axiosError.response.data.validationErrors);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient">
            {t("login")}
          </h2>
          <p className="mt-2 text-gray-600">Hesabınıza giriş yapın</p>
        </div>
        
        <form className="card space-y-6" onSubmit={onSubmit}>
          <div className="card-body">
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
            {generalError && <Alert styleType="danger">{generalError}</Alert>}
            <div className="flex flex-col space-y-4">
              <Button disabled={!email || !password} apiProgress={apiProgress}>
                {t("login")}
              </Button>
              <Link 
                to="/password-reset/request" 
                className="text-center text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
              >
                Şifrenizi mi unuttunuz?
              </Link>
              <p className="text-center text-gray-600 text-sm">
                Hesabınız yok mu?{" "}
                <Link 
                  to="/signup" 
                  className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
                >
                  Kayıt olun
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
