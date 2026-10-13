import { api } from "@/lib/apiClient";
import { Group } from "@/lib/types";
import { appCache } from "@/lib/appCache";

const GROUPS_KEY = "groups:me";

export const GroupsRepository = {
  async getGroupsByTeacherId(forceRefresh = false): Promise<Group[]> {
    if (!forceRefresh) {
      const cached = appCache.get<Group[]>(GROUPS_KEY);
      if (cached) return cached;
    }
    const data = await api.get<Group[]>("/groups");
    appCache.set(GROUPS_KEY, data, 2 * 60 * 1000); // 2 دقيقة — groups تتغير أكثر من grades
    return data;
  },

  async getGroupsBySubTeacherId(subTeacherId: string): Promise<Group[]> {
    return api.get<Group[]>(`/groups/sub-teacher/${subTeacherId}`);
  },

  async getAllGroups(): Promise<Group[]> {
    return GroupsRepository.getGroupsByTeacherId();
  },

  async addGroup(group: Omit<Group, "id" | "created_at">): Promise<Group> {
    const result = await api.post<Group>("/groups", group);
    appCache.invalidate(GROUPS_KEY);
    return result;
  },

  async addGroupsBulk(groups: Omit<Group, "id" | "created_at">[]): Promise<Group[]> {
    const result = await api.post<Group[]>("/groups/bulk", groups);
    appCache.invalidate(GROUPS_KEY);
    return result;
  },

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    const result = await api.patch<Group>(`/groups/${id}`, updates);
    appCache.invalidate(GROUPS_KEY);
    return result;
  },

  async toggleCancelSession(groupId: string, date: string): Promise<Group> {
    const result = await api.post<Group>(`/groups/${groupId}/cancel-session`, { date });
    appCache.invalidate(GROUPS_KEY);
    return result;
  },

  async deleteGroup(id: string): Promise<void> {
    await api.delete(`/groups/${id}`);
    appCache.invalidate(GROUPS_KEY);
  },

  async deleteGroupsBulk(ids: string[]): Promise<void> {
    await api.delete("/groups/bulk", { ids });
    appCache.invalidate(GROUPS_KEY);
  },

  async updateGroupsByGradeId(gradeId: string, updates: Partial<Group>): Promise<void> {
    await api.patch(`/groups/by-grade/${gradeId}`, updates);
    appCache.invalidate(GROUPS_KEY);
  },
};
