import { useCallback, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "../context/AuthContext";

export interface NotebookPresenceUser {
  userId: string;
  displayName: string;
}

export interface NotebookUpdatePayload {
  contentJson: string;
  updatedAt: string;
}

function getHubBaseUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
  if (apiBase && apiBase.startsWith("http")) {
    return apiBase.replace(/\/api\/v1\/?$/, "");
  }
  return "";
}

export interface UseNotebookRealtimeOptions {
  onPresenceUpdate?: (users: NotebookPresenceUser[]) => void;
  onNotebookUpdated?: (payload: NotebookUpdatePayload) => void;
  onTextCursorPosition?: (userId: string, position: number) => void;
  onUserLeft?: (userId: string) => void;
}

export interface UseNotebookRealtimeReturn {
  sendTextCursor: (position: number) => void;
}

/**
 * Connects to the notebook SignalR hub for real-time presence and content updates.
 */
export function useNotebookRealtime(
  notebookId: string | undefined,
  options: UseNotebookRealtimeOptions = {},
): UseNotebookRealtimeReturn {
  const { accessToken, isAuthenticated } = useAuth();
  const onPresenceUpdateRef = useRef(options.onPresenceUpdate);
  const onNotebookUpdatedRef = useRef(options.onNotebookUpdated);
  const onTextCursorPositionRef = useRef(options.onTextCursorPosition);
  const onUserLeftRef = useRef(options.onUserLeft);
  onPresenceUpdateRef.current = options.onPresenceUpdate;
  onNotebookUpdatedRef.current = options.onNotebookUpdated;
  onTextCursorPositionRef.current = options.onTextCursorPosition;
  onUserLeftRef.current = options.onUserLeft;

  const sendTextCursor = useCallback((position: number) => {
    const nid = notebookIdRef.current;
    if (!nid) return;
    connectionRef.current?.invoke("TextCursorPosition", nid, position).catch(() => {});
  }, []);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const notebookIdRef = useRef<string | undefined>(notebookId);
  notebookIdRef.current = notebookId;

  useEffect(() => {
    if (!notebookId || !isAuthenticated || !accessToken) return;

    const base = `${getHubBaseUrl()}/hubs/notebook`;
    const hubUrl = `${base}${base.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(accessToken)}`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .build();

    connectionRef.current = connection;

    let presenceList: NotebookPresenceUser[] = [];
    const applyPresence = () => onPresenceUpdateRef.current?.(presenceList);

    const handlePresenceList = (list: Array<{ userId: string; displayName: string }>) => {
      presenceList = (list ?? []).map((u) => ({ userId: String(u.userId), displayName: u.displayName ?? "" }));
      applyPresence();
    };
    const handleUserJoined = (userId: string, displayName: string) => {
      const id = String(userId);
      if (presenceList.some((u) => u.userId === id)) return;
      presenceList = [...presenceList, { userId: id, displayName: displayName ?? "" }];
      applyPresence();
    };
    const handleUserLeft = (userId: string) => {
      const id = String(userId);
      presenceList = presenceList.filter((u) => u.userId !== id);
      applyPresence();
      onUserLeftRef.current?.(id);
    };
    const handleNotebookUpdated = (msg: { notebookId?: string; payload?: NotebookUpdatePayload }) => {
      const payload = msg?.payload;
      if (payload && typeof payload === "object" && payload.contentJson != null) {
        onNotebookUpdatedRef.current?.({
          contentJson: String(payload.contentJson),
          updatedAt: payload.updatedAt ? String(payload.updatedAt) : "",
        });
      }
    };
    const handleTextCursorPosition = (userId: string, position: number) => {
      onTextCursorPositionRef.current?.(String(userId), position);
    };

    connection.on("PresenceList", handlePresenceList);
    connection.on("UserJoined", handleUserJoined);
    connection.on("UserLeft", handleUserLeft);
    connection.on("NotebookUpdated", handleNotebookUpdated);
    connection.on("TextCursorPosition", handleTextCursorPosition);

    let cancelled = false;
    const startId = window.setTimeout(() => {
      connection
        .start()
        .then(() => {
          if (cancelled) return;
          if (import.meta.env.DEV) console.log("[useNotebookRealtime] Connected, joining notebook:", notebookId);
          return connection.invoke("JoinNotebook", notebookId);
        })
        .then(() => {
          if (cancelled) return;
          if (import.meta.env.DEV) console.log("[useNotebookRealtime] Joined notebook:", notebookId);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (import.meta.env.DEV) {
            const e = err as Error & { message?: string };
            console.error("[useNotebookRealtime] Failed:", e?.message ?? String(err));
          }
        });
    }, 0);

    if (import.meta.env.DEV) {
      connection.onclose((error) => console.warn("[useNotebookRealtime] Closed:", error?.message));
      connection.onreconnected(() => {
        connection.invoke("JoinNotebook", notebookId).catch(() => {});
      });
    }

    return () => {
      cancelled = true;
      connectionRef.current = null;
      window.clearTimeout(startId);
      connection.off("PresenceList", handlePresenceList);
      connection.off("UserJoined", handleUserJoined);
      connection.off("UserLeft", handleUserLeft);
      connection.off("NotebookUpdated", handleNotebookUpdated);
      connection.off("TextCursorPosition", handleTextCursorPosition);
      connection.invoke("LeaveNotebook", notebookId).catch(() => {});
      connection.stop();
    };
  }, [notebookId, isAuthenticated, accessToken]);

  return { sendTextCursor };
}
