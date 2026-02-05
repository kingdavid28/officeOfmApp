// Organization Role Management System
// Hierarchical role-based access control for each organization

import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from './friary-types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Organization-specific role
 * Each organization (friary, parish, school, etc.) has its own hierarchy
 */
export type OrganizationRole =
    | 'org_admin'       // Organization Administrator (Guardian, Principal, Director)
    | 'org_vice_admin'  // Vice Administrator (Vice Guardian, Vice Principal)
    | 'org_staff'       // Staff member
    | 'org_viewer';     // Read-only access

/**
 * Organization member with role
 */
export interface OrganizationMember {
    userId: string;
    userName: string;
    userEmail: string;
    role: OrganizationRole;
    assignedAt: Date;
    assignedBy: string;
    permissions: OrganizationPermissions;
    isActive: boolean;
}

/**
 * Permissions for organization members
 */
export interface OrganizationPermissions {
    // Content Management
    canCreateDocuments: boolean;
    canEditDocuments: boolean;
    canDeleteDocuments: boolean;
    canViewDocuments: boolean;

    // Financial Management
    canCreateExpenses: boolean;
    canApproveExpenses: boolean;
    canViewFinancials: boolean;
    canManageBudget: boolean;

    // Member Management
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canEditMemberRoles: boolean;
    canViewMembers: boolean;

    // Organization Settings
    canEditOrganization: boolean;
    canDeleteOrganization: boolean;
    canManageSettings: boolean;

    // Messaging
    canSendMessages: boolean;
    canCreateGroupChats: boolean;
    canManageChats: boolean;
}

/**
 * Organization with role management
 */
