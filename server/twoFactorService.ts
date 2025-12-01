import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'KOSCOCO';

export const twoFactorService = {
  generateSecret(): string {
    return authenticator.generateSecret();
  },

  generateOtpauthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, APP_NAME, secret);
  },

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl);
  },

  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  },

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
  },

  hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => 
      crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
    );
  },

  verifyBackupCode(inputCode: string, hashedCodes: string[]): { valid: boolean; index: number } {
    const normalizedInput = inputCode.replace('-', '').toUpperCase();
    const inputHash = crypto.createHash('sha256').update(normalizedInput).digest('hex');
    
    const index = hashedCodes.findIndex(hash => hash === inputHash);
    return { valid: index !== -1, index };
  },

  async setupTwoFactor(email: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    const secret = this.generateSecret();
    const otpauthUrl = this.generateOtpauthUrl(email, secret);
    const qrCodeDataUrl = await this.generateQRCode(otpauthUrl);

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    };
  },
};
