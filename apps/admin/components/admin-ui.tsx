"use client";

import type { ReactNode } from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export {
  Button,
  Card,
  Input,
  NativeSelect,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
};

export function Badge({ value, children }: { value?: unknown; children?: ReactNode }) {
  const status = String(value ?? children).toLowerCase().replaceAll("_", "-");
  return <ShadcnBadge variant="secondary" className={`ui-badge badge-${status}`}>{children ?? String(value)}</ShadcnBadge>;
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <Label className={`ui-field ${className}`}><span>{label}</span>{children}</Label>;
}

export function Dialog({ open, title, description, onClose, children, dismissible = true }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; dismissible?: boolean }) {
  return (
    <ShadcnDialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="ui-dialog sm:max-w-[520px]" showCloseButton={dismissible}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="ui-empty"><div className="empty-orbit" /><strong>{title}</strong><p>{description}</p>{action}</div>;
}

export function Pagination({ page, totalPages, label, previous, next, onPage }: { page: number; totalPages: number; label: string; previous: string; next: string; onPage: (page: number) => void }) {
  if (totalPages <= 1) return <div className="ui-pagination"><span>{label}</span></div>;
  const pages = Array.from(new Set([1, Math.max(1, page - 1), page, Math.min(totalPages, page + 1), totalPages])).sort((a, b) => a - b);
  return <div className="ui-pagination"><span>{label}</span><div><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{previous}</Button>{pages.map((value) => <Button key={value} variant={value === page ? "default" : "ghost"} size="sm" onClick={() => onPage(value)}>{value}</Button>)}<Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>{next}</Button></div></div>;
}

export function Flag({ language }: { language: "id" | "en" }) {
  return language === "id" ? <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden="true"><path fill="#d52027" d="M0 0h24v8H0z"/><path fill="#fff" d="M0 8h24v8H0z"/></svg> : <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden="true"><path fill="#17365d" d="M0 0h24v16H0z"/><path stroke="#fff" strokeWidth="4" d="m0 0 24 16M24 0 0 16"/><path stroke="#c8102e" strokeWidth="2" d="m0 0 24 16M24 0 0 16"/><path stroke="#fff" strokeWidth="6" d="M12 0v16M0 8h24"/><path stroke="#c8102e" strokeWidth="3" d="M12 0v16M0 8h24"/></svg>;
}
