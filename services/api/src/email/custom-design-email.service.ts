import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendCustomDesignNotification(
    adminEmail: string,
    userId: string,
    userName: string,
    userEmail: string,
    designTitle: string,
    designId: string,
    imageUrls: string[]
  ) {
    const adminDashboardUrl = `${process.env.ADMIN_URL}/admin/custom-orders?filter=${designId}`;

    const html = `
      <h2>🎨 New Custom Design Request</h2>
      <p>A user has submitted a new custom design request.</p>
      
      <h3>Design Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${designTitle}</li>
        <li><strong>Order ID:</strong> ${designId}</li>
        <li><strong>User:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
      </ul>

      <h3>Images Uploaded: ${imageUrls.length}</h3>
      ${imageUrls.map((url, idx) => `<img src="${url}" alt="Design ${idx + 1}" style="max-width:200px; margin:10px 0;" />`).join('')}

      <h3>Action Required:</h3>
      <ol>
        <li>Review the design in the admin dashboard</li>
        <li>Set pricing based on complexity</li>
        <li>Approve or reject the request</li>
        <li>User will receive email notification</li>
      </ol>

      <p><a href="${adminDashboardUrl}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">View in Admin Dashboard</a></p>

      <hr />
      <p><small>Fly Free Custom Design System</small></p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@flyfree.com',
        to: adminEmail,
        subject: `🎨 New Custom Design: ${designTitle}`,
        html,
      });
      console.log(`✅ Admin notification sent to ${adminEmail}`);
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }

  async sendDesignApprovedEmail(
    userEmail: string,
    designTitle: string,
    price: number,
    designId: string
  ) {
    const checkoutUrl = `${process.env.WEB_URL}/checkout?customDesignId=${designId}`;

    const html = `
      <h2>✅ Your Design Has Been Approved!</h2>
      <p>Great news! Your custom design request has been approved.</p>
      
      <h3>Design: ${designTitle}</h3>
      <h3>Price: ₹${price}</h3>

      <p>Your design is ready for production. Click below to proceed with payment:</p>
      <p><a href="${checkoutUrl}" style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">Proceed to Checkout</a></p>

      <p>Or visit your profile to see more details: <a href="${process.env.WEB_URL}/profile?tab=custom-orders">View in Profile</a></p>

      <hr />
      <p><small>Thank you for choosing Fly Free!</small></p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@flyfree.com',
        to: userEmail,
        subject: `✅ Your Design "${designTitle}" Has Been Approved!`,
        html,
      });
      console.log(`✅ Approval email sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }
  }

  async sendDesignRejectedEmail(
    userEmail: string,
    designTitle: string,
    reason: string
  ) {
    const html = `
      <h2>Design Request Update</h2>
      <p>We've reviewed your custom design request: <strong>${designTitle}</strong></p>
      
      <p><strong>Status:</strong> Unable to proceed at this time</p>
      <p><strong>Reason:</strong> ${reason}</p>

      <p>We've sent you an email with more details. You can:</p>
      <ul>
        <li>Submit a revised design</li>
        <li>Contact us for assistance</li>
        <li>Browse our existing collections</li>
      </ul>

      <p>Visit your profile: <a href="${process.env.WEB_URL}/profile?tab=custom-orders">View Your Orders</a></p>

      <hr />
      <p><small>Fly Free Support Team</small></p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@flyfree.com',
        to: userEmail,
        subject: `Update on Your Design "${designTitle}"`,
        html,
      });
      console.log(`✅ Rejection email sent to ${userEmail}`);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }
  }
}
