import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

function parseDevice(userAgent?: string | null): string {
  if (!userAgent) return "Unknown device";

  const os =
    /windows/i.test(userAgent)
      ? "Windows"
      : /mac os|macintosh/i.test(userAgent)
      ? "macOS"
      : /android/i.test(userAgent)
      ? "Android"
      : /iphone|ipad|ios/i.test(userAgent)
      ? "iOS"
      : /linux/i.test(userAgent)
      ? "Linux"
      : "Unknown OS";

  const browser =
    /edg/i.test(userAgent)
      ? "Edge"
      : /chrome|crios/i.test(userAgent)
      ? "Chrome"
      : /firefox|fxios/i.test(userAgent)
      ? "Firefox"
      : /safari/i.test(userAgent)
      ? "Safari"
      : "Unknown browser";

  return `${browser} · ${os}`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const ActiveSessions = () => {
  const { listSessions, getSession, revokeOtherSessions } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [currentToken, setCurrentToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [revoking, setRevoking] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ sessions }, current] = await Promise.all([
      listSessions(),
      getSession(),
    ]);
    setSessions(sessions as SessionRow[]);
    setCurrentToken(current.data?.session.token ?? "");
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoutOthers = useCallback(async () => {
    setRevoking(true);
    const { error } = await revokeOtherSessions();
    if (!error) {
      await load();
    }
    setRevoking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const hasOtherSessions = sessions.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between my-8">
        <Label className="text-muted-foreground">Active Sessions</Label>
        {hasOtherSessions && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutOthers}
            disabled={revoking}
          >
            {revoking ? "Logging out…" : "Logout Other Sessions"}
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Loading sessions…
              </TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No active sessions found.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((session) => {
              const isCurrent = session.token === currentToken;
              return (
                <TableRow key={session.id}>
                  <TableCell>{parseDevice(session.userAgent)}</TableCell>
                  <TableCell>{session.ipAddress || "—"}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>{formatDate(session.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {isCurrent && <Badge>Current</Badge>}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
