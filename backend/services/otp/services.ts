import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email-service';
import { isEmailServiceAvailable } from '@/lib/email-service';
import * as bcrypt from 'bcryptjs';

interface SendOtpInput {
  email: string;
  type: 'login' | 'register';
  appUrl: string;
  password?: string; // Optional password for login verification
}

interface VerifyOtpInput {
  email: string;
  otp: string;
  type: 'login' | 'register';
}

export class OtpService {
  /**
   * Generate a random 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email
   * Creates a new OTP record and sends email
   */
  async sendOtp(input: SendOtpInput): Promise<{ success: boolean; message: string; smtpDisabled?: boolean }> {
    const { email, type, appUrl } = input;

    // For login type, check if user exists and password is correct before sending OTP
    if (type === 'login') {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return {
          success: false,
          message: 'Неверный email или пароль',
        };
      }

      // Check if user is deleted
      if (user.deletedAt) {
        return {
          success: false,
          message: 'Аккаунт удалён. Обратитесь к администратору.',
        };
      }

      // Verify password if provided
      if (input.password) {
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Неверный email или пароль',
          };
        }
      }
    }

    // For register type, check if user already exists before sending OTP
    if (type === 'register') {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Пользователь с таким email уже есть',
        };
      }
    }

    // Check if email service is available
    const isAvailable = await isEmailServiceAvailable();
    if (!isAvailable) {
      // When SMTP is disabled, silently skip OTP and return success
      // This allows authentication to proceed without email verification
      console.log('[OTP] SMTP disabled - skipping OTP verification');
      return {
        success: true,
        message: 'Вход выполняется без подтверждения по почте.',
        smtpDisabled: true,
      };
    }

    try {
      // Clean up expired OTPs for this email
      await this.cleanupExpiredOtps(email);

      // Check if there's a recent OTP (rate limiting - 1 OTP per minute)
      const recentOtp = await prisma.otpVerification.findFirst({
        where: {
          email: email.toLowerCase(),
          type,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // Last 1 minute
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (recentOtp) {
        return {
          success: false,
          message: 'Новый код можно запросить через минуту.',
        };
      }

      // Generate new OTP
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await prisma.otpVerification.create({
        data: {
          email: email.toLowerCase(),
          otp,
          type,
          expiresAt,
        },
      });

      // Send OTP email
      const emailSent = await sendOtpEmail({
        email: email.toLowerCase(),
        otp,
        type,
        appUrl,
      });

      if (!emailSent) {
        return {
          success: false,
          message: 'Не удалось отправить письмо с кодом. Попробуйте ещё раз.',
        };
      }

      return {
        success: true,
        message: `Код отправлен на ${email}`,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Не удалось отправить код. Попробуйте ещё раз.',
      };
    }
  }

  /**
   * Verify OTP
   * Checks if OTP is valid and not expired
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; message: string }> {
    const { email, otp, type } = input;

    // When SMTP is disabled, auto-verify to allow authentication
    const isAvailable = await isEmailServiceAvailable();
    if (!isAvailable) {
      console.log('[OTP] SMTP disabled - auto-verifying OTP');
      return {
        success: true,
        message: 'Подтверждение выполнено',
      };
    }

    try {
      // Find the most recent unverified OTP for this email
      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          email: email.toLowerCase(),
          type,
          verified: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'Код не найден. Запросите новый.',
        };
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        return {
          success: false,
          message: 'Срок действия кода истёк. Запросите новый.',
        };
      }

      // Check if too many attempts (max 5)
      if (otpRecord.attempts >= 5) {
        return {
          success: false,
          message: 'Слишком много попыток. Запросите новый код.',
        };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 },
        });

        const remainingAttempts = 5 - (otpRecord.attempts + 1);
        return {
          success: false,
          message: `Неверный код. Осталось попыток: ${remainingAttempts}.`,
        };
      }

      // Mark OTP as verified
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      return {
        success: true,
        message: 'Код подтверждён',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Не удалось проверить код. Попробуйте ещё раз.',
      };
    }
  }

  /**
   * Check if email has been verified with OTP
   */
  async isEmailVerified(email: string, type: 'login' | 'register'): Promise<boolean> {
    // When SMTP is disabled, consider all emails as verified
    const isAvailable = await isEmailServiceAvailable();
    if (!isAvailable) {
      console.log('[OTP] SMTP disabled - auto-verifying email');
      return true;
    }

    try {
      const verifiedOtp = await prisma.otpVerification.findFirst({
        where: {
          email: email.toLowerCase(),
          type,
          verified: true,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      return !!verifiedOtp;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  /**
   * Clean up expired OTPs for an email
   */
  private async cleanupExpiredOtps(email: string): Promise<void> {
    try {
      await prisma.otpVerification.deleteMany({
        where: {
          email: email.toLowerCase(),
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired
            { verified: true }, // Already verified
          ],
        },
      });
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Delete all OTPs for an email (used after successful login/register)
   */
  async clearEmailOtps(email: string): Promise<void> {
    try {
      await prisma.otpVerification.deleteMany({
        where: { email: email.toLowerCase() },
      });
    } catch (error) {
      console.error('Error clearing email OTPs:', error);
    }
  }
}

export const otpService = new OtpService();