export interface OrganizationWithRoles {
    organizationId: string;
    organizationName: string;
    organizationType: string;
    admin: OrganizationMember | null;
    viceAdmin: OrganizationMember | null;
    staff: OrganizationMember[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User's organization memberships
 */
export interface UserOrganizationMembership {
    userId: string;
    organizations: {
        organizationId: string;
        organizationName: string;
        organizationType: string;
        role: OrganizationRole;
        permissions: OrganizationPermissions;
    }[];
}

// ============================================================================
// PERMISSION PRESETS
// ============================================================================

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: OrganizationRole): OrganizationPermissions {
    switch (role) {
        case 'org_admin':
            return {
                // Full access to everything
                canCreateDocuments: true,
                canEditDocuments: true,
                canDeleteDocuments: true,
                canViewDocuments: true,
                canCreateExpenses: true,
                canApproveExpenses: true,
                canViewFinancials: true,
                canManageBudget: true,
                canAddMembers: true,
                canRemoveMembers: true,
                canEditMemberRoles: true,
                canViewMembers: true,
                canEditOrganization: true,
                canDeleteOrganization: true,
                canManageSettings: true,
                canSendMessages: true,
                canCreateGroupChats: true,
                canManageChats: true
            };

        case 'org_vice_admin':
            return {
                // Almost full access, except critical operations
                canCreateDocuments: true,
                canEditDocuments: true,
                canDeleteDocuments: true,
                canViewDocuments: true,
                canCreateExpenses: true,
                canApproveExpenses: true,
                canViewFinancials: true,
                canManageBudget: false, // Cannot manage budget
                canAddMembers: true,
                canRemoveMembers: false, // Cannot remove members
                canEditMemberRoles: false, // Cannot edit roles
                canViewMembers: true,
                canEditOrganization: true,
                canDeleteOrganization: false, // Cannot delete org
                canManageSettings: true,
                canSendMessages: true,
                canCreateGroupChats: true,
                canManageChats: true
            };

        case 'org_staff':
            return {
                // Basic operational access
                canCreateDocuments: true,
                canEditDocuments: true,
                canDeleteDocuments: false,
                canViewDocuments: true,
                canCreateExpenses: true,
                canApproveExpenses: false,
                canViewFinancials: true,
                canManageBudget: false,
                canAddMembers: false,
                canRemoveMembers: false,
                canEditMemberRoles: false,
                canViewMembers: true,
                canEditOrganization: false,
                canDeleteOrganization: false,
                canManageSettings: false,
                canSendMessages: true,
                canCreateGroupChats: false,
                canManageChats: false
            };

        case 'org_viewer':
            return {
                // Read-only access
                canCreateDocuments: false,
                canEditDocuments: false,
                canDeleteDocuments: false,
                canViewDocuments: true,
                canCreateExpenses: false,
                canApproveExpenses: false,
                canViewFinancials: true,
                canManageBudget: false,
                canAddMembers: false,
                canRemoveMembers: false,
                canEditMemberRoles: false,
                canViewMembers: true,
                canEditOrganization: false,
                canDeleteOrganization: false,
                canManageSettings: false,
                canSendMessages: true,
                canCreateGroupChats: false,
                canManageChats: false
            };
    }
}

// ============================================================================
// ROLE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Assign a user to an organization with a specific role
 */
export async function assignUserToOrganization(
    organizationId: string,
    organizationName: string,
    organizationType: string,
    userId: string,
    userName: string,
    userEmail: string,
    role: OrganizationRole,
    assignedBy: string,
    customPermissions?: Partial<OrganizationPermissions>
): Promise<void> {
    try {
        // Validate role constraints
        if (role === 'org_admin') {
            // Check if admin already exists
            const existingAdmin = await getOrganizationAdmin(organizationId);
            if (existingAdmin && existingAdmin.userId !== userId) {
                throw new Error('Organization already has an admin. Remove existing admin first.');
            }
        }

        if (role === 'org_vice_admin') {
            // Check if vice admin already exists
            const existingViceAdmin = await getOrganizationViceAdmin(organizationId);
            if (existingViceAdmin && existingViceAdmin.userId !== userId) {
                throw new Error('Organization already has a vice admin. Remove existing vice admin first.');
            }
        }

        const member: OrganizationMember = {
            userId,
            userName,
            userEmail,
            role,
            assignedAt: new Date(),
            assignedBy,
            permissions: {
                ...getDefaultPermissions(role),
                ...customPermissions
            },
            isActive: true
        };

        // Save to organization members collection
        const memberRef = doc(db, `organizations/${organizationId}/members`, userId);
        await setDoc(memberRef, member);

        // Update user's organization memberships
        await updateUserOrganizationMemberships(userId, organizationId, organizationName, organizationType, role, member.permissions);

        console.log(`✅ User ${userName} assigned to ${organizationName} as ${role}`);
    } catch (error) {
        console.error('❌ Error assigning user to organization:', error);
        throw error;
    }
}

/**
 * Remove a user from an organization
 */
export async function removeUserFromOrganization(
    organizationId: string,
    userId: string,
    removedBy: string
): Promise<void> {
    try {
        // Get member info before deletion
        const memberRef = doc(db, `organizations/${organizationId}/members`, userId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
            throw new Error('User is not a member of this organization');
        }

        const member = memberDoc.data() as OrganizationMember;

        // Prevent removing the last admin
        if (member.role === 'org_admin') {
            const allMembers = await getOrganizationMembers(organizationId);
            const admins = allMembers.filter(m => m.role === 'org_admin');
            if (admins.length === 1) {
                throw new Error('Cannot remove the last admin. Assign a new admin first.');
            }
        }

        // Delete from organization members
        await deleteDoc(memberRef);

        // Update user's organization memberships
        await removeUserOrganizationMembership(userId, organizationId);

        console.log(`✅ User ${userId} removed from organization ${organizationId}`);
    } catch (error) {
        console.error('❌ Error removing user from organization:', error);
        throw error;
    }
}

/**
 * Update a user's role in an organization
 */
export async function updateUserRole(
    organizationId: string,
    userId: string,
    newRole: OrganizationRole,
    updatedBy: string,
    customPermissions?: Partial<OrganizationPermissions>
): Promise<void> {
    try {
        // Validate role constraints
        if (newRole === 'org_admin') {
            const existingAdmin = await getOrganizationAdmin(organizationId);
            if (existingAdmin && existingAdmin.userId !== userId) {
                throw new Error('Organization already has an admin. Remove existing admin first.');
            }
        }

        if (newRole === 'org_vice_admin') {
            const existingViceAdmin = await getOrganizationViceAdmin(organizationId);
            if (existingViceAdmin && existingViceAdmin.userId !== userId) {
                throw new Error('Organization already has a vice admin. Remove existing vice admin first.');
            }
        }

        const memberRef = doc(db, `organizations/${organizationId}/members`, userId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) {
            throw new Error('User is not a member of this organization');
        }

        const member = memberDoc.data() as OrganizationMember;

        const updatedMember: OrganizationMember = {
            ...member,
            role: newRole,
            permissions: {
                ...getDefaultPermissions(newRole),
                ...customPermissions
            },
            assignedBy: updatedBy,
            assignedAt: new Date()
        };

        await updateDoc(memberRef, updatedMember as any);

        // Update user's organization memberships
        const orgRef = doc(db, `organizations/${organizationId}`);
        const orgDoc = await getDoc(orgRef);
        const orgData = orgDoc.data();

        await updateUserOrganizationMemberships(
            userId,
            organizationId,
            orgData?.name || '',
            orgData?.type || '',
            newRole,
            updatedMember.permissions
        );

        console.log(`✅ User ${userId} role updated to ${newRole}`);
    } catch (error) {
        console.error('❌ Error updating user role:', error);
        throw error;
    }
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
        const membersRef = collection(db, `organizations/${organizationId}/members`);
        const snapshot = await getDocs(membersRef);

        return snapshot.docs.map(doc => doc.data() as OrganizationMember);
    } catch (error) {
        console.error('❌ Error getting organization members:', error);
        return [];
    }
}

