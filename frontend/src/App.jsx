import { Outlet } from "react-router-dom";
import { NavBar } from "./shared/components/NavBar";
import { CreatePostModal } from "./shared/components/CreatePostModal";
import { ToastContainer } from "./shared/components/Toast";
import { useToast } from "./shared/hooks/useToast";
import { NotificationProvider } from "./shared/hooks/useNotifications";
import { useAuthState } from "./shared/state/context";
import { createContext, useContext } from "react";

// Toast context
const ToastContext = createContext();

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

function App() {
  const toastActions = useToast();
  const authState = useAuthState();

  return (
    <ToastContext.Provider value={toastActions}>
      {/* Bildirim provider'ını sadece giriş yapmış kullanıcılar için sarmalıyoruz */}
      {authState?.isLoggedIn ? (
        <NotificationProvider>
          <NavBar/>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
          <CreatePostModal />
          <ToastContainer 
            toasts={toastActions.toasts} 
            removeToast={toastActions.removeToast} 
          />
        </NotificationProvider>
      ) : (
        <>
          <NavBar/>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
          <CreatePostModal />
          <ToastContainer 
            toasts={toastActions.toasts} 
            removeToast={toastActions.removeToast} 
          />
        </>
      )}
    </ToastContext.Provider>
  );
}

export default App;
