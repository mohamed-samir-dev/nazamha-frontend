import useSWR, { mutate } from "swr";
import { GroupsService } from "@/lib/services/groupsService";
import { Group } from "@/lib/types";

const KEY = "/groups";

const fetcher = () => GroupsService.getGroupsByTeacherId(true);

export function useGroups() {
  const { data, error, isLoading, isValidating } = useSWR<Group[]>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5_000,
    keepPreviousData: true,
  });

  const addGroup = (group: Group) =>
    mutate(KEY, (prev: Group[] = []) => [group, ...prev], { revalidate: true });

  const updateGroup = (updated: Group) =>
    mutate(KEY, (prev: Group[] = []) => prev.map((g) => g.id === updated.id ? updated : g), { revalidate: true });

  const removeGroup = (id: string) =>
    mutate(KEY, (prev: Group[] = []) => prev.filter((g) => g.id !== id), { revalidate: true });

  const removeGroups = (ids: string[]) =>
    mutate(KEY, (prev: Group[] = []) => prev.filter((g) => !ids.includes(g.id)), { revalidate: true });

  const revalidate = () => mutate(KEY);

  return {
    groups: data ?? [],
    loading: isLoading,
    validating: isValidating,
    error,
    addGroup,
    updateGroup,
    removeGroup,
    removeGroups,
    revalidate,
  };
}
