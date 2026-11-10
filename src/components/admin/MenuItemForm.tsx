"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { admin } from "@/content/admin";
import { seedMenu } from "@/lib/data/catalog-seed";
import type { MenuItemRecord } from "@/lib/data/types";

const t = admin.menu.form;
const e = t.errors;

/** Photos available in /public/menu (from the default menu), for the photo picker. */
const PHOTOS = [...new Map(seedMenu().filter((m) => m.image).map((m) => [m.image!, m])).values()];

const schema = z.object({
  name: z.string().trim().min(2, e.name).max(40, e.name),
  category: z.enum(["cold", "espresso", "beans"]),
  price: z.number({ error: e.price }).min(0.5, e.price).max(100, e.price),
  stock: z.number({ error: e.stock }).int(e.stock).min(0, e.stock),
  detail: z.string().trim().max(120, e.detail),
  notes: z
    .string()
    .refine((s) => {
      const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
      return parts.length <= 4 && parts.every((p) => p.length <= 24);
    }, e.notes),
  tag: z.enum(["none", "Signature", "Seasonal"]),
  image: z.string(),
  available: z.boolean(),
});
export type MenuFormValues = z.infer<typeof schema>;

const toValues = (item?: MenuItemRecord): MenuFormValues => ({
  name: item?.name ?? "",
  category: item?.category ?? "cold",
  price: item?.price ?? 5,
  stock: item?.stock ?? 40,
  detail: item?.detail ?? "",
  notes: item?.notes.join(", ") ?? "",
  tag: item?.tag ?? "none",
  image: item?.image ?? "none",
  available: item?.available ?? true,
});

/** Turn form values back into a menu record (keeping photo metadata for known photos). */
export function fromValues(v: MenuFormValues, base?: MenuItemRecord): Omit<MenuItemRecord, "id"> & { id?: string } {
  const photo = PHOTOS.find((p) => p.image === v.image);
  return {
    id: base?.id,
    name: v.name,
    category: v.category,
    price: Math.round(v.price * 100) / 100,
    stock: v.stock,
    detail: v.detail,
    notes: v.notes.split(",").map((n) => n.trim()).filter(Boolean),
    tag: v.tag === "none" ? undefined : v.tag,
    image: v.image === "none" ? undefined : v.image,
    alt: v.image === "none" ? undefined : base?.image === v.image ? base.alt : photo?.alt,
    focus: v.image === "none" ? undefined : base?.image === v.image ? base.focus : photo?.focus,
    aspect: v.image === "none" ? undefined : base?.image === v.image ? base.aspect : photo?.aspect,
    available: v.available,
  };
}

type Props = {
  open: boolean;
  item?: MenuItemRecord; // undefined = add
  onOpenChange: (open: boolean) => void;
  onSave: (values: MenuFormValues) => Promise<void>;
};

/** Add / edit a menu item in a side sheet (react-hook-form + zod). */
export default function MenuItemForm({ open, item, onOpenChange, onSave }: Props) {
  const { register, control, handleSubmit, reset, formState } = useForm<MenuFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toValues(item),
  });
  const { errors, isSubmitting } = formState;

  useEffect(() => {
    if (open) reset(toValues(item));
  }, [open, item, reset]);

  const field = (id: keyof MenuFormValues) => ({
    id: `menu-${id}`,
    "aria-invalid": !!errors[id],
    "aria-describedby": errors[id] ? `menu-${id}-error` : undefined,
  });
  const err = (id: keyof MenuFormValues) =>
    errors[id] && (
      <p id={`menu-${id}-error`} className="text-sm text-destructive">
        {errors[id]?.message}
      </p>
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-serif text-3xl font-normal">{item ? t.editTitle : t.addTitle}</SheetTitle>
          <SheetDescription>{admin.menu.subtitle}</SheetDescription>
        </SheetHeader>

        <form id="menu-form" onSubmit={handleSubmit(onSave)} noValidate className="space-y-5 px-4">
          <div className="space-y-2">
            <Label htmlFor="menu-name">{t.name}</Label>
            <Input className="h-11" {...field("name")} {...register("name")} />
            {err("name")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-category">{t.category}</Label>
              <Controller
                control={control}
                name="category"
                render={({ field: f }) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger id="menu-category" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["cold", "espresso", "beans"] as const).map((c) => (
                        <SelectItem key={c} value={c} className="min-h-10">
                          {admin.menu.categories[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-tag">{t.tag}</Label>
              <Controller
                control={control}
                name="tag"
                render={({ field: f }) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger id="menu-tag" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="min-h-10">{t.noTag}</SelectItem>
                      <SelectItem value="Signature" className="min-h-10">Signature</SelectItem>
                      <SelectItem value="Seasonal" className="min-h-10">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-price">{t.price}</Label>
              <Input className="h-11" type="number" inputMode="decimal" step="0.1" min="0.5" {...field("price")} {...register("price", { valueAsNumber: true })} />
              {err("price")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-stock">{t.stock}</Label>
              <Input className="h-11" type="number" inputMode="numeric" step="1" min="0" {...field("stock")} {...register("stock", { valueAsNumber: true })} />
              {err("stock")}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-detail">{t.detail}</Label>
            <Textarea rows={2} {...field("detail")} {...register("detail")} />
            {err("detail")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-notes">{t.notes}</Label>
            <Input className="h-11" {...field("notes")} aria-describedby={errors.notes ? "menu-notes-error" : "menu-notes-hint"} {...register("notes")} />
            <p id="menu-notes-hint" className="text-sm text-muted-foreground">{t.notesHint}</p>
            {err("notes")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menu-image">{t.image}</Label>
            <Controller
              control={control}
              name="image"
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger id="menu-image" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="min-h-10">{t.noImage}</SelectItem>
                    {PHOTOS.map((p) => (
                      <SelectItem key={p.image} value={p.image!} className="min-h-10">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border bg-card px-3">
            <Label htmlFor="menu-available">{t.available}</Label>
            <Controller control={control} name="available" render={({ field: f }) => <Switch id="menu-available" checked={f.value} onCheckedChange={f.onChange} />} />
          </div>
        </form>

        <SheetFooter className="flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button type="submit" form="menu-form" disabled={isSubmitting}>
            {t.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
