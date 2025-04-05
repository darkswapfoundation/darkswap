import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification type
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification data
 */
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  data?: any;
}

/**
 * Notification service for managing notifications
 */
class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationData[] = [];
  private initialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns NotificationService instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   * @returns Promise that resolves when initialized
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Configure push notifications
      PushNotification.configure({
        // (optional) Called when Token is generated (iOS and Android)
        onRegister: function (token) {
          console.log('TOKEN:', token);
        },

        // (required) Called when a remote is received or opened, or local notification is opened
        onNotification: function (notification) {
          console.log('NOTIFICATION:', notification);

          // process the notification

          // (required) Called when a remote is received or opened, or local notification is opened
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        },

        // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
        onAction: function (notification) {
          console.log('ACTION:', notification.action);
          console.log('NOTIFICATION:', notification);

          // process the action
        },

        // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
        onRegistrationError: function (err) {
          console.error(err.message, err);
        },

        // IOS ONLY (optional): default: all - Permissions to register.
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Should the initial notification be popped automatically
        // default: true
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         * - if you are not using remote notification or do not have Firebase installed, use this:
         *     requestPermissions: Platform.OS === 'ios'
         */
        requestPermissions: true,
      });

      // Load notifications from storage
      await this.loadNotifications();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      throw error;
    }
  }

  /**
   * Show local notification
   * @param title - Notification title
   * @param message - Notification message
   * @param type - Notification type
   * @param data - Additional data
   * @returns Promise that resolves when notification is shown
   */
  public async showLocalNotification(
    title: string,
    message: string,
    type: NotificationType = 'info',
    data?: any
  ): Promise<void> {
    try {
      // Create notification data
      const notification: NotificationData = {
        id: Date.now().toString(),
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false,
        data,
      };

      // Add to notifications list
      this.notifications.unshift(notification);

      // Save notifications to storage
      await this.saveNotifications();

      // Show push notification
      PushNotification.localNotification({
        title,
        message,
        playSound: true,
        soundName: 'default',
        userInfo: { type, data },
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications
   * @returns Array of notifications
   */
  public getNotifications(): NotificationData[] {
    return this.notifications;
  }

  /**
   * Get unread notifications
   * @returns Array of unread notifications
   */
  public getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter((notification) => !notification.read);
  }

  /**
   * Get unread notifications count
   * @returns Number of unread notifications
   */
  public getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  /**
   * Mark notification as read
   * @param id - Notification ID
   * @returns Promise that resolves when notification is marked as read
   */
  public async markAsRead(id: string): Promise<void> {
    try {
      const notification = this.notifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
        await this.saveNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @returns Promise that resolves when all notifications are marked as read
   */
  public async markAllAsRead(): Promise<void> {
    try {
      this.notifications.forEach((notification) => {
        notification.read = true;
      });
      await this.saveNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   * @returns Promise that resolves when all notifications are cleared
   */
  public async clearNotifications(): Promise<void> {
    try {
      this.notifications = [];
      await this.saveNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  /**
   * Load notifications from storage
   * @returns Promise that resolves when notifications are loaded
   */
  private async loadNotifications(): Promise<void> {
    try {
      const notificationsJson = await AsyncStorage.getItem('notifications');
      if (notificationsJson) {
        this.notifications = JSON.parse(notificationsJson);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw error;
    }
  }

  /**
   * Save notifications to storage
   * @returns Promise that resolves when notifications are saved
   */
  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notifications',
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance();