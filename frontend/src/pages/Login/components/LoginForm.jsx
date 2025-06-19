import { useState } from "react";
import { login } from "./api";
import { useNavigate } from "react-router-dom";
import { Input } from "@/shared/components/Input";
import { useTranslation } from "react-i18next";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { useAuthDispatch } from "@/shared/state/context";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiProgress, setApiProgress] = useState(false);
  const [failMessage, setFailMessage] = useState();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAuthDispatch();

  const onSubmit = async (event) => {
    event.preventDefault();
    setApiProgress(true);
    setFailMessage();
    try {
      const response = await login({ email, password });
      console.log("Login Response:", response.data);
      
      dispatch({ 
        type: 'login-success', 
        data: {
          user: {
            ...response.data.user,
            password: undefined,
            isLoggedIn: true
          }
        }
      });
      
      // Token'ı localStorage'a kaydet - doğru şekilde extract et
      if (response.data.token) {
        const tokenString = response.data.token.token || response.data.token;
        console.log("Token string:", tokenString);
        console.log("Token type:", typeof tokenString);
        localStorage.setItem('token', tokenString);
      } else {
        console.error("No token in response:", response.data);
      }
      
      navigate("/");
    } catch (error) {
      setFailMessage(error.response.data.message);
    } finally {
      setApiProgress(false);
    }
  };

  return (
    <form onSubmit={onSubmit} data-testid="login-form">
      {failMessage && <Alert styleType="danger">{failMessage}</Alert>}
      <Input
        id="email"
        label={t("email")}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        id="password"
        label={t("password")}
        type="password"
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button
        disabled={apiProgress || !email || !password}
        apiProgress={apiProgress}
      >
        {t("login")}
      </Button>
    </form>
  );
} 