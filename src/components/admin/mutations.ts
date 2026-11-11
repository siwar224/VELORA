import { useMutation, useMutationState, type MutateOptions, type QueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { admin } from "@/content/admin";
import { deleteMenuItem, saveMenuItem, saveSettings, setAvailability, updateOrderStatus } from "@/lib/data/api";
import { qk } from "@/lib/data/queries";
import type { MenuItemRecord, Order, OrderStatus, Settings } from "@/lib/data/types";
import { showFailure } from "./errors";

/**
 * Mutation hooks for the admin: OPTIMISTIC UPDATES WITH ROLLBACK.
 *
 * Every hook follows the same recipe:
 *  1. onMutate   - cancel in-flight refetches (so a poll can't overwrite what we're
 *                  about to show), remember what we change, apply it to the cache now;
 *  2. onError    - undo just that change (item-level, so other pending changes survive);
 *                  a toast then says what failed and why, with a Retry button that
 *                  re-runs the same mutation with the same variables;
 *  3. onSettled  - refetch the truth from the server, but only once the last pending
 *                  write for this resource has finished (an earlier refetch could
 *                  briefly flip an item back).
 * Mutations are never retried automatically. A second write to an item that already has
 * one in flight is ignored synchronously (the in-flight guard in useToastedMutation) and
 * the item's controls are disabled (usePendingIds), so two responses can never cross.
 */

/** Items created in the UI carry this id prefix until the server answers with the real one. */
const TEMP_ID = "pending-";
export const isTempId = (id: string) => id.startsWith(TEMP_ID);

const MOVE = ["move-order"];
const MENU_WRITE = ["menu-write"];
const SETTINGS_WRITE = ["settings-write"];

/**
 * useMutation + the shared behaviour of every admin write:
 *  - a failure toast (what failed + why) with a Retry button that re-runs it;
 *  - an in-flight guard: `mutate` does nothing if a write with the same `guardKey` is
 *    still running. The guard is a ref, so it works even when two clicks land before
 *    React has re-rendered (state like `isPending` would be too late).
 * The key is released by the mutation-level onSettled, which fires for every mutation
 * (per-call callbacks only fire for the most recent call).
 */
function useToastedMutation<V, R, C = unknown>(
  options: UseMutationOptions<R, Error, V, C>,
  failure: (variables: V) => string,
  guardKey: (variables: V) => string,
) {
  const retry = useRef<(variables: V) => void>(() => {});
  const inFlight = useRef(new Set<string>());
  const mutation = useMutation<R, Error, V, C>({
    ...options,
    onError: (error, variables, onMutateResult, context) => {
      void options.onError?.(error, variables, onMutateResult, context);
      showFailure(failure(variables), error, () => retry.current(variables));
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      inFlight.current.delete(guardKey(variables));
      return options.onSettled?.(data, error, variables, onMutateResult, context);
    },
  });
  const { mutate: rawMutate } = mutation;
  const mutate = useCallback(
    (variables: V, callbacks?: MutateOptions<R, Error, V, C>) => {
      const key = guardKey(variables);
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      rawMutate(variables, callbacks);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guardKey is a module-level function per hook
    [rawMutate],
  );
  // Retry goes through the guarded mutate too.
  useEffect(() => {
    retry.current = mutate;
  }, [mutate]);
  return { ...mutation, mutate };
}

/** Ids of the items that currently have a write in flight (to disable their controls). */
export function usePendingIds(mutationKey: readonly string[]): Set<string> {
  const ids = useMutationState({
    filters: { mutationKey, status: "pending" },
    select: (m) => (m.state.variables as { id?: string } | undefined)?.id,
  });
  return new Set(ids.filter((id): id is string => !!id));
}
export const usePendingMoves = () => usePendingIds(MOVE);
export const usePendingMenuWrites = () => usePendingIds(MENU_WRITE);

// ---------------------------------------------------------------- orders

type MoveVars = { id: string; number: number; status: OrderStatus };

/** Move an order between kanban columns: the card jumps instantly, and back if the server says no. */
export const useMoveOrder = () =>
  useToastedMutation<MoveVars, Order, { previous?: OrderStatus }>(
    {
      mutationKey: MOVE,
      mutationFn: ({ id, status }) => updateOrderStatus(id, status),
      onMutate: async ({ id, status }, { client }) => {
        await client.cancelQueries({ queryKey: qk.board });
        const previous = client.getQueryData<Order[]>(qk.board)?.find((o) => o.id === id)?.status;
        client.setQueryData<Order[]>(qk.board, (old) => old?.map((o) => (o.id === id ? { ...o, status } : o)));
        return { previous };
      },
      onError: (_error, { id }, result, { client }) => {
        const previous = result?.previous;
        if (previous) client.setQueryData<Order[]>(qk.board, (old) => old?.map((o) => (o.id === id ? { ...o, status: previous } : o)));
      },
      onSettled: (_d, _e, _v, _r, { client }) => {
        if (client.isMutating({ mutationKey: MOVE }) <= 1) void client.invalidateQueries({ queryKey: qk.orders });
      },
    },
    (v) => admin.errors.actions.moveOrder(v.number),
    (v) => v.id,
  );

// ------------------------------------------------------------------ menu

/** Not awaited on purpose: a mutation is finished when the server answered, not when the refetch ends. */
const refetchMenuWhenIdle = (client: QueryClient) => {
  if (client.isMutating({ mutationKey: MENU_WRITE }) <= 1) void client.invalidateQueries({ queryKey: qk.menu });
};

type SaveItemVars = Parameters<typeof saveMenuItem>[0];
type SaveItemContext = { previous?: MenuItemRecord; tempId?: string };

/** Create or edit an item: it appears / changes in the table at once. */
export const useSaveMenuItem = () =>
  useToastedMutation<SaveItemVars, MenuItemRecord, SaveItemContext>(
    {
      mutationKey: MENU_WRITE,
      mutationFn: (item) => saveMenuItem(item),
      onMutate: async (item, { client }) => {
        await client.cancelQueries({ queryKey: qk.menu });
        const { id, ...fields } = item;
        if (id) {
          const previous = client.getQueryData<MenuItemRecord[]>(qk.menu)?.find((m) => m.id === id);
          client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => old?.map((m) => (m.id === id ? { ...m, ...fields } : m)));
          return { previous };
        }
        const tempId = `${TEMP_ID}${Date.now()}`;
        client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => (old ? [...old, { ...fields, id: tempId }] : old));
        return { tempId };
      },
      // As soon as a create succeeds, swap the temporary row for the server's item (real id),
      // so it can be edited at once instead of waiting for the next refetch.
      onSuccess: (saved, _item, result, { client }) => {
        const tempId = result?.tempId;
        if (tempId) client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => old?.map((m) => (m.id === tempId ? saved : m)));
      },
      onError: (_error, item, result, { client }) => {
        client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => {
          if (!old) return old;
          if (result?.tempId) return old.filter((m) => m.id !== result.tempId);
          const previous = result?.previous;
          return previous ? old.map((m) => (m.id === item.id ? previous : m)) : old;
        });
      },
      onSettled: (_d, _e, _v, _r, { client }) => refetchMenuWhenIdle(client),
    },
    (v) => admin.errors.actions.saveItem(v.name),
    (v) => v.id ?? "new-item",
  );

