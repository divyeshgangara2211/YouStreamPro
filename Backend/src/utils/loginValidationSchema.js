import Joi from 'joi';

export const loginValidationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base": "Email must be a valid format like example@domain.com",
    }),
  password: Joi.string().min(6).max(100).required(),

}).xor("username", "email"); // Ensure at least one (not both) is required
// / Requires either username or email