import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM = process.env.EMAIL_FROM ?? 'TradeVerified <onboarding@resend.dev>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  const resend = getResend();

  // No API key configured — log and skip so the app still works in dev.
  if (!resend) {
    console.log(`[email skipped — no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { skipped: false, result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { skipped: false, error };
  }
}

export function jobApplicationEmail(params: {
  companyName: string;
  jobTitle: string;
  applicantName: string;
  applicantEmail: string;
  applicantTrade?: string;
  coverLetter?: string;
  profileUrl: string;
}) {
  const { companyName, jobTitle, applicantName, applicantEmail, applicantTrade, coverLetter, profileUrl } = params;
  return {
    subject: `New application for "${jobTitle}" — ${applicantName}`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <div style="background: #2563eb; color: #fff; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">New Job Application</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p>Hi ${companyName},</p>
          <p><strong>${applicantName}</strong> has applied for your posting <strong>"${jobTitle}"</strong>.</p>
          <table style="width: 100%; font-size: 14px; margin: 16px 0;">
            <tr><td style="padding: 4px 0; color: #64748b;">Applicant</td><td style="padding: 4px 0;">${applicantName}</td></tr>
            <tr><td style="padding: 4px 0; color: #64748b;">Email</td><td style="padding: 4px 0;">${applicantEmail}</td></tr>
            ${applicantTrade ? `<tr><td style="padding: 4px 0; color: #64748b;">Trade</td><td style="padding: 4px 0;">${applicantTrade}</td></tr>` : ''}
          </table>
          ${coverLetter ? `<div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase;">Cover Letter</p><p style="margin: 0; white-space: pre-wrap;">${coverLetter}</p></div>` : ''}
          <a href="${profileUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600;">View Full Profile</a>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">You can also manage applications in your TradeVerified employer dashboard. Reply directly to this email to contact the applicant.</p>
        </div>
      </div>
    `,
  };
}
