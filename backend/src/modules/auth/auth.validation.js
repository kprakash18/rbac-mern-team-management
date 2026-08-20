export function isValidEmail(email){
    if(!email || typeof email !== "string") return false ;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateLoginInput(body = {}){
    const errors = [];
    const {email, password} = body ;

    if(!email || typeof email !== "string" || !email.trim()){
        errors.push("please provide a valid email address") ;
    }

    if(!password || typeof password !== "string" || !password.trim()){
        errors.push("password is required") ;
    }

    return{
        isValid : errors.length === 0,
        errors,
    };
}