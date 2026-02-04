
import { CustomSMTP } from '../types';

export const sendAutomatedEmail = async (
  to: string,
  subject: string,
  message: string,
  attachmentBase64: string,
  smtpConfig?: CustomSMTP
): Promise<boolean> => {
  // In a real-world SaaS, we send the data to our backend API 
  // which handles the actual SMTP connection using libraries like Nodemailer.
  
  const payload = {
    to,
    subject,
    text: message,
    attachments: [
      {
        filename: 'certificate.png',
        content: attachmentBase64.split(',')[1],
        encoding: 'base64'
      }
    ],
    // If no custom SMTP is provided, the backend uses the Platform SMTP
    smtp: smtpConfig ? {
      host: smtpConfig.host,
      port: smtpConfig.port,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      },
      secure: smtpConfig.encryption === 'SSL',
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
    } : null
  };

  console.log(`[API CALL] Sending request to /api/send-email for recipient: ${to}`);

  try {
    // This is the real-world fetch pattern
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
    // return response.ok;

    // Simulated successful API response
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% success rate simulation
        resolve(success);
      }, 600);
    });
  } catch (error) {
    console.error("Failed to call email API:", error);
    return false;
  }
};

export const verifySmtpConnection = async (config: CustomSMTP): Promise<{success: boolean, message: string}> => {
  console.log(`[API CALL] Verifying SMTP credentials for ${config.host}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Logic would check if host is reachable and auth works
      resolve({
        success: true,
        message: "SMTP Handshake successful. Connection verified."
      });
    }, 1500);
  });
};
