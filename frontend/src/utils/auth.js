const TOKEN_KEY = "token";

const base64UrlToBase64 = (value) =>
  value.replace(/-/g, "+").replace(/_/g, "/");

const parseJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const json = atob(base64UrlToBase64(payload));
    return JSON.parse(json);
  } catch (_error) {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const hasValidToken = () => {
  const token = getStoredToken();

  if (!token) {
    return false;
  }

  const payload = parseJwt(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now();
};
