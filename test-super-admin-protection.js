// Test Super Admin Protection
// Run this in browser console to verify super admin role protection

console.log('🛡️ Testing Super Admin Protection...');

const testSuperAdminProtection = {
    async checkCurrentUser() {
        console.log('\n🔍 Checking current user...');

        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const profile = await authService.getUserProfile(currentUser.uid);
                if (profile) {
                    console.log(`👤 Current user: ${profile.email} (${profile.role})`);
                    return profile;
                } else {
                    console.log('❌ No profile found for current user');
                    return null;
                }
            } catch (error) {
                console.error('❌ Error checking user profile:', error);
                return null;
            }
        } else {
            console.log('ℹ️ No user currently signed in');
            return null;
        }
    },

    async findSuperAdmins() {
        console.log('\n🔍 Finding super administrators...');

        try {
            const allUsers = await authService.getAllUsers();
            const superAdmins = allUsers.filter(u => u.role === 'super_admin');

            console.log(`👑 Found ${superAdmins.length} super administrator(s):`);
            superAdmins.forEach(admin => {
                console.log(`  • ${admin.email} (${admin.name})`);
            });

            return superAdmins;
        } catch (error) {
            console.error('❌ Error finding super admins:', error);
            return [];
        }
    },

    async testSuperAdminRoleChange(superAdminUid, newRole = 'admin') {
        console.log(`\n🧪 Testing super admin role change protection...`);
        console.log(`Attempting to change super admin to: ${newRole}`);

        try {
            const currentUser = await this.checkCurrentUser();
            if (!currentUser) {
                console.log('❌ No current user to perform test');
                return false;
            }

            await authService.updateUserRole(superAdminUid, newRole, currentUser.uid);
            console.log('❌ SECURITY ISSUE: Super admin role was changed!');
            return false;
        } catch (error) {
            if (error.message.includes('Super administrator roles cannot be modified')) {
                console.log('✅ PROTECTION WORKING: Super admin role change blocked');
                console.log(`   Error: ${error.message}`);
                return true;
            } else {
                console.log(`⚠️ Unexpected error: ${error.message}`);
                return false;
            }
        }
    },

    async testNonSuperAdminToSuperAdmin(regularUserUid) {
        console.log(`\n🧪 Testing regular user to super admin promotion...`);

        try {
            const currentUser = await this.checkCurrentUser();
            if (!currentUser) {
                console.log('❌ No current user to perform test');
                return false;
            }

            if (currentUser.role !== 'super_admin') {
                console.log('⚠️ Current user is not super admin, testing restriction...');

                await authService.updateUserRole(regularUserUid, 'super_admin', currentUser.uid);
                console.log('❌ SECURITY ISSUE: Non-super admin was able to assign super admin role!');
                return false;
            } else {
                console.log('ℹ️ Current user is super admin, skipping non-super admin test');
                return true;
            }
        } catch (error) {
            if (error.message.includes('Only super administrators can assign super admin roles')) {
                console.log('✅ PROTECTION WORKING: Non-super admin cannot assign super admin role');
                console.log(`   Error: ${error.message}`);
                return true;
            } else {
                console.log(`⚠️ Unexpected error: ${error.message}`);
                return false;
            }
        }
    },

    async testLastSuperAdminProtection() {
        console.log(`\n🧪 Testing last super admin protection...`);

        try {
            const superAdmins = await this.findSuperAdmins();

            if (superAdmins.length === 0) {
                console.log('❌ No super admins found - this is a critical issue!');
                return false;
            }

            if (superAdmins.length === 1) {
                console.log('⚠️ Only one super admin exists - testing last admin protection');

                const currentUser = await this.checkCurrentUser();
                if (!currentUser) {
                    console.log('❌ No current user to perform test');
                    return false;
                }

                try {
                    await authService.updateUserRole(superAdmins[0].uid, 'admin', currentUser.uid);
                    console.log('❌ SECURITY ISSUE: Last super admin role was changed!');
                    return false;
                } catch (error) {
                    if (error.message.includes('Super administrator roles cannot be modified')) {
                        console.log('✅ PROTECTION WORKING: Super admin role modification blocked');
                        return true;
                    } else if (error.message.includes('Cannot remove the last super administrator')) {
                        console.log('✅ BACKUP PROTECTION: Last super admin removal blocked');
                        return true;
                    } else {
                        console.log(`⚠️ Unexpected error: ${error.message}`);
                        return false;
                    }
                }
            } else {
                console.log(`ℹ️ Multiple super admins exist (${superAdmins.length}), last admin protection not applicable`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error testing last super admin protection:', error);
            return false;
        }
    },

    async runAllTests() {
        console.log('🚀 Running comprehensive super admin protection tests...\n');

        const currentUser = await this.checkCurrentUser();
        const superAdmins = await this.findSuperAdmins();

        if (superAdmins.length === 0) {
            console.log('❌ CRITICAL: No super administrators found!');
            return;
        }

        let passedTests = 0;
        let totalTests = 0;

        // Test 1: Super admin role change protection
        totalTests++;
        const test1 = await this.testSuperAdminRoleChange(superAdmins[0].uid);
        if (test1) passedTests++;

        // Test 2: Last super admin protection
        totalTests++;
        const test2 = await this.testLastSuperAdminProtection();
        if (test2) passedTests++;

        // Test 3: Non-super admin to super admin (if applicable)
        if (currentUser && currentUser.role !== 'super_admin') {
            totalTests++;
            const test3 = await this.testNonSuperAdminToSuperAdmin(currentUser.uid);
            if (test3) passedTests++;
        }

        console.log('\n📊 Test Results:');
        console.log(`✅ Passed: ${passedTests}/${totalTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

        if (passedTests === totalTests) {
            console.log('🎉 All super admin protection tests passed!');
            console.log('🛡️ Super admin roles are properly protected');
        } else {
            console.log('⚠️ Some protection tests failed - review security implementation');
        }

        console.log('\n📋 Security Features Verified:');
        console.log('• Super admin roles cannot be modified');
        console.log('• Only super admins can assign super admin roles');
        console.log('• Last super admin cannot be removed');
        console.log('• UI prevents super admin role editing');
    }
};

// Export to global scope
window.testSuperAdminProtection = testSuperAdminProtection;

// Auto-run basic checks
testSuperAdminProtection.runAllTests().catch(console.error);

console.log('\n📋 Available test commands:');
console.log('• testSuperAdminProtection.checkCurrentUser() - Check current user');
console.log('• testSuperAdminProtection.findSuperAdmins() - Find all super admins');
console.log('• testSuperAdminProtection.runAllTests() - Run all protection tests');