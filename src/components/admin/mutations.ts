import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { admin } from "@/content/admin";
import { deleteMenuItem, saveMenuItem, saveSettings, setAvailability, updateOrderStatus } from "@/lib/data/api";
import { qk } from "@/lib/data/queries";
import type { OrderStatus } from "@/lib/data/types";
import { showFailure } from "./errors";

/**
 * Mutation hooks for the admin. Every one reports a failure the same way: a toast
 * saying what failed and why (readable sentence, never raw error text) with a
 * Retry button that runs the same mutation again with the same variables.
 * Mutations are never retried automatically.
 */
function useToastedMutation<V, R, C = unknown>(options: UseMutationOptions<R, Error, V, C>, failure: (variables: V) => string) {
  const retry = useRef<(variables: V) => void>(() => {});
  const mutation = useMutation<R, Error, V, C>({
    ...options,
    onError: (error, variables, onMutateResult, context) => {
      void options.onError?.(error, variables, onMutateResult, context);
      showFailure(failure(variables), error, () => retry.current(variables));
    },
  });
  useEffect(() => {
    retry.current = mutation.mutate;
  }, [mutation.mutate]);
  return mutation;
}

type MoveVars = { id: string; number: number; status: OrderStatus };

export const useMoveOrder = () =>
  useToastedMutation(
    {
      mutationFn: ({ id, status }: MoveVars) => updateOrderStatus(id, status),
      onSettled: (_data, _error, _vars, _result, context) => context.client.invalidateQueries({ queryKey: qk.orders }),
    },
    (v) => admin.errors.actions.moveOrder(v.number),
  );

type SaveItemVars = Parameters<typeof saveMenuItem>[0];

export const useSaveMenuItem = () =>
  useToastedMutation(
    {
      mutationFn: (item: SaveItemVars) => saveMenuItem(item),
      onSettled: (_data, _error, _vars, _result, context) => context.client.invalidateQueries({ queryKey: qk.menu }),
    },
    (v) => admin.errors.actions.saveItem(v.name),
  );

type DeleteVars = { id: string; name: string };

export const useDeleteMenuItem = () =>
  useToastedMutation(
    {
      mutationFn: ({ id }: DeleteVars) => deleteMenuItem(id),
      onSettled: (_data, _error, _vars, _result, context) => context.client.invalidateQueries({ queryKey: qk.menu }),
    },
    (v) => admin.errors.actions.deleteItem(v.name),
  );

type AvailabilityVars = { id: string; name: string; available: boolean };

export const useSetAvailability = () =>
  useToastedMutation(
    {
      mutationFn: ({ id, available }: AvailabilityVars) => setAvailability(id, available),
      onSettled: (_data, _error, _vars, _result, context) => context.client.invalidateQueries({ queryKey: qk.menu }),
    },
    (v) => admin.errors.actions.availability(v.name),
  );

type SettingsVars = Parameters<typeof saveSettings>[0];

export const useSaveSettings = () =>
  useToastedMutation(
    {
      mutationFn: (settings: SettingsVars) => saveSettings(settings),
      onSettled: (_data, _error, _vars, _result, context) => context.client.invalidateQueries({ queryKey: qk.settings }),
    },
    () => admin.errors.actions.saveSettings,
  );
