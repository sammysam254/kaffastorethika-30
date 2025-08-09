import { useState, useEffect } from 'react';
import { useAdmin, UserProfile } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, ShieldCheck, UserMinus, UserPlus, Crown, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const UsersManager = () => {
  const { fetchUsers, makeUserAdmin, removeUserAdmin, makeSuperAdmin, resignSuperAdmin, isSuperAdmin } = useAdmin();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    const action = isCurrentlyAdmin ? 'remove admin access from' : 'grant admin access to';
    
    try {
      if (isCurrentlyAdmin) {
        await removeUserAdmin(userId);
      } else {
        await makeUserAdmin(userId);
      }
      loadUsers();
    } catch (error) {
      console.error('Error updating user admin status:', error);
      toast.error('Failed to update user admin status');
    }
  };

  const handleMakeSuperAdmin = async (userId: string) => {
    try {
      await makeSuperAdmin(userId);
      loadUsers();
    } catch (error) {
      console.error('Error promoting to super admin:', error);
      toast.error('Failed to promote to super admin');
    }
  };

  const handleResignSuperAdmin = async () => {
    try {
      await resignSuperAdmin();
      loadUsers();
    } catch (error) {
      console.error('Error resigning from super admin:', error);
      toast.error('Failed to resign from super admin');
    }
  };

  const handleRemoveSuperAdmin = async (userId: string) => {
    try {
      // Remove super admin role and add admin role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'super_admin');

      await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: 'admin' }]);

      loadUsers();
      toast.success('Super admin privileges removed successfully');
    } catch (error) {
      console.error('Error removing super admin privileges:', error);
      toast.error('Failed to remove super admin privileges');
    }
  };

  const handleMakeSuperAdminDirect = async (userId: string) => {
    try {
      // Add both admin and super_admin roles for direct promotion
      await supabase
        .from('user_roles')
        .upsert([
          { user_id: userId, role: 'admin' },
          { user_id: userId, role: 'super_admin' }
        ], { onConflict: 'user_id,role' });

      loadUsers();
      toast.success('User promoted to super admin successfully');
    } catch (error) {
      console.error('Error promoting to super admin:', error);
      toast.error('Failed to promote to super admin');
    }
  };

  const getUserRoles = (user: UserProfile) => {
    return user.user_roles?.map(role => role.role) || [];
  };

  const isAdmin = (user: UserProfile) => {
    const roles = getUserRoles(user);
    return roles.includes('admin') || roles.includes('super_admin');
  };

  const isSuperAdminUser = (user: UserProfile) => {
    return getUserRoles(user).includes('super_admin');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const canRemoveAdmin = (userId: string) => {
    if (!isSuperAdmin) return false;
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return false;
    
    // Only sammyseth260@gmail.com can remove super admin privileges
    if (isSuperAdminUser(targetUser)) {
      return currentUser?.email === 'sammyseth260@gmail.com';
    }
    
    return true;
  };

  const canRemoveSuperAdmin = (userId: string) => {
    // Only sammyseth260@gmail.com can remove super admin privileges from others
    return currentUser?.email === 'sammyseth260@gmail.com' && userId !== currentUser?.id;
  };

  const canMakeSuperAdmin = (userId: string) => {
    // Any super admin can promote users to super admin
    if (!isSuperAdmin) return false;
    
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return false;
    
    // Can promote any user (admin or regular) to super admin
    return !isSuperAdminUser(targetUser);
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  const adminUsers = users.filter(user => isAdmin(user));
  const regularUsers = users.filter(user => !isAdmin(user));
  const superAdminUsers = users.filter(user => isSuperAdminUser(user));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Users Management ({users.length})</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadUsers}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{superAdminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users Section */}
      {adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5" />
              <span>Admin Users ({adminUsers.length})</span>
            </CardTitle>
            <CardDescription>
              Users with administrative privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback>
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.display_name || 'Unnamed User'}</div>
                            <div className="text-sm text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {getUserRoles(user).map((role) => (
                            <Badge key={role} variant={role === 'super_admin' ? 'default' : 'secondary'} className={role === 'super_admin' ? 'bg-yellow-600' : ''}>
                              {role === 'super_admin' && <Crown className="h-3 w-3 mr-1" />}
                              {role.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {isSuperAdminUser(user) ? (
                            // Super Admin Actions
                            <>
                              {user.user_id === currentUser?.id && currentUser?.email === 'sammyseth260@gmail.com' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                      <LogOut className="h-4 w-4 mr-2" />
                                      Resign
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Resign from Super Admin?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to resign from your super admin role? You will become a regular admin. 
                                        Make sure to promote another user to super admin first to maintain system administration.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleResignSuperAdmin} className="bg-red-600 hover:bg-red-700">
                                        Resign
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          ) : (
                            // Regular Admin Actions
                            <>
                              {canMakeSuperAdmin(user.user_id) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-yellow-600 hover:text-yellow-700">
                                      <Crown className="h-4 w-4 mr-2" />
                                      Make Super Admin
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Promote to Super Admin?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to promote this user to super admin? 
                                        Super admins have unrestricted access and can manage other admins.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleMakeSuperAdmin(user.user_id)}>
                                        Promote
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {canRemoveAdmin(user.user_id) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                      <UserMinus className="h-4 w-4 mr-2" />
                                      Remove Admin
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove admin access from this user?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleToggleAdmin(user.user_id, true)} className="bg-red-600 hover:bg-red-700">
                                        Remove Admin
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </>
                          )}
                          
                          {/* Special actions for super admins - only visible to sammyseth260@gmail.com */}
                          {isSuperAdminUser(user) && canRemoveSuperAdmin(user.user_id) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Remove Super Admin
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Super Admin Privileges?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove super admin privileges from this user? 
                                    They will become a regular admin.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveSuperAdmin(user.user_id)} className="bg-red-600 hover:bg-red-700">
                                    Remove Super Admin
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regular Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Regular Users ({regularUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Standard users without administrative privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>
                            {getInitials(user.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.display_name || 'Unnamed User'}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.user_id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.email || 'No email'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {getUserRoles(user).length > 0 ? (
                          getUserRoles(user).map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">user</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSuperAdmin && (
                        <div className="flex space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Make Admin
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Grant Admin Access?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to grant admin access to this user?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleToggleAdmin(user.user_id, false)}>
                                  Grant Access
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          {/* Direct super admin promotion - only for sammyseth260@gmail.com */}
                          {canMakeSuperAdmin(user.user_id) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-yellow-600 hover:text-yellow-700">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Super Admin
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Promote to Super Admin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to promote this user directly to super admin? 
                                    This will grant them full administrative privileges.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleMakeSuperAdminDirect(user.user_id)}>
                                    Promote to Super Admin
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found. Users will appear here when they register for accounts.
        </div>
      )}
    </div>
  );
};

export default UsersManager;