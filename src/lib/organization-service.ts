// Organization Service Implementation
// Enterprise-grade multi-tenant organization management

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  onSnapshot,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Organization,
  Department,
  OrganizationUser,
  Project,
  Document,
  Channel,
  OrganizationRole,
  OrganizationStatus,
  SubscriptionPlan,
  AuditLog,
  OrganizationMetrics,
  APIResponse,
  SearchQuery,
  SearchResult,
  PaginationOptions
} from './organization-types';

export class OrganizationService {
  private static instance: OrganizationService;

  public static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
  }

  // Organization Management
  async createOrganization(
    organizationData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<APIResponse<Organization>> {
    try {
      const orgId = doc(collection(db, 'organizations')).id;
      const now = new Date();

      const organization: Organization = {
        ...organizationData,
        id: orgId,
        createdAt: now,
        updatedAt: now,
        createdBy
      };

      // Use transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Create organization document
        transaction.set(doc(db, 'organizations', orgId), organization);

        // Create default department (General)
        const defaultDept: Department = {
          id: doc(collection(db, `organizations/${orgId}/departments`)).id,
          organizationId: orgId,
          name: 'General',
          description: 'Default department for all users',
          members: [],
          settings: {
            allowCrossDepartmentAccess: true,
            requireApprovalForExpenses: false,
            expenseApprovalLimit: 1000,
            defaultProjectVisibility: 'department'
          },
          createdAt: now,
          updatedAt: now,
          status: 'active'
        };

        transaction.set(
          doc(db, `organizations/${orgId}/departments`, defaultDept.id),
          defaultDept
        );

        // Add creator as organization admin
        const orgUser: OrganizationUser = {
          userId: createdBy,
          organizationId: orgId,
          role: 'org_admin',
          departmentId: defaultDept.id,
          position: 'Administrator',
          startDate: now,
          permissions: this.getDefaultPermissions('org_admin'),
          customPermissions: [],
          status: 'active',
          profile: {
            firstName: '',
            lastName: '',
            email: '',
            skills: [],
            certifications: []
          },
          settings: this.getDefaultUserSettings(),
          createdAt: now,
          updatedAt: now
        };

        transaction.set(
          doc(db, `organizations/${orgId}/users`, createdBy),
          orgUser
        );

        // Log audit event
        await this.logAuditEvent(orgId, createdBy, 'create', 'organization', orgId, {
          action: 'Organization created',
          details: { name: organization.name }
        });
      });

      return {
        success: true,
        data: organization
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        success: false,
        error: {
          code: 'ORG_CREATE_FAILED',
          message: 'Failed to create organization',
          timestamp: new Date()
        }
      };
    }
  }

  // Get organization by ID
  async getOrganization(organizationId: string): Promise<APIResponse<Organization>> {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));

      if (!orgDoc.exists()) {
        return {
          success: false,
          error: {
            code: 'ORG_NOT_FOUND',
            message: 'Organization not found',
            timestamp: new Date()
          }
        };
      }

      return {
        success: true,
        data: orgDoc.data() as Organization
      };
    } catch (error) {
      console.error('Error getting organization:', error);
      return {
        success: false,
        error: {
          code: 'ORG_GET_FAILED',
          message: 'Failed to get organization',
          timestamp: new Date()
        }
      };
    }
  }

  // Update organization
  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>,
    updatedBy: string
  ): Promise<APIResponse<Organization>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'organizations', organizationId), updateData);

      // Log audit event
      await this.logAuditEvent(organizationId, updatedBy, 'update', 'organization', organizationId, {
        action: 'Organization updated',
        changes: Object.keys(updates)
      });

      const updatedOrg = await this.getOrganization(organizationId);
      return updatedOrg;
    } catch (error) {
      console.error('Error updating organization:', error);
      return {
        success: false,
        error: {
          code: 'ORG_UPDATE_FAILED',
          message: 'Failed to update organization',
          timestamp: new Date()
        }
      };
    }
  }

  // Department Management
  async createDepartment(
    organizationId: string,
    departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<APIResponse<Department>> {
    try {
      const deptId = doc(collection(db, `organizations/${organizationId}/departments`)).id;
      const now = new Date();

      const department: Department = {
        ...departmentData,
        id: deptId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, `organizations/${organizationId}/departments`, deptId), department);

      // Log audit event
      await this.logAuditEvent(organizationId, createdBy, 'create', 'department', deptId, {
        action: 'Department created',
        details: { name: department.name }
      });

      return {
        success: true,
        data: department
      };
    } catch (error) {
      console.error('Error creating department:', error);
      return {
        success: false,
        error: {
          code: 'DEPT_CREATE_FAILED',
          message: 'Failed to create department',
          timestamp: new Date()
        }
      };
    }
  }

  // Get departments for organization
  async getDepartments(organizationId: string): Promise<APIResponse<Department[]>> {
    try {
      const snapshot = await getDocs(
        collection(db, `organizations/${organizationId}/departments`)
      );

      const departments = snapshot.docs.map(doc => doc.data() as Department);

      return {
        success: true,
        data: departments
      };
    } catch (error) {
      console.error('Error getting departments:', error);
      return {
        success: false,
        error: {
          code: 'DEPT_GET_FAILED',
          message: 'Failed to get departments',
          timestamp: new Date()
        }
      };
    }
  }

  // User Management
  async addUserToOrganization(
    organizationId: string,
    userId: string,
    userData: Omit<OrganizationUser, 'userId' | 'organizationId' | 'createdAt' | 'updatedAt'>,
    addedBy: string
  ): Promise<APIResponse<OrganizationUser>> {
    try {
      const now = new Date();

      const orgUser: OrganizationUser = {
        ...userData,
        userId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      await setDoc(doc(db, `organizations/${organizationId}/users`, userId), orgUser);

      // Log audit event
      await this.logAuditEvent(organizationId, addedBy, 'create', 'user', userId, {
        action: 'User added to organization',
        details: { role: userData.role, position: userData.position }
      });

      return {
        success: true,
        data: orgUser
      };
    } catch (error) {
      console.error('Error adding user to organization:', error);
      return {
        success: false,
        error: {
          code: 'USER_ADD_FAILED',
          message: 'Failed to add user to organization',
          timestamp: new Date()
        }
      };
    }
  }

  // Audit logging
  private async logAuditEvent(
    organizationId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: any
  ): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        organizationId,
        userId,
        userEmail: '', // Would be populated from user data
        action,
        resource,
        resourceId,
        details,
        metadata: {
          ipAddress: '',
          userAgent: '',
          sessionId: '',
          requestId: ''
        },
        timestamp: new Date(),
        severity: 'low'
      };

      await addDoc(collection(db, `organizations/${organizationId}/audit_logs`), auditLog);
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Default permissions for roles
  private getDefaultPermissions(role: OrganizationRole): Permission[] {
    const permissions: Permission[] = [];

    switch (role) {
      case 'org_admin':
        permissions.push(
          { resource: '*', actions: ['*'], scope: 'organization' },
        );
        break;
      case 'dept_manager':
        permissions.push(
          { resource: 'users', actions: ['read', 'write'], scope: 'department' },
          { resource: 'projects', actions: ['read', 'write', 'delete'], scope: 'department' },
          { resource: 'documents', actions: ['read', 'write', 'delete'], scope: 'department' }
        );
        break;
      case 'project_manager':
        permissions.push(
          { resource: 'projects', actions: ['read', 'write'], scope: 'project' },
          { resource: 'tasks', actions: ['read', 'write', 'delete'], scope: 'project' },
          { resource: 'documents', actions: ['read', 'write'], scope: 'project' }
        );
        break;
      case 'staff':
        permissions.push(
          { resource: 'projects', actions: ['read'], scope: 'organization' },
          { resource: 'tasks', actions: ['read', 'write'], scope: 'own' },
          { resource: 'documents', actions: ['read', 'write'], scope: 'own' }
        );
        break;
      case 'viewer':
        permissions.push(
          { resource: '*', actions: ['read'], scope: 'organization' }
        );
        break;
    }

    return permissions;
  }

  // Default user settings
  private getDefaultUserSettings(): UserSettings {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      notifications: {
        email: {
          enabled: true,
          frequency: 'immediate',
          types: ['task_assigned', 'project_update', 'mention']
        },
        push: {
          enabled: true,
          types: ['task_assigned', 'mention']
        },
        inApp: {
          enabled: true,
          types: ['task_assigned', 'project_update', 'mention'],
          sound: true
        }
      },
      privacy: {
        profileVisibility: 'organization',
        showOnlineStatus: true,
        allowDirectMessages: true,
        shareContactInfo: true
      },
      preferences: {
        theme: 'light',
        compactMode: false,
        showAvatars: true,
        autoSave: true,
        defaultView: 'dashboard',
        sidebarCollapsed: false
      }
    };
  }
}