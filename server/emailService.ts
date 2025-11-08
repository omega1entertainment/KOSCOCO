import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
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
      from: 'KOSCOCO <onboarding@resend.dev>',
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
      from: 'KOSCOCO <onboarding@resend.dev>',
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
