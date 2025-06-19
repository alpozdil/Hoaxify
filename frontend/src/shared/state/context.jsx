import { createContext, useContext, useEffect, useReducer } from "react";
import { loadAuthState, storeAuthState } from "./storage";

export const AuthContext = createContext();

export const AuthDispatchContext = createContext();

export function useAuthState(){
  return useContext(AuthContext);
}

export function useAuthDispatch(){
  return useContext(AuthDispatchContext);
}

const authReducer = (authState, action) => {
  switch (action.type) {
    case "login-success":
      return {
        ...action.data.user,
        isLoggedIn: true
      };
    case "logout-success":
      return { id: 0, isLoggedIn: false };
    case "logout":
      return { id: 0, isLoggedIn: false };
    case "user-update-success":
      return {
        ...authState,
        username: action.data.username,
        image: action.data.image,
        banner: action.data.banner,
        bio: action.data.bio
      }

    default:
      throw new Error(`unknown action: ${action.type}`);
  }
};

export function AuthenticationContext({ children }) {
  let initialState = loadAuthState();
  
  // Güvenlik kontrolü ekle
  if (!initialState || typeof initialState !== 'object') {
    initialState = {
      id: 0,
      username: '',
      email: '',
      image: null,
      banner: null,
      bio: null,
      isLoggedIn: false
    };
  } else {
    initialState.isLoggedIn = initialState.id > 0;
  }

  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    storeAuthState(authState);
  }, [authState]);

  return (
    <AuthContext.Provider value={authState}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}
