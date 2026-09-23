import { z } from 'zod';
import { getDefaultAdminEmail } from '@/lib/auth-utils';
import { REGISTRATION_DOMAIN_ERROR, isAllowedRegistrationEmail } from '@/lib/allowed-email-domains';

/**
 * Custom email validation that allows default admin email from environment
 */
const emailValidation = z
  .string()
  .toLowerCase()
  .trim()
  .refine(
    (email) => {
      // Allow default admin email from environment (even if it has invalid domains like .local)
      const defaultAdminEmail = getDefaultAdminEmail().toLowerCase().trim();
      if (email === defaultAdminEmail) {
        return true;
      }
      
      // Standard email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return false;
      }
      
      // Check for invalid domains like .local, .invalid, .test, .example
      const invalidDomains = ['.local', '.invalid', '.test', '.example', '.localhost'];
      for (const domain of invalidDomains) {
        if (email.endsWith(domain)) {
          return false;
        }
      }
      
      return true;
    },
    {
      message: 'Некорректный email: адреса в доменах .local, .invalid, .test, .example не допускаются (кроме стандартного администратора).',
    }
  );

/**
 * User Registration Schema
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не короче 2 символов')
    .max(255, 'Имя должно быть не длиннее 255 символов')
    .trim(),
  // Only corporate domains may self-register
  email: emailValidation.refine(isAllowedRegistrationEmail, { message: REGISTRATION_DOMAIN_ERROR }),
  password: z
    .string()
    .min(8, 'Пароль должен быть не короче 8 символов')
    .max(100, 'Пароль должен быть не длиннее 100 символов'),
});

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Введите текущий пароль'),
  newPassword: z
    .string()
    .min(8, 'Новый пароль должен быть не короче 8 символов')
    .max(100, 'Новый пароль должен быть не длиннее 100 символов'),
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailValidation,
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Пароль должен быть не короче 8 символов')
    .max(100, 'Пароль должен быть не длиннее 100 символов'),
});
