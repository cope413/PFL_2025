import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
export const emailTemplates = {
  welcome: (username: string, teamName: string) => ({
    subject: 'Welcome to PFL - Prehistoric Football League!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937; text-align: center;">🏈 Welcome to PFL!</h1>
        <p>Hello ${username},</p>
        <p>Welcome to the Prehistoric Football League! Your team <strong>${teamName}</strong> is now ready to compete.</p>
        <p>Get ready to:</p>
        <ul>
          <li>Manage your fantasy team</li>
          <li>Compete against other managers</li>
          <li>Track your standings</li>
          <li>Make strategic decisions</li>
        </ul>
        <p>Good luck and may your team survive the prehistoric challenges!</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  weeklyRecap: (username: string, teamName: string, week: number, record: string, points: number, rank: number) => ({
    subject: `PFL Week ${week} Recap - ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937; text-align: center;">📊 Week ${week} Recap</h1>
        <p>Hello ${username},</p>
        <p>Here's your team's performance for Week ${week}:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${teamName}</h3>
          <p><strong>Record:</strong> ${record}</p>
          <p><strong>Points Scored:</strong> ${points.toFixed(1)}</p>
          <p><strong>League Rank:</strong> ${rank}</p>
        </div>
        <p>Keep up the great work and stay competitive!</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  tradeOffer: (username: string, fromTeam: string, players: string[]) => ({
    subject: `PFL Trade Offer from ${fromTeam}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937; text-align: center;">🤝 Trade Offer</h1>
        <p>Hello ${username},</p>
        <p>You have received a trade offer from <strong>${fromTeam}</strong>.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Players Offered:</h3>
          <ul>
            ${players.map(player => `<li>${player}</li>`).join('')}
          </ul>
        </div>
        <p>Log in to your PFL dashboard to review and respond to this offer.</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  matchupReminder: (username: string, teamName: string, opponent: string, week: number) => ({
    subject: `PFL Week ${week} Matchup Reminder`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937; text-align: center;">⚔️ Matchup Reminder</h1>
        <p>Hello ${username},</p>
        <p>Don't forget to set your lineup for Week ${week}!</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">This Week's Matchup</h3>
          <p><strong>${teamName}</strong> vs <strong>${opponent}</strong></p>
          <p>Make sure your best players are in your starting lineup!</p>
        </div>
        <p>Good luck in your matchup!</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  injuryAlert: (username: string, playerName: string, team: string, injury: string) => ({
    subject: `PFL Injury Alert - ${playerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">🚨 Injury Alert</h1>
        <p>Hello ${username},</p>
        <p>Important injury news for one of your players:</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">${playerName}</h3>
          <p><strong>Team:</strong> ${team}</p>
          <p><strong>Injury:</strong> ${injury}</p>
        </div>
        <p>Consider making roster adjustments to account for this injury.</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  passwordReset: (username: string, resetLink: string) => ({
    subject: `PFL Password Reset Request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1f2937; text-align: center;">🔐 Password Reset</h1>
        <p>Hello ${username},</p>
        <p>You requested a password reset for your PFL account.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this reset, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  lineupWarning: (username: string, teamName: string, week: number) => ({
    subject: `⚠️ PFL Week ${week} Lineup Warning - ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626; text-align: center;">⚠️ Lineup Warning</h1>
        <p>Hello ${username},</p>
        <p><strong>Your team ${teamName} does not have a saved lineup for Week ${week}!</strong></p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #dc2626;">Action Required</h3>
          <p>You must save your lineup by Saturday at 5:00 PM EST to avoid forfeiting your matchup.</p>
          <p><strong>Current Status:</strong> No lineup saved</p>
          <p><strong>Deadline:</strong> Saturday at 5:00 PM EST</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">How to Save Your Lineup</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Log into your PFL account</li>
            <li>Go to "Team Dashboard"</li>
            <li>Select Week ${week}</li>
            <li>Set your starting lineup</li>
            <li>Click "Save Lineup"</li>
            <li>Click "Submit Lineup" to finalize</li>
          </ol>
        </div>

        <p><strong>Important:</strong> If you don't save a lineup by the deadline, your team will forfeit the matchup and you'll receive a loss.</p>
        
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  lineupSubmission: (username: string, teamName: string, week: number, lineup: any, submissionTime: string) => ({
    subject: `PFL Week ${week} Lineup Submitted - ${teamName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669; text-align: center;">✅ Lineup Successfully Submitted!</h1>
        <p>Hello ${username},</p>
        <p>Your lineup for Week ${week} has been successfully submitted!</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin-top: 0; color: #059669;">Submission Details</h3>
          <p><strong>Team:</strong> ${teamName}</p>
          <p><strong>Week:</strong> ${week}</p>
          <p><strong>Submitted:</strong> ${new Date(submissionTime).toLocaleString()}</p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Starting Lineup</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Position</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Player</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">QB</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.QB || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">RB</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.RB_1 || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">WR</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.WR_1 || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">TE</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.TE || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">FLEX</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.FLEX_1 || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">FLEX</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.FLEX_2 || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">K</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${lineup.K || 'Empty'}</td>
            </tr>
            <tr>
              <td style="padding: 8px;">D/ST</td>
              <td style="padding: 8px;">${lineup.DEF || 'Empty'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #dc2626; font-weight: bold;">⚠️ Important Reminder</p>
          <p style="margin: 5px 0 0 0; color: #374151;">Make sure to check for any last-minute player updates before game time. You can still make changes to your lineup until kickoff.</p>
        </div>

        <p>Good luck with your Week ${week} matchup!</p>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  }),

  test: (username: string) => ({
    subject: 'PFL Test Email - Notification System Working',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669; text-align: center;">✅ Test Email Successful!</h1>
        <p>Hello ${username},</p>
        <p>This is a test email to confirm that your PFL notification system is working correctly.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Email Notification Test</h3>
          <p>✅ Your email notifications are properly configured</p>
          <p>✅ The notification system is working</p>
          <p>✅ You will receive notifications for important events</p>
        </div>
        <p>You can now receive notifications for:</p>
        <ul>
          <li>Trade offers</li>
          <li>Matchup reminders</li>
          <li>Injury alerts</li>
          <li>And other important updates</li>
        </ul>
        <p style="color: #6b7280; font-size: 14px;">- The PFL Team</p>
      </div>
    `
  })
};

// Send email function
export async function sendEmail(to: string, template: { subject: string; html: string }): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration not set up. Skipping email send.');
      return false;
    }

    const mailOptions = {
      from: `"PFL" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Notification types
export type NotificationType = 
  | 'welcome'
  | 'weeklyRecap'
  | 'tradeOffer'
  | 'matchupReminder'
  | 'injuryAlert'
  | 'passwordReset'
  | 'lineupSubmission'
  | 'lineupWarning'
  | 'test';

// Notification service
export class NotificationService {
  static async sendWelcomeEmail(email: string, username: string, teamName: string): Promise<boolean> {
    const template = emailTemplates.welcome(username, teamName);
    return sendEmail(email, template);
  }

  static async sendWeeklyRecap(email: string, username: string, teamName: string, week: number, record: string, points: number, rank: number): Promise<boolean> {
    const template = emailTemplates.weeklyRecap(username, teamName, week, record, points, rank);
    return sendEmail(email, template);
  }

  static async sendTradeOffer(email: string, username: string, fromTeam: string, players: string[]): Promise<boolean> {
    const template = emailTemplates.tradeOffer(username, fromTeam, players);
    return sendEmail(email, template);
  }

  static async sendMatchupReminder(email: string, username: string, teamName: string, opponent: string, week: number): Promise<boolean> {
    const template = emailTemplates.matchupReminder(username, teamName, opponent, week);
    return sendEmail(email, template);
  }

  static async sendInjuryAlert(email: string, username: string, playerName: string, team: string, injury: string): Promise<boolean> {
    const template = emailTemplates.injuryAlert(username, playerName, team, injury);
    return sendEmail(email, template);
  }

  static async sendPasswordReset(email: string, username: string, resetLink: string): Promise<boolean> {
    const template = emailTemplates.passwordReset(username, resetLink);
    return sendEmail(email, template);
  }

  static async sendLineupWarning(email: string, username: string, teamName: string, week: number): Promise<boolean> {
    const template = emailTemplates.lineupWarning(username, teamName, week);
    return sendEmail(email, template);
  }

  static async sendTestEmail(email: string, username: string): Promise<boolean> {
    const template = emailTemplates.test(username);
    return sendEmail(email, template);
  }

  static async sendLineupSubmission(email: string, username: string, teamName: string, week: number, lineup: any, submissionTime: string): Promise<boolean> {
    const template = emailTemplates.lineupSubmission(username, teamName, week, lineup, submissionTime);
    return sendEmail(email, template);
  }
} 