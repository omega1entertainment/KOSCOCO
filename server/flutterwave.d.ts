declare module 'flutterwave-node-v3' {
  export default class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    Transaction: {
      verify(params: { id: string | number }): Promise<{
        status: string;
        message: string;
        data: {
          id: number;
          tx_ref: string;
          flw_ref: string;
          device_fingerprint: string;
          amount: number;
          currency: string;
          charged_amount: number;
          app_fee: number;
          merchant_fee: number;
          processor_response: string;
          auth_model: string;
          ip: string;
          narration: string;
          status: string;
          payment_type: string;
          created_at: string;
          account_id: number;
          customer: {
            id: number;
            name: string;
            phone_number: string;
            email: string;
            created_at: string;
          };
          card?: {
            first_6digits: string;
            last_4digits: string;
            issuer: string;
            country: string;
            type: string;
            token: string;
            expiry: string;
          };
        };
      }>;
    };
  }
}
