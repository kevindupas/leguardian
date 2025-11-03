import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "../hooks";
import { useBraceletStore } from "../stores/braceletStore";
import { Layout } from "../components/Layout";
import { AddBraceletModal } from "../components/AddBraceletModal";
import { DataTable } from "../components/data-table";
import { LoadingSpinner } from "../components";
import type { Bracelet, BraceletEvent } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Edit2,
  Smartphone,
  Wifi,
  Battery,
  AlertTriangle,
  Plus,
  Clock,
  MapPin,
  Map,
  Send,
} from "lucide-react";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    bracelets,
    recentEvents,
    isLoading,
    fetchBracelets,
    fetchRecentEvents,
    updateBracelet,
    vibrateBracelet,
  } = useBraceletStore();
  const [editingBraceletId, setEditingBraceletId] = useState<number | null>(
    null
  );
  const [editingName, setEditingName] = useState("");
  const [selectedBracelet, setSelectedBracelet] = useState<Bracelet | null>(
    null
  );
  const [showAddBraceletModal, setShowAddBraceletModal] = useState(false);
  const [replyingEventId, setReplyingEventId] = useState<number | null>(null);

  // Bracelet columns definition
  const braceletColumns: ColumnDef<Bracelet>[] = [
    {
      accessorKey: "alias",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          {t("dashboard.bracelet")}
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => {
        const bracelet = row.original;
        const getStatusDot = (status: string) => {
          switch (status) {
            case "emergency":
              return "bg-destructive animate-pulse";
            case "active":
              return "bg-primary";
            default:
              return "bg-muted-foreground";
          }
        };
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${getStatusDot(
                bracelet.status
              )}`}
            />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {bracelet.alias || bracelet.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {bracelet.unique_code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "battery_level",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-end gap-2 hover:bg-secondary/50 transition-colors"
        >
          {t("common.battery")}
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Battery className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {row.original.battery_level}%
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("dashboard.status.title") || "Status",
      cell: ({ row }) => {
        const getStatusVariant = (
          status: string
        ): "default" | "destructive" | "secondary" | "outline" => {
          switch (status) {
            case "emergency":
              return "destructive";
            case "active":
              return "default";
            default:
              return "secondary";
          }
        };
        const getStatusLabel = (status: string) => {
          switch (status) {
            case "emergency":
              return t("dashboard.status.emergency");
            case "active":
              return t("dashboard.status.active");
            default:
              return t("dashboard.status.inactive");
          }
        };
        return (
          <Badge
            variant={getStatusVariant(row.original.status)}
            className="text-xs"
          >
            {getStatusLabel(row.original.status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "last_latitude",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          {t("dashboard.location") || "Location"}
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => {
        const lat = row.original.last_latitude;
        const lng = row.original.last_longitude;
        const accuracy = row.original.last_accuracy;

        if (
          lat === null ||
          lat === undefined ||
          lng === null ||
          lng === undefined ||
          typeof lat !== "number" ||
          typeof lng !== "number"
        ) {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {t("map.noBracelets") || "No data"}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </p>
              {accuracy && typeof accuracy === "number" && (
                <p className="text-xs text-muted-foreground">
                  ±{Number(accuracy).toFixed(0)}m
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Edit",
      cell: ({ row }) => (
        <button
          onClick={() => handleEditName(row.original)}
          className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
          title="Edit name"
        >
          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
        </button>
      ),
    },
  ];

  // Events columns definition
  const eventColumns: ColumnDef<BraceletEvent>[] = [
    {
      accessorKey: "bracelet_id",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          {t("dashboard.bracelet")}
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => {
        const bracelet = bracelets.find(
          (b) => b.id === row.original.bracelet_id
        );
        return (
          <p className="font-medium text-foreground truncate">
            {bracelet?.alias || bracelet?.name || t("dashboard.bracelet")}
          </p>
        );
      },
    },
    {
      accessorKey: "event_type",
      header: "Event",
      cell: ({ row }) => {
        const eventType = row.original.event_type;
        const eventLabel =
          eventType === "arrived"
            ? t("dashboard.events.arrived")
            : eventType === "lost"
            ? t("dashboard.events.lost")
            : eventType === "danger"
            ? t("dashboard.events.danger")
            : eventType;
        return (
          <Badge
            variant={
              eventType === "danger"
                ? "destructive"
                : eventType === "lost"
                ? "secondary"
                : "default"
            }
            className="text-xs"
          >
            {eventLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: "latitude",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          {t("dashboard.location") || "Location"}
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => {
        const lat = row.original.latitude;
        const lng = row.original.longitude;
        const accuracy = row.original.accuracy;

        if (
          lat === null ||
          lat === undefined ||
          lng === null ||
          lng === undefined ||
          typeof lat !== "number" ||
          typeof lng !== "number"
        ) {
          return (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {t("map.noBracelets") || "No data"}
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </p>
              {accuracy && typeof accuracy === "number" && (
                <p className="text-xs text-muted-foreground">
                  ±{Number(accuracy).toFixed(0)}m
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center justify-end gap-2 hover:bg-secondary/50 transition-colors"
        >
          Time
          {column.getIsSorted() && (
            <span>{column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      ),
      cell: ({ row }) => {
        const eventTime = new Date(row.original.created_at);
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {eventTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const event = row.original;
        const bracelet = bracelets.find((b) => b.id === event.bracelet_id);

        const handleShowOnMap = () => {
          if (event.latitude && event.longitude) {
            navigate("/map", {
              state: {
                centerLat: event.latitude,
                centerLng: event.longitude,
                zoom: 15,
              },
            });
          }
        };

        const handleSendReply = async () => {
          if (!bracelet) return;
          try {
            setReplyingEventId(event.id);
            await vibrateBracelet(bracelet.id, "short");
            // Show success notification
            setReplyingEventId(null);
          } catch (error) {
            console.error("Failed to send reply:", error);
            setReplyingEventId(null);
          }
        };

        return (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleShowOnMap}
              disabled={!event.latitude || !event.longitude}
              className="p-1.5 hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Show on map"
            >
              <Map className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </button>
            <button
              onClick={handleSendReply}
              disabled={!bracelet || replyingEventId === event.id}
              className="p-1.5 hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send reply"
            >
              <Send className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchBracelets();
  }, [fetchBracelets]);

  useEffect(() => {
    if (bracelets.length > 0) {
      fetchRecentEvents(10);
    }
  }, [bracelets, fetchRecentEvents]);

  if (isLoading && bracelets.length === 0) return <LoadingSpinner />;

  const handleEditName = (bracelet: Bracelet) => {
    setEditingBraceletId(bracelet.id);
    setEditingName(bracelet.alias || "");
  };

  const handleSaveName = async (braceletId: number) => {
    try {
      await updateBracelet(braceletId, { alias: editingName });
      setEditingBraceletId(null);
      setEditingName("");
    } catch (err) {
      console.error("Failed to update bracelet alias:", err);
    }
  };

  const activeBracelets = bracelets.filter((b) => b.status === "active").length;
  const emergencyBracelets = bracelets.filter(
    (b) => b.status === "emergency"
  ).length;
  const totalBatteryAvg =
    bracelets.length > 0
      ? Math.round(
          bracelets.reduce((sum, b) => sum + b.battery_level, 0) /
            bracelets.length
        )
      : 0;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("dashboard.welcome", { name: user?.name })}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setShowAddBraceletModal(true)}
            className="gap-2 w-full md:w-auto"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.addBracelet")}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="flex md:grid gap-6 overflow-x-auto md:overflow-visible md:grid-cols-2 lg:grid-cols-4 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none">
          <style>{`
            .snap-mandatory {
              scroll-padding-left: 1rem;
            }
            .snap-mandatory > * {
              scroll-snap-align: start;
              min-width: calc(100% - 1.5rem);
            }
            .snap-mandatory > *:first-child {
              margin-left: 0;
            }
            @media (min-width: 768px) {
              .snap-mandatory > * {
                min-width: auto;
              }
            }
          `}</style>
          {/* Total Bracelets */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.stats.total")}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {bracelets.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("dashboard.stats.bracelets", {
                      count: bracelets.length,
                    })}
                  </p>
                </div>
                <div className="p-3 bg-primary rounded-lg">
                  <Smartphone className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.stats.active")}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {activeBracelets}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.round(
                      (activeBracelets / Math.max(bracelets.length, 1)) * 100
                    )}
                    %
                  </p>
                </div>
                <div className="p-3 bg-primary rounded-lg">
                  <Wifi className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batterie */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.stats.battery")}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {totalBatteryAvg}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("dashboard.stats.globalAverage")}
                  </p>
                </div>
                <div className="p-3 bg-primary rounded-lg">
                  <Battery className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("dashboard.stats.emergency")}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {emergencyBracelets}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("dashboard.stats.toCheck")}
                  </p>
                </div>
                <div className="p-3 bg-destructive rounded-lg">
                  <AlertCircle className="w-6 h-6 text-destructive-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bracelets Table */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("dashboard.myBracelets")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("dashboard.registered", { count: bracelets.length })}
                </p>
              </div>
            </div>

            {bracelets.length === 0 ? (
              <Card className="border-dashed h-full flex items-center">
                <CardContent className="p-8 w-full text-center">
                  <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {t("dashboard.noBracelets")}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {t("dashboard.noBraceletsDescription")}
                  </p>
                  <Button
                    onClick={() => setShowAddBraceletModal(true)}
                    className="gap-2 w-full"
                  >
                    <Plus className="w-4 h-4" />
                    {t("dashboard.registerFirstBracelet")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden bg-card">
                <DataTable<Bracelet, string>
                  columns={braceletColumns}
                  data={bracelets}
                  searchKey="alias"
                  searchPlaceholder={
                    t("dashboard.searchBracelets") || "Search bracelets..."
                  }
                  pageSize={8}
                  enableRowSelection={true}
                />
              </div>
            )}
          </div>

          {/* Recent Events Table */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("dashboard.notifications")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {recentEvents.length} recent event
                  {recentEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {recentEvents.length === 0 ? (
              <Card className="border-dashed h-full flex items-center">
                <CardContent className="p-8 w-full text-center">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {t("dashboard.noNotifications")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden bg-card">
                <DataTable<BraceletEvent, string>
                  columns={eventColumns}
                  data={recentEvents}
                  searchKey="bracelet_id"
                  searchPlaceholder={
                    t("dashboard.searchEvents") || "Search events..."
                  }
                  pageSize={8}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingBraceletId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBraceletId(null);
            setEditingName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("dashboard.dialog.placeholder")}
            value={editingName}
            onChange={(e) => setEditingName(e.target.value.substring(0, 255))}
            autoFocus
          />
          <p className="text-xs text-muted-foreground text-right">
            {editingName.length}/255
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBraceletId(null);
                setEditingName("");
              }}
            >
              {t("dashboard.dialog.cancel")}
            </Button>
            <Button
              onClick={() =>
                editingBraceletId && handleSaveName(editingBraceletId)
              }
            >
              {t("dashboard.dialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bracelet Modal */}
      <AddBraceletModal
        open={showAddBraceletModal}
        onOpenChange={setShowAddBraceletModal}
      />
    </Layout>
  );
};
