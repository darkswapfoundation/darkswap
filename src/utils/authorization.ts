/**
 * Authorization utility for DarkSwap
 * 
 * This utility provides authorization functions for the DarkSwap application.
 */

import { logger } from './logger';

/**
 * Role enum
 */
export enum Role {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Permission enum
 */
export enum Permission {
  // User permissions
  READ_PROFILE = 'read:profile',
  UPDATE_PROFILE = 'update:profile',
  
  // Wallet permissions
  READ_WALLET = 'read:wallet',
  UPDATE_WALLET = 'update:wallet',
  
  // Order permissions
  READ_ORDERS = 'read:orders',
  CREATE_ORDER = 'create:order',
  UPDATE_ORDER = 'update:order',
  DELETE_ORDER = 'delete:order',
  
  // Trade permissions
  READ_TRADES = 'read:trades',
  CREATE_TRADE = 'create:trade',
  UPDATE_TRADE = 'update:trade',
  DELETE_TRADE = 'delete:trade',
  
  // Admin permissions
  READ_USERS = 'read:users',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  READ_SYSTEM = 'read:system',
  UPDATE_SYSTEM = 'update:system',
}

/**
 * Role permissions
 */
const rolePermissions: Record<Role, Permission[]> = {
  [Role.GUEST]: [
    // Guest permissions
  ],
  [Role.USER]: [
    // User permissions
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    
    // Wallet permissions
    Permission.READ_WALLET,
    Permission.UPDATE_WALLET,
    
    // Order permissions
    Permission.READ_ORDERS,
    Permission.CREATE_ORDER,
    Permission.UPDATE_ORDER,
    Permission.DELETE_ORDER,
    
    // Trade permissions
    Permission.READ_TRADES,
    Permission.CREATE_TRADE,
    Permission.UPDATE_TRADE,
    Permission.DELETE_TRADE,
  ],
  [Role.ADMIN]: [
    // Admin permissions (includes all user permissions)
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    
    Permission.READ_WALLET,
    Permission.UPDATE_WALLET,
    
    Permission.READ_ORDERS,
    Permission.CREATE_ORDER,
    Permission.UPDATE_ORDER,
    Permission.DELETE_ORDER,
    
    Permission.READ_TRADES,
    Permission.CREATE_TRADE,
    Permission.UPDATE_TRADE,
    Permission.DELETE_TRADE,
    
    // Admin-specific permissions
    Permission.READ_USERS,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.READ_SYSTEM,
    Permission.UPDATE_SYSTEM,
  ],
};

/**
 * User roles storage key
 */
const USER_ROLES_KEY = 'darkswap_user_roles';

/**
 * Get the permissions for a role
 * 
 * @param role The role
 * @returns The permissions for the role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a permission
 * 
 * @param role The role
 * @param permission The permission
 * @returns Whether the role has the permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/**
 * Get the user's roles
 * 
 * @param userId The user ID
 * @returns The user's roles
 */
export function getUserRoles(userId: string): Role[] {
  try {
    // Get the user roles from localStorage
    const userRolesJson = localStorage.getItem(USER_ROLES_KEY);
    
    if (!userRolesJson) {
      return [Role.USER]; // Default role
    }
    
    const userRoles = JSON.parse(userRolesJson);
    
    return userRoles[userId] || [Role.USER]; // Default role
  } catch (error) {
    logger.error('Failed to get user roles', { error });
    
    return [Role.USER]; // Default role
  }
}

/**
 * Set the user's roles
 * 
 * @param userId The user ID
 * @param roles The user's roles
 */
export function setUserRoles(userId: string, roles: Role[]): void {
  try {
    // Get the user roles from localStorage
    const userRolesJson = localStorage.getItem(USER_ROLES_KEY);
    const userRoles = userRolesJson ? JSON.parse(userRolesJson) : {};
    
    // Update the user's roles
    userRoles[userId] = roles;
    
    // Store the user roles in localStorage
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(userRoles));
    
    logger.debug('Set user roles', { userId, roles });
  } catch (error) {
    logger.error('Failed to set user roles', { error });
  }
}

/**
 * Check if a user has a permission
 * 
 * @param userId The user ID
 * @param permission The permission
 * @returns Whether the user has the permission
 */
export function userHasPermission(userId: string, permission: Permission): boolean {
  const roles = getUserRoles(userId);
  
  return roles.some((role) => hasPermission(role, permission));
}

/**
 * Check if a user has a role
 * 
 * @param userId The user ID
 * @param role The role
 * @returns Whether the user has the role
 */
export function userHasRole(userId: string, role: Role): boolean {
  const roles = getUserRoles(userId);
  
  return roles.includes(role);
}

/**
 * Create an authorization middleware for Express
 * 
 * @param permission The required permission
 * @returns The authorization middleware
 */
export function createAuthorizationMiddleware(permission: Permission) {
  return (req: any, res: any, next: any) => {
    // Get the user ID from the request
    const userId = req.user?.id;
    
    // If the user ID doesn't exist, reject the request
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
    
    // Check if the user has the required permission
    if (!userHasPermission(userId, permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
      });
    }
    
    next();
  };
}

/**
 * Create a role middleware for Express
 * 
 * @param role The required role
 * @returns The role middleware
 */
export function createRoleMiddleware(role: Role) {
  return (req: any, res: any, next: any) => {
    // Get the user ID from the request
    const userId = req.user?.id;
    
    // If the user ID doesn't exist, reject the request
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
    
    // Check if the user has the required role
    if (!userHasRole(userId, role)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
      });
    }
    
    next();
  };
}

export default {
  Role,
  Permission,
  getPermissionsForRole,
  hasPermission,
  getUserRoles,
  setUserRoles,
  userHasPermission,
  userHasRole,
  createAuthorizationMiddleware,
  createRoleMiddleware,
};