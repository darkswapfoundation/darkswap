/**
 * notifications.ts - Notification system for the DarkSwap server
 * 
 * This file provides a notification system for the DarkSwap server.
 * It supports email, Slack, and Discord notifications.
 */

import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { NotificationType, NotificationInterface } from './types';

/**
 * Notification configuration
 */
interface NotificationConfig {
  /**
   * Whether notifications are enabled
   */
  enabled: boolean;
  
  /**
   * Email configuration
   */
  email?: {
    /**
     * Whether email notifications are enabled
     */
    enabled: boolean;
    
    /**
     * SMTP host
     */
    host: string;
    
    /**
     * SMTP port
     */
    port: number;
    
    /**
     * SMTP secure
     */
    secure: boolean;
    
    /**
     * SMTP username
     */
    username: string;
    
    /**
     * SMTP password
     */
    password: string;
    
    /**
     * From address
     */
    from: string;
    
    /**
     * To addresses
     */
    to: string[];
  };
  
  /**
   * Slack configuration
   */
  slack?: {
    /**
     * Whether Slack notifications are enabled
     */
    enabled: boolean;
    
    /**
     * Slack token
     */
    token: string;
    
    /**
     * Slack channel
     */
    channel: string;
  };
  
  /**
   * Discord configuration
   */
  discord?: {
    /**
     * Whether Discord notifications are enabled
     */
    enabled: boolean;
    
    /**
     * Discord webhook URL
     */
    webhookUrl: string;
  };
}

/**
 * Notification class
 */
class NotificationClass implements NotificationInterface {
  /**
   * Notification configuration
   */
  private config: NotificationConfig = {
    enabled: false,
  };
  
  /**
   * Nodemailer transporter
   */
  private emailTransporter: nodemailer.Transporter | null = null;
  
  /**
   * Slack client
   */
  private slackClient: WebClient | null = null;
  
  /**
   * Configure notifications
   * @param config - Notification configuration
   */
  configure(config: NotificationConfig): void {
    this.config = config;
    
    // Configure email
    if (config.email?.enabled) {
      this.configureEmail();
    }
    
    // Configure Slack
    if (config.slack?.enabled) {
      this.configureSlack();
    }
  }
  
  /**
   * Configure email
   */
  private configureEmail(): void {
    if (!this.config.email) {
      return;
    }
    
    // Create nodemailer transporter
    this.emailTransporter = nodemailer.createTransport({
      host: this.config.email.host,
      port: this.config.email.port,
      secure: this.config.email.secure,
      auth: {
        user: this.config.email.username,
        pass: this.config.email.password,
      },
    });
  }
  
  /**
   * Configure Slack
   */
  private configureSlack(): void {
    if (!this.config.slack) {
      return;
    }
    
    // Create Slack client
    this.slackClient = new WebClient(this.config.slack.token);
  }
  
  /**
   * Send notification
   * @param type - Notification type
   * @param message - Notification message
   * @param details - Notification details
   */
  async sendNotification(type: NotificationType, message: string, details?: any): Promise<void> {
    // Check if notifications are enabled
    if (!this.config.enabled) {
      return;
    }
    
    // Send email notification
    if (this.config.email?.enabled) {
      await this.sendEmailNotification(type, message, details);
    }
    
    // Send Slack notification
    if (this.config.slack?.enabled) {
      await this.sendSlackNotification(type, message, details);
    }
    
    // Send Discord notification
    if (this.config.discord?.enabled) {
      await this.sendDiscordNotification(type, message, details);
    }
  }
  
  /**
   * Send email notification
   * @param type - Notification type
   * @param message - Notification message
   * @param details - Notification details
   */
  private async sendEmailNotification(type: NotificationType, message: string, details?: any): Promise<void> {
    if (!this.emailTransporter || !this.config.email) {
      return;
    }
    
    try {
      // Create subject
      const subject = `[DarkSwap] [${type.toUpperCase()}] ${message}`;
      
      // Create text
      let text = message;
      
      // Add details
      if (details) {
        text += '\n\nDetails:\n' + JSON.stringify(details, null, 2);
      }
      
      // Send email
      await this.emailTransporter.sendMail({
        from: this.config.email.from,
        to: this.config.email.to.join(', '),
        subject,
        text,
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
  
  /**
   * Send Slack notification
   * @param type - Notification type
   * @param message - Notification message
   * @param details - Notification details
   */
  private async sendSlackNotification(type: NotificationType, message: string, details?: any): Promise<void> {
    if (!this.slackClient || !this.config.slack) {
      return;
    }
    
    try {
      // Create text
      let text = `*[${type.toUpperCase()}]* ${message}`;
      
      // Add details
      if (details) {
        text += '\n```\n' + JSON.stringify(details, null, 2) + '\n```';
      }
      
      // Send message
      await this.slackClient.chat.postMessage({
        channel: this.config.slack.channel,
        text,
        mrkdwn: true,
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
  
  /**
   * Send Discord notification
   * @param type - Notification type
   * @param message - Notification message
   * @param details - Notification details
   */
  private async sendDiscordNotification(type: NotificationType, message: string, details?: any): Promise<void> {
    if (!this.config.discord?.webhookUrl) {
      return;
    }
    
    try {
      // Create content
      let content = `**[${type.toUpperCase()}]** ${message}`;
      
      // Add details
      if (details) {
        content += '\n```json\n' + JSON.stringify(details, null, 2) + '\n```';
      }
      
      // Send message
      await axios.post(this.config.discord.webhookUrl, {
        content,
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }
}

/**
 * Notification instance
 */
const Notifications = new NotificationClass();

/**
 * Send notification
 * @param type - Notification type
 * @param message - Notification message
 * @param details - Notification details
 */
export async function sendNotification(type: NotificationType, message: string, details?: any): Promise<void> {
  await Notifications.sendNotification(type, message, details);
}

/**
 * Configure notifications
 * @param config - Notification configuration
 */
export function configureNotifications(config: NotificationConfig): void {
  Notifications.configure(config);
}

/**
 * Default export
 */
export default Notifications;