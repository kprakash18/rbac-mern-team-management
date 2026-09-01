export function isValidEmail(email){
    if(!email || typeof email !== "string") return false ;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLoginInput(body = {}){
    const errors = [];
    const {email, password} = body ;

    if(!email || typeof email !== "string" || !email.trim()){
        errors.push("Email is required.") ;
    } else if (!isValidEmail(email)) {
        errors.push("Please provide a valid email address.");
    }

    if(!password || typeof password !== "string" || !password.trim()){
        errors.push("Password is required.") ;
    }

    return{
        isValid : errors.length === 0,
        errors,
    };
}

export function validatePasswordChangeInput(body = {}) {
    const errors = [];
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string" || !currentPassword.trim()) {
        errors.push("Current password is required.");
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        errors.push("New password must be at least 8 characters long.");
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push("New password must be different from current password.");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}