import api from './api';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const getUsers = async () => {
  const roles = ['USER_ROLE', 'ADMIN_ROLE'];
  const all = [];
  const seen = new Set();

  for (let i = 0; i < roles.length; i++) {
    try {
      if (i > 0) await delay(400);
      const res = await api.get(`/users/by-role/${roles[i]}`);
      const d = res.data;
      const items = d?.data ?? d?.users ?? d?.items ?? (Array.isArray(d) ? d : []);
      items.forEach(u => {
        const id = u.Id || u.id || u._id;
        if (id && !seen.has(id)) {
          seen.add(id);
          all.push({ ...u, _roleName: roles[i] });
        }
      });
    } catch (e) {
      if (e?.response?.status !== 403) console.warn(`Error fetching ${roles[i]}:`, e?.message);
    }
  }

  return { data: { data: all } };
};

export const changeRole = (id, roleName) =>
  api.put(`/users/change-role/${id}`, { roleName });

export const getUserRoles = (id) =>
  api.get(`/users/${id}/roles`);