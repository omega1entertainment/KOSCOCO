import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

// Get custom from email from environment, default to Resend test domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'KOSCOCO <onboarding@resend.dev>';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // OTP valid for 10 minutes
  return expiry;
}

interface SendOTPEmailParams {
  email: string;
  firstName: string;
  otp: string;
}

export async function sendOTPEmail({
  email,
  firstName,
  otp,
}: SendOTPEmailParams): Promise<void> {
  try {
    // In development/test mode, log OTP to console for testing
    console.log(`\n📧 OTP for ${email}: ${otp} (expires in 10 minutes)\n`);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} - Your KOSCOCO Verification Code`,
      replyTo: 'support@kozzii.africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification Code</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DC2626; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">KOSCOCO</h1>
              <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Kozzii Short Content Competition</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
              <h2 style="color: #DC2626; margin-top: 0;">Hi ${firstName}!</h2>
              
              <p>Your verification code for KOSCOCO registration is:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #fff; border: 2px solid #DC2626; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #DC2626;">
                    ${otp}
                  </span>
                </div>
              </div>
              
              <p style="text-align: center; font-size: 14px; color: #666;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
              <p>© 2024 KOSCOCO - Kozzii Short Content Competition</p>
              <p>Cameroon</p>
            </div>
          </body>
        </html>
      `,
    });
    
    // Log result but don't throw error in test mode
    if (result.error) {
      console.log('Resend API response:', { 
        to: email, 
        emailId: (result.data as any)?.id,
        error: result.error 
      });
      // In test mode, we already logged OTP above, so don't fail
      if (!(result.error as any).message?.includes('testing emails')) {
        throw new Error('Failed to send verification code. Please try again later.');
      }
    } else {
      console.log('OTP email sent via Resend:', { 
        to: email, 
        emailId: (result.data as any)?.id
      });
    }
  } catch (error) {
    // Only throw if it's not a test mode error
    if (error instanceof Error && error.message.includes('testing emails')) {
      console.log('Resend is in test mode - OTP logged to console above');
      return;
    }
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send verification code. Please try again later.');
  }
}

export function getVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // Token valid for 24 hours
  return expiry;
}

interface SendVerificationEmailParams {
  email: string;
  firstName: string;
  verificationToken: string;
}

export async function sendVerificationEmail({
  email,
  firstName,
  verificationToken,
}: SendVerificationEmailParams): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify Your Email - KOSCOCO',
      replyTo: 'support@kozzii.africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DC2626; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">KOSCOCO</h1>
              <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Kozzii Short Content Competition</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
              <h2 style="color: #DC2626; margin-top: 0;">Welcome to KOSCOCO, ${firstName}!</h2>
              
              <p>Thank you for signing up for the Kozzii Short Content Competition. To complete your registration and start competing, please verify your email address.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; word-break: break-all; font-size: 14px;">
                ${verificationUrl}
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This verification link will expire in 24 hours. If you didn't create an account with KOSCOCO, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
              <p>© 2024 KOSCOCO - Kozzii Short Content Competition</p>
              <p>Cameroon</p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('Verification email sent successfully:', { 
      to: email, 
      emailId: result.data?.id,
      error: result.error 
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email. Please try again later.');
  }
}

interface SendVerificationReminderParams {
  email: string;
  firstName: string;
  verificationToken: string;
}

export async function sendVerificationReminder({
  email,
  firstName,
  verificationToken,
}: SendVerificationReminderParams): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reminder: Verify Your Email - KOSCOCO',
      replyTo: 'support@kozzii.africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DC2626; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">KOSCOCO</h1>
              <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Kozzii Short Content Competition</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
              <h2 style="color: #DC2626; margin-top: 0;">Hi ${firstName},</h2>
              
              <p>We noticed you haven't verified your email address yet. Verifying your email is required to participate in the competition and access all features.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; word-break: break-all; font-size: 14px;">
                ${verificationUrl}
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This verification link will expire in 24 hours. If you didn't create an account with KOSCOCO, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
              <p>© 2024 KOSCOCO - Kozzii Short Content Competition</p>
              <p>Cameroon</p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('Verification reminder sent successfully:', { 
      to: email, 
      emailId: result.data?.id,
      error: result.error 
    });
  } catch (error) {
    console.error('Failed to send verification reminder:', error);
    throw new Error('Failed to send verification reminder. Please try again later.');
  }
}

interface SendPasswordResetEmailParams {
  email: string;
  firstName: string;
  resetToken: string;
}

