import api from './api';
import { cacheService } from './CacheService';

/**
 * Admin Service handles administrative data with caching.
 */
export const getAdminUsers = async () => {
  return cacheService.get('admin_users', async () => {
    const res = await api.get('/admin/users');
    return res.data.data || [];
  });
};

export const getRoleRequests = async () => {
  return cacheService.get('admin_role_requests', async () => {
    const res = await api.get('/admin/partners/role-requests');
    return res.data.data || [];
  });
};

export const getAdminStats = async () => {
  return cacheService.get('admin_stats', async () => {
    const [users, requests] = await Promise.all([
      getAdminUsers(),
      getRoleRequests()
    ]);

    return {
      totalUsers: users.length,
      pendingRoles: requests.filter(r => r.status === 'pending').length,
      totalPartners: users.filter(u => u.role !== 'user' && u.role !== 'admin').length
    };
  });
};

export const getDashboardData = async (range = 'weekly') => {
  return cacheService.get(`admin_dashboard_stats_${range}`, async () => {
    const res = await api.get(`/admin/dashboard/stats?range=${range}`);
    return res.data.data;
  });
};

export const getActivities = async (limit = 8) => {
  return cacheService.get(`admin_activities_${limit}`, async () => {
    const res = await api.get(`/admin/dashboard/activities?limit=${limit}`);
    return res.data.data || [];
  });
};

/**
 * Forces a refresh of the admin cache.
 */
export const refreshAdminCache = () => {
  cacheService.invalidate('admin_');
  // Trigger a window event so UI components can react
  window.dispatchEvent(new CustomEvent('refreshAdminBadges'));
};

// Listen for global refresh events
window.addEventListener('refreshAdminBadges', () => {
  cacheService.invalidate('admin_');
});
