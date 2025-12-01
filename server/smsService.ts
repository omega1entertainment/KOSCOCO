import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

function validateTwilioConfig(): { valid: boolean; error?: string } {
  if (!accountSid) {
    return { valid: false, error: 'TWILIO_ACCOUNT_SID is not configured' };
  }
  if (!authToken) {
    return { valid: false, error: 'TWILIO_AUTH_TOKEN is not configured' };
  }
  if (!fromNumber) {
    return { valid: false, error: 'TWILIO_FROM_NUMBER is not configured' };
  }
  return { valid: true };
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('237')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 9) {
      cleaned = '+237' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

export interface SendSmsParams {
  to: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface SendSmsResult {
  success: boolean;
  messageSid?: string;
  status?: string;
  error?: string;
}

export async function sendSms({ to, body }: SendSmsParams): Promise<SendSmsResult> {
  const configCheck = validateTwilioConfig();
  if (!configCheck.valid) {
    console.error('Twilio configuration error:', configCheck.error);
    return { success: false, error: configCheck.error };
  }

  try {
    const client = getTwilioClient();
    const formattedTo = formatPhoneNumber(to);
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });

    console.log('SMS sent successfully:', {
      messageSid: message.sid,
      to: formattedTo,
      status: message.status,
    });

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    
    let errorMessage = 'Failed to send SMS';
    if (error.code) {
      errorMessage = `Twilio Error ${error.code}: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function sendBulkSms(
  recipients: { to: string; body: string }[]
): Promise<{ sent: number; failed: number; results: SendSmsResult[] }> {
  const configCheck = validateTwilioConfig();
  if (!configCheck.valid) {
    return {
      sent: 0,
      failed: recipients.length,
      results: recipients.map(() => ({ success: false, error: configCheck.error })),
    };
  }

  const results: SendSmsResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await sendSms(recipient);
    results.push(result);
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, results };
}

export function isTwilioConfigured(): boolean {
  return validateTwilioConfig().valid;
}

export const smsTemplates = {
  registrationConfirmation: (firstName: string, categoryCount: number) => 
    `Hi ${firstName}! Your KOSCOCO registration for ${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'} has been confirmed. Good luck in the competition!`,
  
  paymentConfirmation: (firstName: string, amount: number) =>
    `Hi ${firstName}! Your payment of ${amount} XAF for KOSCOCO has been received. Thank you!`,
  
  videoApproved: (firstName: string, videoTitle: string) =>
    `Great news ${firstName}! Your video "${videoTitle}" has been approved and is now live on KOSCOCO. Good luck!`,
  
  videoRejected: (firstName: string, reason: string) =>
    `Hi ${firstName}, your KOSCOCO video submission was not approved. Reason: ${reason}. Please try again.`,
  
  phaseUpdate: (phaseName: string) =>
    `KOSCOCO Update: ${phaseName} has started! Check your dashboard for details.`,
  
  winnerAnnouncement: (firstName: string, position: string, category: string) =>
    `Congratulations ${firstName}! You've won ${position} place in ${category} at KOSCOCO! Check your email for details.`,
  
  customMessage: (message: string) => message,
};