export async function sendPasswordResetEmail({
  email,
  firstName,
  resetToken,
}: SendPasswordResetEmailParams): Promise<void> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your KOSCOCO Password',
      replyTo: 'support@kozzii.africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #DC2626; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">KOSCOCO</h1>
              <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Kozzii Short Content Competition</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
              <h2 style="color: #DC2626; margin-top: 0;">Hi ${firstName}!</h2>
              
              <p>We received a request to reset your KOSCOCO password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 4px; word-break: break-all; font-size: 14px;">
                ${resetUrl}
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This password reset link will expire in <strong>1 hour</strong>. If you didn't request this reset, you can safely ignore this email.
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Need help? Contact us at <a href="mailto:support@kozzii.africa" style="color: #DC2626; text-decoration: none;">support@kozzii.africa</a>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
              <p>© 2024 KOSCOCO - Kozzii Short Content Competition</p>
              <p>Cameroon</p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('Password reset email sent successfully:', { 
      to: email, 
      emailId: result.data?.id,
      error: result.error 
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
}

interface SendNewsletterWelcomeEmailParams {
  email: string;
  firstName?: string;
}

export async function sendNewsletterWelcomeEmail({
  email,
  firstName,
}: SendNewsletterWelcomeEmailParams): Promise<void> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to KOSCOCO Newsletter! 🎬',
      replyTo: 'support@kozzii.africa',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to KOSCOCO Newsletter</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
            <!-- Header with logo background -->
            <div style="background: linear-gradient(135deg, #DC2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 10px; display: inline-block;">
                <img src="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=200&h=200&fit=crop" alt="KOSCOCO" style="width: 100px; height: 100px; border-radius: 10px; object-fit: cover;">
              </div>
              <h1 style="color: white; margin: 20px 0 5px 0; font-size: 32px; font-weight: 700;">KOSCOCO</h1>
              <p style="color: #fff9e6; margin: 0; font-size: 16px; font-weight: 500;">Kozzii Short Content Competition</p>
            </div>
            
            <!-- Main content -->
            <div style="background-color: white; padding: 40px; border-top: 4px solid #DC2626;">
              <h2 style="color: #DC2626; margin: 0 0 20px 0; font-size: 24px;">Welcome${firstName ? `, ${firstName}` : ''}! 👋</h2>
              
              <p style="margin: 0 0 15px 0; font-size: 16px;">Thank you for subscribing to the KOSCOCO Newsletter! You're now part of an exciting community of content creators and enthusiasts.</p>
              
              <p style="margin: 0 0 25px 0; font-size: 16px;">Here's what you can expect from our newsletter:</p>
              
              <!-- Benefits section -->
              <div style="background-color: #f9fafb; border-left: 4px solid #DC2626; padding: 20px; margin: 0 0 25px 0; border-radius: 4px;">
                <ul style="margin: 0; padding: 0 0 0 20px; list-style: none;">
                  <li style="margin: 0 0 12px 0; padding-left: 25px; position: relative; font-size: 15px;">
                    <span style="position: absolute; left: 0; color: #DC2626; font-weight: bold;">✓</span>
                    <strong>Competition Updates:</strong> Latest news about ongoing competitions and phases
                  </li>
                  <li style="margin: 0 0 12px 0; padding-left: 25px; position: relative; font-size: 15px;">
                    <span style="position: absolute; left: 0; color: #DC2626; font-weight: bold;">✓</span>
                    <strong>Creator Tips:</strong> Valuable insights to improve your content creation skills
                  </li>
                  <li style="margin: 0 0 12px 0; padding-left: 25px; position: relative; font-size: 15px;">
                    <span style="position: absolute; left: 0; color: #DC2626; font-weight: bold;">✓</span>
                    <strong>Exclusive Opportunities:</strong> Special contests and prize announcements
                  </li>
                  <li style="margin: 0 0 12px 0; padding-left: 25px; position: relative; font-size: 15px;">
                    <span style="position: absolute; left: 0; color: #DC2626; font-weight: bold;">✓</span>
                    <strong>Community Highlights:</strong> Spotlights on outstanding creators
                  </li>
                  <li style="margin: 0; padding-left: 25px; position: relative; font-size: 15px;">
                    <span style="position: absolute; left: 0; color: #DC2626; font-weight: bold;">✓</span>
                    <strong>Insider News:</strong> Be the first to know about platform updates
                  </li>
                </ul>
              </div>
              
              <p style="margin: 0 0 25px 0; font-size: 16px;">Ready to showcase your talent? Visit KOSCOCO and start competing today:</p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://koscoco.replit.dev" 
                   style="background-color: #DC2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Explore KOSCOCO
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">
                Questions or feedback? We'd love to hear from you! Reply to this email or contact us at <a href="mailto:support@kozzii.africa" style="color: #DC2626; text-decoration: none;">support@kozzii.africa</a>
              </p>
              
              <p style="margin: 0; font-size: 14px; color: #999;">
                <strong>Follow us on social media:</strong> Stay updated with the latest competition news and creator spotlights
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center; font-size: 12px;">
              <p style="margin: 0 0 10px 0;">
                © 2024 KOSCOCO - Kozzii Short Content Competition
              </p>
              <p style="margin: 0 0 15px 0;">
                Cameroon 🇨🇲
              </p>
              <p style="margin: 0 0 10px 0;">
                <a href="https://koscoco.replit.dev/unsubscribe" style="color: #DC2626; text-decoration: none;">Unsubscribe from newsletter</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">
                You're receiving this email because you subscribed to our newsletter
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('Newsletter welcome email sent successfully:', { 
      to: email, 
      emailId: result.data?.id,
      error: result.error 
    });
  } catch (error) {
    console.error('Failed to send newsletter welcome email:', error);
    // Don't throw error here - newsletter signup should succeed even if email fails
    console.warn('Newsletter welcome email failed but subscription was successful');
  }
}
