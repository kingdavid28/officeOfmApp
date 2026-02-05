import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
    Building2,
    Users,
    Plus,
    Edit3,
    Trash2,
    DollarSign,
    Settings,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { Department, OrganizationUser } from '../../lib/organization-types';

interface DepartmentManagerProps {
    organizationId: string;
    currentUser: OrganizationUser;
    onDepartmentCreate: (department: Partial<Department>) => Promise<void>;
    onDepartmentUpdate: (departmentId: string, updates: Partial<Department>) => Promise<void>;
    onDepartmentDelete: (departmentId: string) => Promise<void>;
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
    organizationId,
    currentUser,
    onDepartmentCreate,
    onDepartmentUpdate,
    onDepartmentDelete
}) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        managerId: 'none',
        parentDepartmentId: 'none',
        budget: {
            allocated: 0,
            currency: 'USD',
            fiscalYear: new Date().getFullYear()
        },
        settings: {
            allowCrossDepartmentAccess: true,
            requireApprovalForExpenses: false,
            expenseApprovalLimit: 1000,
            defaultProjectVisibility: 'department' as 'department' | 'organization' | 'private'
        }
    });

    // Mock data - replace with actual API calls
    useEffect(() => {
        loadDepartments();
        loadUsers();
    }, [organizationId]);

    const loadDepartments = async () => {
        // Mock departments data
        const mockDepartments: Department[] = [
            {
                id: '1',
                organizationId,
                name: 'Engineering',
                description: 'Software development and technical operations',
                code: 'ENG',
                members: ['user1', 'user2', 'user3'],
                settings: {
                    allowCrossDepartmentAccess: true,
                    requireApprovalForExpenses: true,
                    expenseApprovalLimit: 5000,
                    defaultProjectVisibility: 'department'
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            },
            {
                id: '2',
                organizationId,
                name: 'Marketing',
                description: 'Marketing and customer acquisition',
                code: 'MKT',
                members: ['user4', 'user5'],
                settings: {
                    allowCrossDepartmentAccess: true,
                    requireApprovalForExpenses: false,
                    expenseApprovalLimit: 2000,
                    defaultProjectVisibility: 'organization'
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            },
            {
                id: '3',
                organizationId,
                name: 'Frontend Team',
                description: 'User interface development',
                code: 'FE',
                parentDepartmentId: '1',
                members: ['user1', 'user2'],
                settings: {
                    allowCrossDepartmentAccess: true,
                    requireApprovalForExpenses: false,
                    expenseApprovalLimit: 1000,
                    defaultProjectVisibility: 'department'
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            }
        ];
        setDepartments(mockDepartments);
    };

    const loadUsers = async () => {
        // Mock users data
        const mockUsers: OrganizationUser[] = [
            {
                userId: 'user1',
                organizationId,
                role: 'staff',
                position: 'Frontend Developer',
                startDate: new Date(),
                permissions: [],
                customPermissions: [],
                status: 'active',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@company.com',
                    skills: ['React', 'TypeScript'],
                    certifications: []
                },
                settings: {
                    timezone: 'UTC',
                    language: 'en',
                    notifications: {
                        email: { enabled: true, frequency: 'immediate', types: [] },
                        push: { enabled: true, types: [] },
                        inApp: { enabled: true, types: [], sound: true }
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
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        setUsers(mockUsers);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            code: '',
            managerId: 'none',
            parentDepartmentId: 'none',
            budget: {
                allocated: 0,
                currency: 'USD',
                fiscalYear: new Date().getFullYear()
            },
            settings: {
                allowCrossDepartmentAccess: true,
                requireApprovalForExpenses: false,
                expenseApprovalLimit: 1000,
                defaultProjectVisibility: 'department'
            }
        });
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            const departmentData: Partial<Department> = {
                organizationId,
                name: formData.name,
                description: formData.description,
                code: formData.code,
                managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined,
                parentDepartmentId: formData.parentDepartmentId && formData.parentDepartmentId !== 'none' ? formData.parentDepartmentId : undefined,
                budget: formData.budget.allocated > 0 ? {
                    allocated: formData.budget.allocated,
                    spent: 0,
                    currency: formData.budget.currency,
                    fiscalYear: formData.budget.fiscalYear,
                    categories: []
                } : undefined,
                members: [],
                settings: formData.settings,
                status: 'active'
            };

            await onDepartmentCreate(departmentData);
            setShowCreateForm(false);
            resetForm();
            loadDepartments();
        } catch (error) {
            console.error('Error creating department:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name,
            description: department.description || '',
            code: department.code || '',
            managerId: department.managerId || 'none',
            parentDepartmentId: department.parentDepartmentId || 'none',
            budget: {
                allocated: department.budget?.allocated || 0,
                currency: department.budget?.currency || 'USD',
                fiscalYear: department.budget?.fiscalYear || new Date().getFullYear()
            },
            settings: department.settings
        });
    };

    const handleUpdate = async () => {
        if (!editingDepartment) return;

        setLoading(true);
        try {
            const updates: Partial<Department> = {
                name: formData.name,
                description: formData.description,
                code: formData.code,
                managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined,
                parentDepartmentId: formData.parentDepartmentId && formData.parentDepartmentId !== 'none' ? formData.parentDepartmentId : undefined,
                budget: formData.budget.allocated > 0 ? {
                    ...editingDepartment.budget,
                    allocated: formData.budget.allocated,
                    currency: formData.budget.currency,
                    fiscalYear: formData.budget.fiscalYear
                } : undefined,
                settings: formData.settings
            };

            await onDepartmentUpdate(editingDepartment.id, updates);
            setEditingDepartment(null);
            resetForm();
            loadDepartments();
        } catch (error) {
            console.error('Error updating department:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (departmentId: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;

        setLoading(true);
        try {
            await onDepartmentDelete(departmentId);
            loadDepartments();
        } catch (error) {
            console.error('Error deleting department:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (departmentId: string) => {
        const newExpanded = new Set(expandedDepartments);
        if (newExpanded.has(departmentId)) {
            newExpanded.delete(departmentId);
        } else {
            newExpanded.add(departmentId);
        }
        setExpandedDepartments(newExpanded);
    };

    const getSubDepartments = (parentId: string) => {
        return departments.filter(dept => dept.parentDepartmentId === parentId);
    };

    const getRootDepartments = () => {
        return departments.filter(dept => !dept.parentDepartmentId);
    };

    const getDepartmentManager = (managerId?: string) => {
        if (!managerId) return null;
        return users.find(user => user.userId === managerId);
    };

    const canManageDepartments = () => {
        return currentUser.role === 'org_admin' || currentUser.role === 'dept_manager';
    };

    const renderDepartmentForm = () => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>
                    {editingDepartment ? 'Edit Department' : 'Create New Department'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Department Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Engineering"
                        />
                    </div>
                    <div>
                        <Label htmlFor="code">Department Code</Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="ENG"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the department"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="managerId">Department Manager</Label>
                        <Select
                            value={formData.managerId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No manager</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.userId} value={user.userId}>
                                        {user.profile.firstName} {user.profile.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="parentDepartmentId">Parent Department</Label>
                        <Select
                            value={formData.parentDepartmentId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, parentDepartmentId: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select parent department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No parent (root department)</SelectItem>
                                {departments
                                    .filter(dept => dept.id !== editingDepartment?.id)
                                    .map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="budget">Budget Allocation</Label>
                        <Input
                            id="budget"
                            type="number"
                            value={formData.budget.allocated}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                budget: { ...prev.budget, allocated: Number(e.target.value) }
                            }))}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                            value={formData.budget.currency}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                budget: { ...prev.budget, currency: value }
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="fiscalYear">Fiscal Year</Label>
                        <Input
                            id="fiscalYear"
                            type="number"
                            value={formData.budget.fiscalYear}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                budget: { ...prev.budget, fiscalYear: Number(e.target.value) }
                            }))}
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        onClick={editingDepartment ? handleUpdate : handleCreate}
                        disabled={loading || !formData.name.trim()}
                    >
                        {loading ? 'Saving...' : editingDepartment ? 'Update Department' : 'Create Department'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowCreateForm(false);
                            setEditingDepartment(null);
                            resetForm();
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderDepartment = (department: Department, level: number = 0) => {
        const subDepartments = getSubDepartments(department.id);
        const hasSubDepartments = subDepartments.length > 0;
        const isExpanded = expandedDepartments.has(department.id);
        const manager = getDepartmentManager(department.managerId);

        return (
            <div key={department.id} className="mb-2">
                <Card className={`${level > 0 ? 'ml-6 border-l-4 border-l-blue-200' : ''}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {hasSubDepartments && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpanded(department.id)}
                                        className="p-1 h-6 w-6"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{department.name}</h3>
                                        {department.code && (
                                            <Badge variant="secondary" className="text-xs">
                                                {department.code}
                                            </Badge>
                                        )}
                                    </div>
                                    {department.description && (
                                        <p className="text-sm text-gray-600">{department.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {department.members.length} members
                                        </div>
                                        {department.budget && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                {department.budget.currency} {department.budget.allocated.toLocaleString()}
                                            </div>
                                        )}
                                        {manager && (
                                            <div>
                                                Manager: {manager.profile.firstName} {manager.profile.lastName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {canManageDepartments() && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(department)}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(department.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {hasSubDepartments && isExpanded && (
                    <div className="mt-2">
                        {subDepartments.map(subDept => renderDepartment(subDept, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Department Management</h1>
                    <p className="text-gray-600">Organize your teams and manage department structure</p>
                </div>
                {canManageDepartments() && !showCreateForm && !editingDepartment && (
                    <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Department
                    </Button>
                )}
            </div>

            {(showCreateForm || editingDepartment) && renderDepartmentForm()}

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Organization Structure</h2>
                {getRootDepartments().map(dept => renderDepartment(dept))}
            </div>
        </div>
    );
};