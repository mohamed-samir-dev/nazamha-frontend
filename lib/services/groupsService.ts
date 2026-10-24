import { GroupsRepository } from "@/lib/repositories/groupsRepository";
import { Group } from "@/lib/types";

export const GroupsService = {
  async getGroupsByTeacherId(forceRefresh = false): Promise<Group[]> {
    return GroupsRepository.getGroupsByTeacherId(forceRefresh);
  },

  async getGroupsBySubTeacherId(subTeacherId: string): Promise<Group[]> {
    return GroupsRepository.getGroupsBySubTeacherId(subTeacherId);
  },

  async getAllGroups(): Promise<Group[]> {
    return GroupsRepository.getAllGroups();
  },

  async addGroup(group: Omit<Group, "id" | "created_at">): Promise<Group> {
    return GroupsRepository.addGroup(group);
  },

  async addGroupsBulk(groups: Omit<Group, "id" | "created_at">[]): Promise<Group[]> {
    return GroupsRepository.addGroupsBulk(groups);
  },

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group> {
    return GroupsRepository.updateGroup(id, updates);
  },

  async toggleCancelSession(groupId: string, date: string, cancelled?: boolean): Promise<Group> {
    return GroupsRepository.toggleCancelSession(groupId, date, cancelled);
  },

  async deleteGroup(id: string, deleteStudents = false): Promise<void> {
    return GroupsRepository.deleteGroup(id, deleteStudents);
  },

  async deleteGroupsBulk(ids: string[]): Promise<void> {
    return GroupsRepository.deleteGroupsBulk(ids);
  },

  async updateGroupsByGradeId(gradeId: string, updates: Partial<Group>): Promise<void> {
    return GroupsRepository.updateGroupsByGradeId(gradeId, updates);
  }
};
