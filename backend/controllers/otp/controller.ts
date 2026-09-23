import { otpService } from '@/backend/services/otp/services';
import { getDefaultAdminEmail } from '@/lib/auth-utils';
import { REGISTRATION_DOMAIN_ERROR, isAllowedRegistrationEmail } from '@/lib/allowed-email-domains';

interface SendOtpInput {
  email: string;
  type: 'login' | 'register';
  password?: string; // Optional password for login verification
}

interface VerifyOtpInput {
  email: string;
  otp: string;
  type: 'login' | 'register';
}

/**
 * Validate email format (allows default admin email from environment)
 */
function isValidEmailForOtp(email: string): boolean {
  // Allow default admin email from environment (even if it has invalid domains like .local)
  const defaultAdminEmail = getDefaultAdminEmail().toLowerCase().trim();
  if (email.toLowerCase().trim() === defaultAdminEmail) {
    return true;
  }
  
  // Standard email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // In setups without SMTP, OTP is bypassed and no email is ever delivered, so
  // otherwise-undeliverable dev domains (e.g. .local) are harmless. Permit them
  // there to keep local/demo accounts usable. Production (ENABLE_SMTP=true)
  // keeps the strict check below.
  if (process.env.ENABLE_SMTP !== 'true') {
    return true;
  }

  // Check for invalid domains like .local, .invalid, .test, .example
  const invalidDomains = ['.local', '.invalid', '.test', '.example', '.localhost'];
  const lowerEmail = email.toLowerCase();
  for (const domain of invalidDomains) {
    if (lowerEmail.endsWith(domain)) {
      return false;
    }
  }
  
  return true;
}

export class OtpController {
  /**
   * POST /api/auth/otp/send - Send OTP to email
   */
  async sendOtp(request: Request) {
    try {
      const body = (await request.json()) as SendOtpInput;
      const { email, type } = body;

      if (!email || !type) {
        return {
          success: false,
          message: 'Укажите email и тип',
        };
      }

      // Validate email format (allows default admin email from environment)
      if (!isValidEmailForOtp(email)) {
        return {
          success: false,
          message: 'Некорректный email: адреса в доменах .local, .invalid, .test, .example не допускаются (кроме стандартного администратора).',
        };
      }

      if (!['login', 'register'].includes(type)) {
        return {
          success: false,
          message: 'Неверный тип: допустимы login или register',
        };
      }

      // Registration is limited to corporate domains; reject before sending a code
      if (type === 'register' && !isAllowedRegistrationEmail(email)) {
        return {
          success: false,
          message: REGISTRATION_DOMAIN_ERROR,
        };
      }

      const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

      const result = await otpService.sendOtp({
        email: email.toLowerCase().trim(),
        type,
        appUrl,
        password: body.password, // Pass password for login verification
      });

      return result;
    } catch (error) {
      console.error('Error in sendOtp controller:', error);
      return {
        success: false,
        message: 'Не удалось отправить код. Попробуйте ещё раз.',
      };
    }
  }

  /**
   * POST /api/auth/otp/verify - Verify OTP
   */
  async verifyOtp(request: Request) {
    try {
      const body = (await request.json()) as VerifyOtpInput;
      const { email, otp, type } = body;

      if (!email || !otp || !type) {
        return {
          success: false,
          message: 'Укажите email, код и тип',
        };
      }

      // Validate email format (allows default admin email from environment)
      if (!isValidEmailForOtp(email)) {
        return {
          success: false,
          message: 'Некорректный email: адреса в доменах .local, .invalid, .test, .example не допускаются (кроме стандартного администратора).',
        };
      }

      if (!['login', 'register'].includes(type)) {
        return {
          success: false,
          message: 'Неверный тип: допустимы login или register',
        };
      }

      if (!/^\d{6}$/.test(otp)) {
        return {
          success: false,
          message: 'Код должен состоять из 6 цифр.',
        };
      }

      const result = await otpService.verifyOtp({
        email: email.toLowerCase().trim(),
        otp,
        type,
      });

      return result;
    } catch (error) {
      console.error('Error in verifyOtp controller:', error);
      return {
        success: false,
        message: 'Не удалось проверить код. Попробуйте ещё раз.',
      };
    }
  }

  /**
   * POST /api/auth/otp/resend - Resend OTP to email
   */
  async resendOtp(request: Request) {
    try {
      const body = (await request.json()) as SendOtpInput;
      const { email, type } = body;

      if (!email || !type) {
        return {
          success: false,
          message: 'Укажите email и тип',
        };
      }

      // Validate email format (allows default admin email from environment)
      if (!isValidEmailForOtp(email)) {
        return {
          success: false,
          message: 'Некорректный email: адреса в доменах .local, .invalid, .test, .example не допускаются (кроме стандартного администратора).',
        };
      }

      if (!['login', 'register'].includes(type)) {
        return {
          success: false,
          message: 'Неверный тип: допустимы login или register',
        };
      }

      const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

      const result = await otpService.sendOtp({
        email: email.toLowerCase().trim(),
        type,
        appUrl,
      });

      return result;
    } catch (error) {
      console.error('Error in resendOtp controller:', error);
      return {
        success: false,
        message: 'Не удалось отправить код повторно. Попробуйте ещё раз.',
      };
    }
  }
}

export const otpController = new OtpController();
