import api from './api';

// El backend no tiene GET /users/ — usa by-role para traer todos
export const getUsers = async () => {
  const roles = ['USER_ROLE', 'ADMIN_ROLE', 'MANAGER_ROLE', 'ATM_ROLE'];
  const results = await Promise.allSettled(
    roles.map(r => api.get(`/users/by-role/${r}`))
  );
  const all = [];
  const seen = new Set();
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const d = result.value.data;
      const items = d?.data ?? d?.users ?? d?.items ?? (Array.isArray(d) ? d : []);
      items.forEach(u => {
        const id = u.Id || u.id || u._id;
        if (id && !seen.has(id)) {
          seen.add(id);
          all.push({ ...u, _roleName: roles[i] });
        }
      });
    }
  });
  return { data: { data: all } };
};

export const changeRole = (id, roleName) =>
  api.put(`/users/change-role/${id}`, { roleName });

export const getUserRoles = (id) =>
  api.get(`/users/${id}/roles`);