type DeleteVars = { id: string; name: string };

/** Delete an item: the row disappears at once, and returns to its place if the server says no. */
export const useDeleteMenuItem = () =>
  useToastedMutation<DeleteVars, void, { removed?: MenuItemRecord; index: number }>(
    {
      mutationKey: MENU_WRITE,
      mutationFn: ({ id }) => deleteMenuItem(id),
      onMutate: async ({ id }, { client }) => {
        await client.cancelQueries({ queryKey: qk.menu });
        const list = client.getQueryData<MenuItemRecord[]>(qk.menu) ?? [];
        const index = list.findIndex((m) => m.id === id);
        client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => old?.filter((m) => m.id !== id));
        return { removed: list[index], index };
      },
      onError: (_error, _v, result, { client }) => {
        const removed = result?.removed;
        if (!removed) return;
        client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => {
          if (!old || old.some((m) => m.id === removed.id)) return old;
          const next = [...old];
          next.splice(Math.min(result.index, next.length), 0, removed);
          return next;
        });
      },
      onSettled: (_d, _e, _v, _r, { client }) => refetchMenuWhenIdle(client),
    },
    (v) => admin.errors.actions.deleteItem(v.name),
    (v) => v.id,
  );

type AvailabilityVars = { id: string; name: string; available: boolean };

/** The availability switch flips instantly, and back if the save fails. */
export const useSetAvailability = () =>
  useToastedMutation<AvailabilityVars, MenuItemRecord, { previous?: boolean }>(
    {
      mutationKey: MENU_WRITE,
      mutationFn: ({ id, available }) => setAvailability(id, available),
      onMutate: async ({ id, available }, { client }) => {
        await client.cancelQueries({ queryKey: qk.menu });
        const previous = client.getQueryData<MenuItemRecord[]>(qk.menu)?.find((m) => m.id === id)?.available;
        client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => old?.map((m) => (m.id === id ? { ...m, available } : m)));
        return { previous };
      },
      onError: (_error, { id }, result, { client }) => {
        const previous = result?.previous;
        if (previous !== undefined) client.setQueryData<MenuItemRecord[]>(qk.menu, (old) => old?.map((m) => (m.id === id ? { ...m, available: previous } : m)));
      },
      onSettled: (_d, _e, _v, _r, { client }) => refetchMenuWhenIdle(client),
    },
    (v) => admin.errors.actions.availability(v.name),
    (v) => v.id,
  );

// -------------------------------------------------------------- settings

/** Saving settings shows the new hours immediately (website badge follows via the API). */
export const useSaveSettings = () =>
  useToastedMutation<Settings, Settings, { previous?: Settings }>(
    {
      mutationKey: SETTINGS_WRITE,
      mutationFn: (settings) => saveSettings(settings),
      onMutate: async (settings, { client }) => {
        await client.cancelQueries({ queryKey: qk.settings });
        const previous = client.getQueryData<Settings>(qk.settings);
        client.setQueryData<Settings>(qk.settings, settings);
        return { previous };
      },
      onError: (_error, _v, result, { client }) => {
        if (result?.previous) client.setQueryData<Settings>(qk.settings, result.previous);
      },
      onSettled: (_d, _e, _v, _r, { client }) => {
        if (client.isMutating({ mutationKey: SETTINGS_WRITE }) <= 1) void client.invalidateQueries({ queryKey: qk.settings });
      },
    },
    () => admin.errors.actions.saveSettings,
    () => "settings",
  );
