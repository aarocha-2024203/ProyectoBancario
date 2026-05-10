import api from './api';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const getUsers = async () => {
  const roles = ['ADMIN_ROLE', 'USER_ROLE']; // ADMIN primero para que tome precedencia
  const all   = [];
  const seen  = new Set();

  for (let i = 0; i < roles.length; i++) {
    try {
      if (i > 0) await delay(2000);
      const res   = await api.get(`/users/by-role/${roles[i]}`);
      const d     = res.data;
      const items = Array.isArray(d) ? d
                  : Array.isArray(d?.data) ? d.data
                  : [];
      items.forEach(u => {
        const id = String(u.id || u.Id || '');
        if (id && !seen.has(id)) {
          seen.add(id);
          // El campo 'role' que devuelve el backend ya tiene el rol correcto
          all.push({ ...u, _fetchedRole: roles[i] });
        }
      });
    } catch (e) {
      console.warn(`[getUsers] ${roles[i]}: ${e?.response?.status}`);
    }
  }

  return { data: all };
};

export const changeRole = async (id, roleName) => {
  const res = await api.put(`/users/change-role/${id}`, { roleName });
  return res;
};

export const getUserRoles = (id) =>
  api.get(`/users/${id}/roles`);