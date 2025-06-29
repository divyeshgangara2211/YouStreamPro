import Joi from 'joi';

export const userValidationSchema = Joi.object(
    {
        fullName: Joi.string().trim().min(3).max(50).required(),
        email: Joi.string().trim().email().required().lowercase()
            .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
            .required()
            .messages({
                "string.pattern.base": "Email must be a valid format like example@domain.com",
            }), 
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(6).max(100)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')) // secure password
            .required()
            .messages({
                "string.pattern.base": "Password must include uppercase, lowercase letters, and numbers.",
            }),
    }
);