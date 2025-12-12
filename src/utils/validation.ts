export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    return password.length >= 6;
};

export const validateRequiredField = (value: string): boolean => {
    return value.trim() !== '';
};

export const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    return usernameRegex.test(username);
};