/**
 * Get organization admin
 */
export async function getOrganizationAdmin(organizationId: string): Promise<OrganizationMember | null> {
    try {
        const membersRef = collection(db, `organizations/${organizationId}/members`);
        const q = query(membersRef, where('role', '==', 'org_admin'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as OrganizationMember;
    } catch (error) {
        console.error('❌ Error getting organization admin:', error);
        return null;
    }
}

/**
 * Get organization vice admin
 */
export async function getOrganizationViceAdmin(organizationId: string): Promise<OrganizationMember | null> {
    try {
        const membersRef = collection(db, `organizations/${organizationId}/members`);
        const q = query(membersRef, where('role', '==', 'org_vice_admin'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as OrganizationMember;
    } catch (error) {
        console.error('❌ Error getting organization vice admin:', error);
        return null;
    }
}

/**
 * Get organization staff members
 */
export async function getOrganizationStaff(organizationId: string): Promise<OrganizationMember[]> {
    try {
        const membersRef = collection(db, `organizations/${organizationId}/members`);
        const q = query(membersRef, where('role', '==', 'org_staff'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as OrganizationMember);
    } catch (error) {
        console.error('❌ Error getting organization staff:', error);
        return [];
    }
}

/**
 * Get user's role in an organization
 */
export async function getUserOrganizationRole(
    organizationId: string,
    userId: string
): Promise<OrganizationMember | null> {
    try {
        const memberRef = doc(db, `organizations/${organizationId}/members`, userId);
        const memberDoc = await getDoc(memberRef);

        if (!memberDoc.exists()) return null;
        return memberDoc.data() as OrganizationMember;
    } catch (error) {
        console.error('❌ Error getting user organization role:', error);
        return null;
    }
}

/**
 * Check if user has specific permission in organization
 */
export async function hasOrganizationPermission(
    organizationId: string,
    userId: string,
    permission: keyof OrganizationPermissions
): Promise<boolean> {
    try {
        const member = await getUserOrganizationRole(organizationId, userId);
        if (!member || !member.isActive) return false;

        return member.permissions[permission] === true;
    } catch (error) {
        console.error('❌ Error checking organization permission:', error);
        return false;
    }
}

/**
 * Get all organizations where user is a member
 */
export async function getUserOrganizations(userId: string): Promise<UserOrganizationMembership> {
    try {
        const userMembershipsRef = doc(db, 'userOrganizationMemberships', userId);
        const userMembershipsDoc = await getDoc(userMembershipsRef);

        if (!userMembershipsDoc.exists()) {
            return {
                userId,
                organizations: []
            };
        }

        return userMembershipsDoc.data() as UserOrganizationMembership;
    } catch (error) {
        console.error('❌ Error getting user organizations:', error);
        return {
            userId,
            organizations: []
        };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update user's organization memberships document
 */
async function updateUserOrganizationMemberships(
    userId: string,
    organizationId: string,
    organizationName: string,
    organizationType: string,
    role: OrganizationRole,
    permissions: OrganizationPermissions
): Promise<void> {
    try {
        const userMembershipsRef = doc(db, 'userOrganizationMemberships', userId);
        const userMembershipsDoc = await getDoc(userMembershipsRef);

        let memberships: UserOrganizationMembership;

        if (userMembershipsDoc.exists()) {
            memberships = userMembershipsDoc.data() as UserOrganizationMembership;

            // Update or add organization
            const existingIndex = memberships.organizations.findIndex(
                org => org.organizationId === organizationId
            );

            if (existingIndex >= 0) {
                memberships.organizations[existingIndex] = {
                    organizationId,
                    organizationName,
                    organizationType,
                    role,
                    permissions
                };
            } else {
                memberships.organizations.push({
                    organizationId,
                    organizationName,
                    organizationType,
                    role,
                    permissions
                });
            }
        } else {
            memberships = {
                userId,
                organizations: [{
                    organizationId,
                    organizationName,
                    organizationType,
                    role,
                    permissions
                }]
            };
        }

        await setDoc(userMembershipsRef, memberships);
    } catch (error) {
        console.error('❌ Error updating user organization memberships:', error);
        throw error;
    }
}

/**
 * Remove organization from user's memberships
 */
async function removeUserOrganizationMembership(
    userId: string,
    organizationId: string
): Promise<void> {
    try {
        const userMembershipsRef = doc(db, 'userOrganizationMemberships', userId);
        const userMembershipsDoc = await getDoc(userMembershipsRef);

        if (!userMembershipsDoc.exists()) return;

        const memberships = userMembershipsDoc.data() as UserOrganizationMembership;
        memberships.organizations = memberships.organizations.filter(
            org => org.organizationId !== organizationId
        );

        await setDoc(userMembershipsRef, memberships);
    } catch (error) {
        console.error('❌ Error removing user organization membership:', error);
        throw error;
    }
}

/**
 * Check if user is organization admin
 */
export async function isOrganizationAdmin(
    organizationId: string,
    userId: string
): Promise<boolean> {
    const member = await getUserOrganizationRole(organizationId, userId);
    return member?.role === 'org_admin' && member.isActive;
}

/**
 * Check if user is organization vice admin
 */
export async function isOrganizationViceAdmin(
    organizationId: string,
    userId: string
): Promise<boolean> {
    const member = await getUserOrganizationRole(organizationId, userId);
    return member?.role === 'org_vice_admin' && member.isActive;
}

/**
 * Check if user can manage organization
 */
export async function canManageOrganization(
    organizationId: string,
    userId: string
): Promise<boolean> {
    const member = await getUserOrganizationRole(organizationId, userId);
    if (!member || !member.isActive) return false;

    return member.role === 'org_admin' || member.role === 'org_vice_admin';
}
