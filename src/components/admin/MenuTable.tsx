"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { admin } from "@/content/admin";
import { menuQuery } from "@/lib/data/queries";
import { LOW_STOCK } from "@/lib/data/stats";
import type { Category, MenuItemRecord } from "@/lib/data/types";
import MenuItemForm, { fromValues, type MenuFormValues } from "./MenuItemForm";
import { useDeleteMenuItem, useSaveMenuItem, useSetAvailability } from "./mutations";
import PageHeader from "./PageHeader";
import QueryGate from "./QueryGate";
import { MenuTableSkeleton } from "./skeletons";

const t = admin.menu;
const eur = new Intl.NumberFormat(admin.common.locale, { style: "currency", currency: admin.common.currency });

function SortHeader({ label, onClick, sorted }: { label: string; onClick: () => void; sorted: false | "asc" | "desc" }) {
  return (
    <button type="button" onClick={onClick} className="-ml-2 inline-flex h-11 items-center gap-1 rounded px-2 hover:text-foreground">
      {label}
      <ArrowUpDown aria-hidden className="size-3.5" />
      <span className="sr-only">{sorted ? `(sorted ${sorted === "asc" ? "ascending" : "descending"})` : "(sortable)"}</span>
    </button>
  );
}

/** Menu CRUD: TanStack Table + add/edit sheet + delete confirmation. */
const NONE: MenuItemRecord[] = [];

export default function MenuTable() {
  const menuQ = useQuery(menuQuery());
  const menu = menuQ.data ?? NONE;
  const save = useSaveMenuItem();
  const remove = useDeleteMenuItem();
  const { mutate: toggleAvailable } = useSetAvailability();
  const router = useRouter();
  const params = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [editing, setEditing] = useState<MenuItemRecord | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<MenuItemRecord | undefined>();
  const [status, setStatus] = useState("");

  // ?edit=<id> (from the low-stock list) opens that item.
  const editId = params.get("edit");
  useEffect(() => {
    if (!editId) return;
    const item = menu.find((m) => m.id === editId);
    if (item) {
      setEditing(item);
      setFormOpen(true);
    }
    router.replace("/admin/menu");
  }, [editId, menu, router]);

  const data = useMemo(() => (category === "all" ? menu : menu.filter((m) => m.category === category)), [menu, category]);

  const columns = useMemo<ColumnDef<MenuItemRecord>[]>(
    () => [
      {
        id: "item",
        accessorKey: "name",
        header: ({ column }) => <SortHeader label={t.columns.item} sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />,
        cell: ({ row: { original: m } }) => (
          <div className="flex items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
              {m.image && <Image src={encodeURI(m.image)} alt="" fill sizes="44px" className="object-cover" style={{ objectPosition: m.focus ?? "50% 45%" }} />}
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-medium">
                {m.name}
                {m.tag && <Badge variant="outline" className="font-normal">{m.tag}</Badge>}
              </p>
              <p className="truncate text-sm text-muted-foreground">{m.detail}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "category", header: t.columns.category, cell: ({ getValue }) => t.categories[getValue<Category>()] },
      {
        accessorKey: "price",
        header: ({ column }) => <SortHeader label={t.columns.price} sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />,
        cell: ({ getValue }) => <span className="tabular-nums">{eur.format(getValue<number>())}</span>,
      },
      {
        accessorKey: "stock",
        header: ({ column }) => <SortHeader label={t.columns.stock} sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v <= LOW_STOCK ? <Badge variant={v <= 5 ? "destructive" : "secondary"} className="tabular-nums">{v}</Badge> : <span className="tabular-nums">{v}</span>;
        },
      },
      {
        accessorKey: "available",
        header: t.columns.available,
        enableGlobalFilter: false,
        cell: ({ row: { original: m } }) => (
          <Switch checked={m.available} onCheckedChange={(v) => toggleAvailable({ id: m.id, name: m.name, available: v })} aria-label={t.availableLabel(m.name)} />
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t.columns.actions}</span>,
        cell: ({ row: { original: m } }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t.rowActions(m.name)}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="min-h-11"
                onSelect={() => {
                  setEditing(m);
                  setFormOpen(true);
                }}
              >
                {t.edit}
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-11 text-destructive focus:text-destructive" onSelect={() => setDeleting(m)}>
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [toggleAvailable],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    globalFilterFn: (row, _id, value: string) => {
      const m = row.original;
      return `${m.name} ${m.detail} ${m.notes.join(" ")}`.toLowerCase().includes(value.toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const onSave = async (values: MenuFormValues) => {
    try {
      await save.mutateAsync(fromValues(values, editing));
      setFormOpen(false);
      setStatus(t.saved);
    } catch {
      // The failure toast (with Retry) comes from the mutation hook; the sheet stays open so nothing typed is lost.
    }
  };

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle}>
        <Button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden /> {t.add}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} aria-label={t.search} className="h-11 pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as "all" | Category)}>
          <SelectTrigger className="h-11 w-48" aria-label={t.columns.category}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="min-h-10">{t.allCategories}</SelectItem>
            {(["cold", "espresso", "beans"] as const).map((c) => (
              <SelectItem key={c} value={c} className="min-h-10">
                {t.categories[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p role="status" className="sr-only">{status}</p>

      <QueryGate queries={[menuQ]} skeleton={<MenuTableSkeleton />}>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} aria-sort={h.column.getIsSorted() === "asc" ? "ascending" : h.column.getIsSorted() === "desc" ? "descending" : undefined}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.original.available ? undefined : "bg-muted/40"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </QueryGate>

      <MenuItemForm open={formOpen} item={editing} onOpenChange={setFormOpen} onSave={onSave} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <DialogContent>
          <DialogTitle className="font-serif text-2xl font-normal">{t.deleteConfirm.title}</DialogTitle>
          <DialogDescription>{deleting && t.deleteConfirm.body(deleting.name)}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              {t.deleteConfirm.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleting) {
                  try {
                    await remove.mutateAsync({ id: deleting.id, name: deleting.name });
                    setStatus(t.deleted);
                  } catch {
                    // The failure toast (with Retry) comes from the mutation hook.
                  }
                }
                setDeleting(undefined);
              }}
            >
              {t.deleteConfirm.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
