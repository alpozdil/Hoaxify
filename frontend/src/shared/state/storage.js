export function storeAuthState(authState) {
    localStorage.setItem('auth', JSON.stringify(authState));
}

export function loadAuthState() {
    const defaultState = {
        id: 0,
        username: '',
        email: '',
        image: null,
        isLoggedIn: false
    };
    
    const authStateStr = localStorage.getItem('auth');
    if (!authStateStr) return defaultState;
    
    try {
        const authState = JSON.parse(authStateStr);
        return authState;
    } catch {
        return defaultState;
    }
}

export function getAuthHeader() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    return {
        Authorization: `Bearer ${token}`
    };
}

export function storeToken(token) {
    // Token string olarak sakla, object değil
    if (typeof token === 'object' && token.token) {
        localStorage.setItem('token', token.token);
    } else if (typeof token === 'string') {
        localStorage.setItem('token', token);
    } else {
        console.error('Invalid token format:', token);
    }
}

export function clearStorage() {
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
}
