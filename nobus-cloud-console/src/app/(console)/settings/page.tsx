"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  Button,
  Card,
  PageHeader,
} from "@/components/ui";

export default function SettingsPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshApiKey() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/refresh",
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to refresh API key.",
        );
      }

      setMessage(
        "API key refreshed successfully.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to refresh API key.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your Nobus Cloud console session and configuration."
      />

      <div className="grid gap-6">
        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            API Session
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Refresh the API key used by this cloud
            console without signing out.
          </p>

          <Button
            className="mt-5"
            variant="secondary"
            disabled={busy}
            onClick={refreshApiKey}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                busy ? "animate-spin" : ""
              }`}
            />

            {busy
              ? "Refreshing…"
              : "Refresh API key"}
          </Button>

          {message && (
            <p className="mt-4 text-sm text-slate-600">
              {message}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}