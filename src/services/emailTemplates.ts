import { EmailType } from '../types/email';

export interface EmailTemplateData {
  firstName: string;
  referenceCode?: string;
  passId?: string;
  passUrl?: string;
  continuationUrl?: string;
  applicationUrl?: string;
  paymentUrl?: string;
  supportEmail?: string;
  reason?: string;
  celebrityName?: string;
  eventName?: string;
}

export function generateEmailHtml(type: EmailType, data: EmailTemplateData): { subject: string; html: string; text: string } {
  const name = data.firstName || 'Guest';
  const brandGold = '#D4AF37';
  const brandDark = '#080A0F';
  const cardBg = '#10141F';

  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #F8FAFC;
    background-color: ${brandDark};
    margin: 0;
    padding: 32px 16px;
    line-height: 1.6;
  `;

  const containerStyle = `
    max-width: 540px;
    margin: 0 auto;
    background-color: ${cardBg};
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 36px 28px;
  `;

  const buttonStyle = `
    display: inline-block;
    background-color: #FFFFFF;
    color: #080A0F;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 12px;
    margin: 20px 0;
  `;

  const footerStyle = `
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 12px;
    color: #94A3B8;
  `;

  switch (type) {
    case 'APPLICATION_RECEIVED': {
      const subject = 'Your VIP Meet & Greet application';
      const ref = data.referenceCode || 'PENDING';
      const appUrl = data.applicationUrl || '#';
      const text = `Hi ${name},\n\nWe received your VIP Meet & Greet application.\n\nYour application number is:\n${ref}\n\nStatus:\nUnder review\n\nManagement will review your application and let you know what happens next.\n\nView Application: ${appUrl}\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${brandGold}; font-weight: 700; margin-bottom: 12px;">VIP Meet & Greet</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">We received your application</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">We received your VIP Meet & Greet application.</p>
            
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">Your application number</div>
              <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; font-family: monospace;">${ref}</div>
              <div style="margin-top: 12px; font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">Status</div>
              <div style="font-size: 14px; font-weight: 600; color: ${brandGold};">Under review</div>
            </div>

            <p style="margin: 0 0 20px 0; font-size: 14px; color: #94A3B8;">Management will review your application and let you know what happens next.</p>
            
            ${appUrl !== '#' ? `<a href="${appUrl}" style="${buttonStyle}">View Application</a>` : ''}

            <p style="margin: 16px 0 0 0; font-size: 14px; color: #CBD5E1;">Thank you.</p>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'APPLICATION_APPROVED': {
      const subject = 'Your VIP Meet & Greet application was approved';
      const ref = data.referenceCode || 'APPROVED';
      const link = data.continuationUrl || '#';
      const text = `Hi ${name},\n\nGood news — your application has been approved.\n\nYour application number is:\n${ref}\n\nThere is one more step to complete your request.\n\nContinue: ${link}\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #34D399; font-weight: 700; margin-bottom: 12px;">Approved</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Your application is approved</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Good news — your application has been approved.</p>

            <div style="background-color: rgba(52, 211, 153, 0.05); border: 1px solid rgba(52, 211, 153, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">Your application number</div>
              <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; font-family: monospace;">${ref}</div>
            </div>

            <p style="margin: 0 0 20px 0; font-size: 15px; color: #E2E8F0;">There is one more step to complete your request.</p>

            <a href="${link}" style="${buttonStyle}">Continue</a>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'INFORMATION_REQUESTED': {
      const subject = 'More information is needed';
      const appUrl = data.applicationUrl || data.continuationUrl || '#';
      const text = `Hi ${name},\n\nManagement needs a little more information before your application can move forward.\n\nView Application: ${appUrl}\n\nPlease follow the instructions on the page.\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #818CF8; font-weight: 700; margin-bottom: 12px;">Notice</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">More information is needed</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 20px 0; font-size: 15px; color: #CBD5E1;">Management needs a little more information before your application can move forward.</p>

            ${data.reason ? `
              <div style="background-color: rgba(129, 140, 248, 0.08); border: 1px solid rgba(129, 140, 248, 0.2); border-radius: 14px; padding: 16px; margin: 16px 0; font-size: 14px; color: #E0E7FF;">
                "${data.reason}"
              </div>
            ` : ''}

            <a href="${appUrl}" style="${buttonStyle}">View Application</a>

            <p style="margin: 16px 0 0 0; font-size: 14px; color: #94A3B8;">Please follow the instructions on the page.</p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: #CBD5E1;">Thank you.</p>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'PAYMENT_SUBMITTED': {
      const subject = 'Payment received for review';
      const text = `Hi ${name},\n\nWe received your payment details.\n\nManagement is now checking the information you submitted.\n\nYour status is:\nPayment under review\n\nWe will let you know when there is an update.\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${brandGold}; font-weight: 700; margin-bottom: 12px;">Payment Status</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Payment received for review</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">We received your payment details.</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Management is now checking the information you submitted.</p>

            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">Your status</div>
              <div style="font-size: 16px; font-weight: 700; color: ${brandGold};">Payment under review</div>
            </div>

            <p style="margin: 0 0 0 0; font-size: 14px; color: #94A3B8;">We will let you know when there is an update.</p>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'PAYMENT_CONFIRMED': {
      const subject = 'Your payment has been confirmed';
      const ref = data.referenceCode || '';
      const text = `Hi ${name},\n\nYour payment has been confirmed by management.\n\nYour VIP Pass is now being prepared.\n\nWe will send you another email when it is ready.\n\nYour application number:\n${ref}\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #34D399; font-weight: 700; margin-bottom: 12px;">Payment Confirmed</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Your payment is confirmed</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Your payment has been confirmed by management.</p>

            <div style="background-color: rgba(52, 211, 153, 0.05); border: 1px solid rgba(52, 211, 153, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 15px; font-weight: 600; color: #34D399;">Your VIP Pass is now being prepared.</div>
              ${ref ? `<div style="margin-top: 10px; font-size: 12px; color: #94A3B8;">Application number: <span style="font-family: monospace; font-weight: 700; color: #FFFFFF;">${ref}</span></div>` : ''}
            </div>

            <p style="margin: 0 0 0 0; font-size: 14px; color: #CBD5E1;">We will send you another email when it is ready.</p>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'PAYMENT_REJECTED': {
      const subject = 'Your payment needs attention';
      const reason = data.reason || 'We could not verify the transaction reference provided.';
      const payUrl = data.paymentUrl || data.continuationUrl || '#';
      const text = `Hi ${name},\n\nWe could not confirm the payment information you submitted.\n\nReason:\n${reason}\n\nPlease review the information and submit it again if needed.\n\nReview Payment: ${payUrl}\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #FB7185; font-weight: 700; margin-bottom: 12px;">Needs Attention</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Your payment needs attention</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">We could not confirm the payment information you submitted.</p>

            <div style="background-color: rgba(251, 113, 133, 0.08); border: 1px solid rgba(251, 113, 133, 0.2); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #FB7185; margin-bottom: 4px; font-weight: 600;">Reason</div>
              <div style="font-size: 14px; color: #FFFFFF;">${reason}</div>
            </div>

            <p style="margin: 0 0 20px 0; font-size: 14px; color: #94A3B8;">Please review the information and submit it again if needed.</p>

            <a href="${payUrl}" style="${buttonStyle}">Review Payment</a>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'VIP_PASS_READY': {
      const subject = 'Your VIP Pass is ready';
      const passId = data.passId || 'VIP-PASS';
      const passUrl = data.passUrl || '#';
      const text = `Hi ${name},\n\nYour VIP Meet & Greet Pass is ready.\n\nYour pass number is:\n${passId}\n\nView VIP Pass: ${passUrl}\n\nYou can open the pass and download it to your phone.\n\nKeep your pass safe and bring it with you when required.\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${brandGold}; font-weight: 700; margin-bottom: 12px;">VIP Pass Ready</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Your VIP Pass is ready</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Your VIP Meet & Greet Pass is ready.</p>

            <div style="background-color: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 14px; padding: 18px; margin: 20px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">Your pass number</div>
              <div style="font-size: 22px; font-weight: 700; color: #FFFFFF; font-family: monospace;">${passId}</div>
            </div>

            <a href="${passUrl}" style="${buttonStyle}">View VIP Pass</a>

            <p style="margin: 16px 0 8px 0; font-size: 14px; color: #CBD5E1;">You can open the pass and download it to your phone.</p>
            <p style="margin: 0 0 0 0; font-size: 14px; color: #94A3B8;">Keep your pass safe and bring it with you when required.</p>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    case 'VIP_PASS_REVOKED': {
      const subject = 'Update to your VIP Pass';
      const supportEmail = data.supportEmail || 'management.meet.greet@gmail.com';
      const contactUrl = `mailto:${supportEmail}?subject=Inquiry regarding VIP Pass ${data.passId || ''}`;
      const text = `Hi ${name},\n\nYour VIP Pass is no longer valid.\n\nIf you believe this is a mistake, please contact management.\n\nContact Management: ${supportEmail}\n\nThank you.`;
      const html = `
        <div style="${baseStyle}">
          <div style="${containerStyle}">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #FB7185; font-weight: 700; margin-bottom: 12px;">Pass Update</div>
            <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #FFFFFF; font-weight: 700;">Update to your VIP Pass</h2>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Hi ${name},</p>
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #CBD5E1;">Your VIP Pass is no longer valid.</p>

            <p style="margin: 16px 0 20px 0; font-size: 14px; color: #94A3B8;">If you believe this is a mistake, please contact management.</p>

            <a href="${contactUrl}" style="${buttonStyle}">Contact Management</a>

            <div style="${footerStyle}">
              <div>VIP Meet & Greet Management</div>
            </div>
          </div>
        </div>
      `;
      return { subject, html, text };
    }

    default: {
      return {
        subject: 'VIP Meet & Greet Update',
        html: `<p>Hi ${name},<br>There is an update on your VIP request.</p>`,
        text: `Hi ${name},\nThere is an update on your VIP request.`,
      };
    }
  }
}
