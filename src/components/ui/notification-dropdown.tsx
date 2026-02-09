"use client";

import type { NotificationProps } from "@/@types/general-client";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/utils/cn";
import { convertAppRouteToWeb } from "@/utils/route-mapper";
import { Bell, Loader2 } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./blocks/dropdown-menu";

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationProps;
  onMarkAsRead: (id: string) => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.opened) onMarkAsRead(notification.id);
    
    if (notification.route) {
      // Converte rota do app para rota do web
      const webRoute = convertAppRouteToWeb(notification.route, notification.params);
      router.push(webRoute);
    } else {
      router.push("/notifications");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-neutral-100",
        !notification.opened && "bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium text-neutral-800",
            !notification.opened && "font-semibold",
          )}
        >
          {notification.title}
        </span>
        <span className="shrink-0 text-xs text-neutral-400">
          {moment(notification.createdAt).fromNow()}
        </span>
      </div>
      {notification.content && (
        <p className="line-clamp-2 text-xs text-neutral-500">
          {notification.content}
        </p>
      )}
    </button>
  );
}

export function NotificationDropdown() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    markingAllAsRead,
    fetchNotifications,
  } = useNotifications({ poll: true });
  const router = useRouter();

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchNotifications(1)}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="flex w-[360px] max-h-[min(420px,85vh)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white p-0 shadow-lg"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-neutral-800">
            Notificações
          </h3>
        </div>
        <div
          className="max-h-[320px] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          data-lenis-prevent
          onWheel={(e) => e.stopPropagation()}
        >
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              {error}
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              Nenhuma notificação.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 p-2">
              {notifications.slice(0, 10).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-neutral-100 p-2 space-y-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAllAsRead}
              className={cn(
                "flex items-center justify-center gap-2 w-full rounded-lg py-2 text-center text-sm font-medium transition-colors",
                markingAllAsRead
                  ? "text-neutral-400 cursor-not-allowed"
                  : "text-primary hover:bg-primary/10"
              )}
            >
              {markingAllAsRead && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {markingAllAsRead ? "Marcando..." : "Marcar todas como lidas"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              router.push("/notifications");
            }}
            className="text-primary hover:bg-primary/10 w-full rounded-lg py-2 text-center text-sm font-medium transition-colors"
          >
            Ver todas as notificações
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
