import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/hoaxify.png";
import { useAuthState, useAuthDispatch } from "../state/context";
import { useState } from "react";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useMessageNotifications } from "@/shared/hooks/useMessageNotifications";
import { NotificationDropdown } from "./NotificationDropdown";

export function NavBar() {
  const { t } = useTranslation();
  const authState = useAuthState();
  const authDispatch = useAuthDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  
  // Bildirim hook'unu kullan (sadece giriş yapmış kullanıcılar için)
  const notificationContext = authState?.isLoggedIn ? useNotifications() : null;
  const { unreadCount } = notificationContext || { unreadCount: 0 };
  
  // Mesaj bildirimi hook'unu kullan
  const messageNotificationContext = authState?.isLoggedIn ? useMessageNotifications() : null;
  const { unreadMessageCount } = messageNotificationContext || { unreadMessageCount: 0 };

  const handleLogout = () => {
    // Local storage'dan tokeni temizle
    localStorage.removeItem('token');
    
    // Context'teki auth state'i güncelle
    authDispatch({
      type: 'logout-success'
    });
    
    // Ana sayfaya yönlendir
    navigate('/feed');
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link className="navbar-brand" to="/feed">
            <img src={logo} width={40} height={40} alt="Hoaxify Logo" className="rounded-lg" />
            <span className="text-gradient font-bold text-xl">Hoaxify</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {authState?.isLoggedIn && (
              <>
                <Link className="nav-link" to="/search">
                  <i className="bi bi-search me-2"></i>
                  {t("Ara")}
                </Link>
                <Link className="nav-link relative" to="/messages">
                  <i className="bi bi-chat-dots me-2"></i>
                  {t("Mesajlar")}
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
          
          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {authState?.isLoggedIn && (
              <>
                {/* Bildirim İkonu */}
                <div className="relative">
                  <button 
                    className="nav-link relative p-2"
                    onClick={toggleNotificationDropdown}
                    title="Bildirimler"
                  >
                    <i className="bi bi-bell text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={isNotificationDropdownOpen}
                    onClose={() => setIsNotificationDropdownOpen(false)}
                  />
                </div>
                
                <button 
                  className="btn btn-primary" 
                  onClick={() => document.dispatchEvent(new CustomEvent('createPost'))}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  {t("Yeni Gönderi")}
                </button>
                <Link className="nav-link" to={`/users/${authState.id}`}>
                  <i className="bi bi-person-circle me-2"></i>
                  {authState?.username || 'Kullanıcı'}
                </Link>
                <button 
                  className="nav-link hover:text-red-600" 
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  {t("logout")}
                </button>
              </>
            )}
            {!authState?.isLoggedIn && (
              <>
                <Link className="nav-link" to="/login">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  {t("login")}
                </Link>
                <Link className="btn btn-outline-primary" to="/signup">
                  <i className="bi bi-person-plus me-2"></i>
                  {t("sign.up")}
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'} text-xl`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-2 animate-slide-up">
            {authState?.isLoggedIn && (
              <>
                <Link className="block nav-link py-3" to="/search" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-search me-2"></i>
                  {t("Ara")}
                </Link>
                <Link className="block nav-link py-3 relative" to="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-chat-dots me-2"></i>
                  {t("Mesajlar")}
                  {unreadMessageCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
                
                {/* Mobile Bildirim Linki */}
                <Link className="block nav-link py-3 relative" to="/notifications" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-bell me-2"></i>
                  Bildirimler
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                <button 
                  className="block btn btn-primary text-center my-3" 
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent('createPost'));
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  {t("Yeni Gönderi")}
                </button>
                <Link className="block nav-link py-3" to={`/users/${authState.id}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-person-circle me-2"></i>
                  {authState?.username || 'Kullanıcı'}
                </Link>
                <button 
                  className="block w-full text-left nav-link hover:text-red-600 py-3" 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  {t("logout")}
                </button>
              </>
            )}
            {!authState?.isLoggedIn && (
              <>
                <Link className="block nav-link py-3" to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  {t("login")}
                </Link>
                <Link className="block btn btn-outline-primary text-center my-3" to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="bi bi-person-plus me-2"></i>
                  {t("sign.up")}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 