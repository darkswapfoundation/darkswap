import { logger } from './logger';

/**
 * Role
 */
export interface Role {
  name: string;
  permissions: string[];
}

/**
 * User roles
 */
export interface UserRoles {
  userId: string;
  roles: string[];
}

/**
 * Permission
 */
export interface Permission {
  name: string;
  description: string;
}

/**
 * Role-based access control options
 */
export interface RbacOptions {
  roles: Role[];
  permissions: Permission[];
}

/**
 * Role-based access control
 */
export class RoleBasedAccessControl {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, string[]> = new Map();
  
  /**
   * Creates a new role-based access control
   * @param options Role-based access control options
   */
  constructor(options: RbacOptions) {
    // Add roles
    for (const role of options.roles) {
      this.addRole(role);
    }
    
    // Add permissions
    for (const permission of options.permissions) {
      this.addPermission(permission);
    }
    
    logger.info('Role-based access control created', {
      roles: options.roles.length,
      permissions: options.permissions.length,
    });
  }
  
  /**
   * Adds a role
   * @param role Role
   */
  public addRole(role: Role): void {
    this.roles.set(role.name, role);
    
    logger.info('Role added', { role });
  }
  
  /**
   * Removes a role
   * @param roleName Role name
   */
  public removeRole(roleName: string): void {
    this.roles.delete(roleName);
    
    logger.info('Role removed', { roleName });
  }
  
  /**
   * Gets a role
   * @param roleName Role name
   * @returns Role
   */
  public getRole(roleName: string): Role | undefined {
    return this.roles.get(roleName);
  }
  
  /**
   * Gets all roles
   * @returns Roles
   */
  public getRoles(): Role[] {
    return Array.from(this.roles.values());
  }
  
  /**
   * Adds a permission
   * @param permission Permission
   */
  public addPermission(permission: Permission): void {
    this.permissions.set(permission.name, permission);
    
    logger.info('Permission added', { permission });
  }
  
  /**
   * Removes a permission
   * @param permissionName Permission name
   */
  public removePermission(permissionName: string): void {
    this.permissions.delete(permissionName);
    
    logger.info('Permission removed', { permissionName });
  }
  
  /**
   * Gets a permission
   * @param permissionName Permission name
   * @returns Permission
   */
  public getPermission(permissionName: string): Permission | undefined {
    return this.permissions.get(permissionName);
  }
  
  /**
   * Gets all permissions
   * @returns Permissions
   */
  public getPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }
  
  /**
   * Assigns roles to a user
   * @param userId User ID
   * @param roleNames Role names
   */
  public assignRolesToUser(userId: string, roleNames: string[]): void {
    // Validate roles
    for (const roleName of roleNames) {
      if (!this.roles.has(roleName)) {
        throw new Error(`Role ${roleName} does not exist`);
      }
    }
    
    // Assign roles
    this.userRoles.set(userId, roleNames);
    
    logger.info('Roles assigned to user', { userId, roleNames });
  }
  
  /**
   * Gets user roles
   * @param userId User ID
   * @returns Role names
   */
  public getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || [];
  }
  
  /**
   * Checks if a user has a permission
   * @param userId User ID
   * @param permissionName Permission name
   * @returns Whether the user has the permission
   */
  public hasPermission(userId: string, permissionName: string): boolean {
    try {
      // Get user roles
      const roleNames = this.getUserRoles(userId);
      
      // Check each role
      for (const roleName of roleNames) {
        // Get the role
        const role = this.getRole(roleName);
        
        // If the role doesn't exist, continue
        if (!role) {
          continue;
        }
        
        // Check if the role has the permission
        if (role.permissions.includes(permissionName)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking permission', error);
      return false;
    }
  }
  
  /**
   * Checks if a user has all permissions
   * @param userId User ID
   * @param permissionNames Permission names
   * @returns Whether the user has all permissions
   */
  public hasAllPermissions(userId: string, permissionNames: string[]): boolean {
    try {
      // Check each permission
      for (const permissionName of permissionNames) {
        // If the user doesn't have the permission, return false
        if (!this.hasPermission(userId, permissionName)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking permissions', error);
      return false;
    }
  }
  
  /**
   * Checks if a user has any permission
   * @param userId User ID
   * @param permissionNames Permission names
   * @returns Whether the user has any permission
   */
  public hasAnyPermission(userId: string, permissionNames: string[]): boolean {
    try {
      // Check each permission
      for (const permissionName of permissionNames) {
        // If the user has the permission, return true
        if (this.hasPermission(userId, permissionName)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking permissions', error);
      return false;
    }
  }
  
  /**
   * Gets all users with a role
   * @param roleName Role name
   * @returns User IDs
   */
  public getUsersWithRole(roleName: string): string[] {
    try {
      // Get all users
      const userIds = Array.from(this.userRoles.keys());
      
      // Filter users with the role
      return userIds.filter((userId) => {
        // Get user roles
        const roleNames = this.getUserRoles(userId);
        
        // Check if the user has the role
        return roleNames.includes(roleName);
      });
    } catch (error) {
      logger.error('Error getting users with role', error);
      return [];
    }
  }
  
  /**
   * Gets all users with a permission
   * @param permissionName Permission name
   * @returns User IDs
   */
  public getUsersWithPermission(permissionName: string): string[] {
    try {
      // Get all users
      const userIds = Array.from(this.userRoles.keys());
      
      // Filter users with the permission
      return userIds.filter((userId) => {
        // Check if the user has the permission
        return this.hasPermission(userId, permissionName);
      });
    } catch (error) {
      logger.error('Error getting users with permission', error);
      return [];
    }
  }
  
  /**
   * Clears all user roles
   */
  public clearUserRoles(): void {
    this.userRoles.clear();
    
    logger.info('User roles cleared');
  }
}

/**
 * Creates a new role-based access control
 * @param options Role-based access control options
 * @returns Role-based access control
 */
export function createRoleBasedAccessControl(options: RbacOptions): RoleBasedAccessControl {
  return new RoleBasedAccessControl(options);
}