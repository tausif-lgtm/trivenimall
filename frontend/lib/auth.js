import Cookies from 'js-cookie';

const TOKEN_KEY = 'cp_token';
const USER_KEY = 'cp_user';

export const saveToken = (token) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'lax' });
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) || Cookies.get(TOKEN_KEY) || null;
  }
  return Cookies.get(TOKEN_KEY) || null;
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

export const saveUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode JWT payload (without verification — server handles that)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    return !isExpired;
  } catch {
    return false;
  }
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
};
