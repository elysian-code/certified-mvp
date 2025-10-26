import { createTransport } from 'nodemailer'
import { formatDate } from "@/lib/utils"

async function createVerifiedTransporter() {
  // Log email configuration for debugging
  console.log('Creating email transporter with config:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER ? '****' : 'not set',
    pass: process.env.EMAIL_PASS ? '****' : 'not set'
  });

  // More secure Gmail configuration
  const transporter = createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use app-specific password
    },
    tls: {
      rejectUnauthorized: true
    }
  })

  try {
    await transporter.verify()
    return transporter
  } catch (error) {
    console.error('Email transporter verification failed:', error)
    throw new Error('Failed to verify email configuration. Please check your Gmail settings.')
  }
}

interface SendInviteEmailParams {
  email: string
  fullName: string
  organizationName: string
  programName: string
  inviteUrl: string
  expiresAt: string
}

export async function sendInviteEmail({
  email,
  fullName,
  organizationName,
  programName,
  inviteUrl,
  expiresAt,
}: SendInviteEmailParams) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to join ${organizationName}</h2>
      
      <p>Hi ${fullName},</p>
      
      <p>You've been invited to join ${organizationName} and enroll in the following certification program:</p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 8px 0;">${programName}</h3>
      </div>
      
      <p>Click the button below to create your account and start your certification journey:</p>
      
      <a href="${inviteUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Accept Invitation
      </a>
      
      <p style="color: #6b7280; font-size: 14px;">
        This invitation will expire on ${formatDate(expiresAt)}
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `

  try {
    console.log('Attempting to send email to:', email);
    
    // Check required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is incomplete. Please check EMAIL_USER and EMAIL_PASS environment variables.');
    }

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    if (!fromEmail) {
      throw new Error('EMAIL_FROM or EMAIL_USER must be set');
    }
    
    const transporter = await createVerifiedTransporter();
    
    // Attempt to send the email
    console.log('Sending email from:', fromEmail, 'to:', email);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Join ${organizationName} organization and start your certification program`,
      html,
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
    throw new Error('Failed to send invitation email. Please check your email configuration.');
  }
}