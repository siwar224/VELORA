"use client";

import { ExternalLink, LogOut, MoonStar, Pause, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { admin } from "@/content/admin";
import { NAV } from "./nav";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewOrder: () => void;
  onToggleSimulator: () => void;
  onToggleClosed: () => void;
  onLogout: () => void;
};

const t = admin.palette;

/** ⌘K / Ctrl+K command palette: jump to a page or run a quick action. */
export default function CommandPalette({ open, onOpenChange, onNewOrder, onToggleSimulator, onToggleClosed, onLogout }: Props) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => () => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t.title} description={t.placeholder}>
      <CommandInput placeholder={t.placeholder} />
      <CommandList>
        <CommandEmpty>{t.empty}</CommandEmpty>
        <CommandGroup heading={t.groups.pages}>
          {NAV.map(({ href, label, icon: Icon }) => (
            <CommandItem key={href} value={label} onSelect={run(() => router.push(href))} className="min-h-11">
              <Icon aria-hidden /> {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t.groups.actions}>
          <CommandItem onSelect={run(onNewOrder)} className="min-h-11">
            <Plus aria-hidden /> {t.actions.newOrder}
          </CommandItem>
          <CommandItem onSelect={run(onToggleSimulator)} className="min-h-11">
            <Pause aria-hidden /> {t.actions.toggleSimulator}
          </CommandItem>
          <CommandItem onSelect={run(onToggleClosed)} className="min-h-11">
            <MoonStar aria-hidden /> {t.actions.toggleClosed}
          </CommandItem>
          <CommandItem onSelect={run(() => window.open("/", "_blank", "noopener"))} className="min-h-11">
            <ExternalLink aria-hidden /> {t.actions.viewSite}
          </CommandItem>
          <CommandItem onSelect={run(onLogout)} className="min-h-11">
            <LogOut aria-hidden /> {t.actions.logout}
            <CommandShortcut />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
