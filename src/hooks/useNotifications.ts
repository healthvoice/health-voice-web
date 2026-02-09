"use client";

import type { NotificationProps } from "@/@types/general-client";
import { useApiContext } from "@/context/ApiContext";
import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 90_000; // 1.5 min

export function useNotifications(options?: { poll?: boolean }) {
  const { GetAPI, PutAPI } = useApiContext();
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.opened).length;

  const fetchNotifications = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      setError(null);
      const { status, body } = await GetAPI(
        `notification?page=${pageNum}`,
        true,
      );
      console.log(body);
      console.log(status);
      setLoading(false);
      if (status !== 200 || !body?.notifications) {
        setError("Não foi possível carregar as notificações.");
        return;
      }
      setNotifications(body.notifications ?? []);
      setPages(body.pages ?? 0);
      setPage(pageNum);
    },
    [GetAPI],
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { status } = await PutAPI(
        `notification/${notificationId}`,
        { opened: true },
        true,
      );
      if (status !== 200) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, opened: true } : n)),
      );
    },
    [PutAPI],
  );

  const markAllAsRead = useCallback(async () => {
    setMarkingAllAsRead(true);
    try {
      const { status } = await PutAPI(
        `notification/mark-all-as-read`,
        {},
        true,
      );
      if (status !== 200) return;
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, opened: true })),
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  }, [PutAPI]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!options?.poll) return;
    const interval = setInterval(() => fetchNotifications(1), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [options?.poll, fetchNotifications]);

  return {
    notifications,
    pages,
    page,
    loading,
    markingAllAsRead,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
