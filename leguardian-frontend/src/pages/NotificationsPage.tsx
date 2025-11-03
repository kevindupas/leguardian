import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useBraceletStore } from "../stores/braceletStore";
import { LoadingSpinner } from "../components";
import type { BraceletEvent, Bracelet } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  AlertCircle,
  MapPin,
  Map,
  Send,
  Clock,
  Smartphone,
  AlertTriangle,
  AlertOctagon,
  Zap,
  CheckCircle,
} from "lucide-react";

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    bracelets,
    recentEvents,
    isLoading,
    fetchBracelets,
    fetchRecentEvents,
    vibrateBracelet,
  } = useBraceletStore();

  const [selectedEvent, setSelectedEvent] = useState<BraceletEvent | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "arrived" | "lost" | "danger">(
    "all"
  );
  const [showReplyConfirm, setShowReplyConfirm] = useState(false);
  const [replyingEvent, setReplyingEvent] = useState<BraceletEvent | null>(
    null
  );
  const [isSendingVibration, setIsSendingVibration] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchBracelets();
    fetchRecentEvents();
  }, []);

  // Get bracelet info for an event
  const getBraceletForEvent = (braceletId: number): Bracelet | undefined => {
    return bracelets.find((b) => b.id === braceletId);
  };

  // Determine vibration pattern based on event type
  const getVibrationPatternForEvent = (
    eventType: string
  ): "short" | "medium" | "sos" => {
    switch (eventType) {
      case "arrived":
        return "short"; // Light acknowledgment - child arrived safely
      case "lost":
        return "medium"; // Stronger response - child is lost
      case "danger":
        return "short"; // Don't mirror SOS, send light signal to acknowledge
      default:
        return "short";
    }
  };

  // Format time difference
  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("notifications.now") || "À l'instant";
    if (diffMins < 60)
      return (
        t("notifications.minutes_ago", { count: diffMins }) ||
        `Il y a ${diffMins}m`
      );
    if (diffHours < 24)
      return (
        t("notifications.hours_ago", { count: diffHours }) ||
        `Il y a ${diffHours}h`
      );
    if (diffDays < 7)
      return (
        t("notifications.days_ago", { count: diffDays }) ||
        `Il y a ${diffDays}j`
      );

    return date.toLocaleDateString();
  };

  // Filter events
  const filteredEvents = recentEvents.filter((event) => {
    if (filter === "all") return true;
    return event.event_type === filter;
  });

  // Sort by newest first
  const sortedEvents = [...filteredEvents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get event icon and styling
  const getEventInfo = (eventType: string) => {
    switch (eventType) {
      case "arrived":
        return {
          icon: CheckCircle,
          label: t("notifications.arrived") || "Arrivé",
          color: "bg-green-500",
          badgeVariant: "default" as const,
          textColor: "text-green-600",
        };
      case "lost":
        return {
          icon: AlertTriangle,
          label: t("notifications.lost") || "Perdu",
          color: "bg-yellow-500",
          badgeVariant: "secondary" as const,
          textColor: "text-yellow-600",
        };
      case "danger":
        return {
          icon: AlertOctagon,
          label: t("notifications.danger") || "Urgence",
          color: "bg-red-500",
          badgeVariant: "destructive" as const,
          textColor: "text-red-600",
        };
      default:
        return {
          icon: AlertCircle,
          label: eventType,
          color: "bg-gray-500",
          badgeVariant: "outline" as const,
          textColor: "text-gray-600",
        };
    }
  };

  const handleViewMap = (event: BraceletEvent) => {
    navigate("/map", {
      state: { selectedBraceletId: event.bracelet_id, event },
    });
  };

  const handleReply = (event: BraceletEvent) => {
    setReplyingEvent(event);
    setShowReplyConfirm(true);
  };

  const handleConfirmReply = async () => {
    if (!replyingEvent) return;

    setIsSendingVibration(true);
    try {
      const pattern = getVibrationPatternForEvent(replyingEvent.event_type);
      await vibrateBracelet(replyingEvent.bracelet_id, pattern);
      setShowReplyConfirm(false);
      setReplyingEvent(null);
    } catch (error) {
      console.error("Failed to send vibration:", error);
    } finally {
      setIsSendingVibration(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("notifications.title") || "Notifications"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("notifications.description") ||
              "Gestion des alertes de vos bracelets"}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="transition-colors"
          >
            {t("notifications.all") || "Tous"} ({recentEvents.length})
          </Button>
          <Button
            variant={filter === "arrived" ? "default" : "outline"}
            onClick={() => setFilter("arrived")}
            className="transition-colors"
          >
            {t("notifications.arrived") || "Arrivés"} (
            {recentEvents.filter((e) => e.event_type === "arrived").length})
          </Button>
          <Button
            variant={filter === "lost" ? "default" : "outline"}
            onClick={() => setFilter("lost")}
            className="transition-colors"
          >
            {t("notifications.lost") || "Perdus"} (
            {recentEvents.filter((e) => e.event_type === "lost").length})
          </Button>
          <Button
            variant={filter === "danger" ? "default" : "outline"}
            onClick={() => setFilter("danger")}
            className="transition-colors"
          >
            {t("notifications.danger") || "Urgences"} (
            {recentEvents.filter((e) => e.event_type === "danger").length})
          </Button>
        </div>

        {/* Notifications list */}
        {sortedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {t("notifications.empty") || "Aucune notification"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedEvents.map((event) => {
              const bracelet = getBraceletForEvent(event.bracelet_id);
              const eventInfo = getEventInfo(event.event_type);
              const Icon = eventInfo.icon;
              const isResolved = event.resolved;

              return (
                <Card
                  key={event.id}
                  className={`transition-all cursor-pointer hover:shadow-lg ${
                    isResolved ? "opacity-60 bg-muted" : eventInfo.color + "/10"
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`${eventInfo.color} p-2 rounded-lg shrink-0`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {bracelet?.alias ||
                              bracelet?.name ||
                              "Bracelet inconnu"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {bracelet?.unique_code}
                          </p>
                        </div>
                      </div>
                      {isResolved && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {t("notifications.resolved") || "Résolu"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Event type badge */}
                    <div>
                      <Badge
                        variant={eventInfo.badgeVariant}
                        className={eventInfo.textColor}
                      >
                        {eventInfo.label}
                      </Badge>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeAgo(event.created_at)}</span>
                    </div>

                    {/* Location if available */}
                    {event.latitude && event.longitude && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-foreground">
                            {Number(event.latitude).toFixed(4)},{" "}
                            {Number(event.longitude).toFixed(4)}
                          </p>
                          {event.accuracy && (
                            <p className="text-xs text-muted-foreground">
                              ±{event.accuracy}m
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Battery level */}
                    {event.battery_level !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {event.battery_level}%{" "}
                          {t("common.battery") || "batterie"}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewMap(event);
                        }}
                      >
                        <Map className="w-4 h-4 mr-1" />
                        {t("notifications.view_map") || "Sur la carte"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(event);
                        }}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {t("notifications.reply") || "Répondre"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t("notifications.event_details") || "Détails de l'événement"}
              </DialogTitle>
              <DialogDescription>
                {getBraceletForEvent(selectedEvent.bracelet_id)?.alias ||
                  getBraceletForEvent(selectedEvent.bracelet_id)?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Event type */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("notifications.event_type") || "Type d'événement"}
                </p>
                <Badge variant="default">
                  {getEventInfo(selectedEvent.event_type).label}
                </Badge>
              </div>

              {/* Time */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("common.time") || "Heure"}
                </p>
                <p className="text-sm text-foreground">
                  {new Date(selectedEvent.created_at).toLocaleString()}
                </p>
              </div>

              {/* Location */}
              {selectedEvent.latitude && selectedEvent.longitude && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("common.location") || "Localisation"}
                  </p>
                  <p className="text-sm text-foreground">
                    {Number(selectedEvent.latitude).toFixed(6)},{" "}
                    {Number(selectedEvent.longitude).toFixed(6)}
                  </p>
                  {selectedEvent.accuracy && (
                    <p className="text-xs text-muted-foreground">
                      Précision: ±{selectedEvent.accuracy}m
                    </p>
                  )}
                </div>
              )}

              {/* Battery */}
              {selectedEvent.battery_level !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {t("common.battery") || "Batterie"}
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedEvent.battery_level}%
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t("notifications.status") || "Statut"}
                </p>
                <Badge
                  variant={selectedEvent.resolved ? "secondary" : "destructive"}
                >
                  {selectedEvent.resolved
                    ? t("notifications.resolved") || "Résolu"
                    : t("notifications.active") || "Actif"}
                </Badge>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleViewMap(selectedEvent);
                  setSelectedEvent(null);
                }}
              >
                <Map className="w-4 h-4 mr-2" />
                {t("notifications.view_map") || "Sur la carte"}
              </Button>
              <Button
                onClick={() => {
                  handleReply(selectedEvent);
                  setSelectedEvent(null);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                {t("notifications.reply") || "Répondre"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Reply confirmation drawer */}
      {isMobile ? (
        <Drawer open={showReplyConfirm} onOpenChange={setShowReplyConfirm}>
          {replyingEvent && (
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>
                  {t("notifications.send_response") || "Envoyer une réponse"}
                </DrawerTitle>
                <DrawerDescription>
                  À{" "}
                  {getBraceletForEvent(replyingEvent.bracelet_id)?.alias ||
                    getBraceletForEvent(replyingEvent.bracelet_id)?.name}
                </DrawerDescription>
              </DrawerHeader>

              <div className="space-y-4 px-4 pb-6">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-foreground">
                    {t("notifications.response_info") ||
                      "Une vibration sera envoyée au bracelet pour signifier que vous avez vu le message."}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Type d'événement:{" "}
                    <span className="font-semibold text-foreground">
                      {getEventInfo(replyingEvent.event_type).label}
                    </span>
                  </p>
                </div>
              </div>

              <DrawerFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyConfirm(false);
                    setReplyingEvent(null);
                  }}
                  disabled={isSendingVibration}
                >
                  {t("common.cancel") || "Annuler"}
                </Button>
                <Button
                  onClick={handleConfirmReply}
                  disabled={isSendingVibration}
                  className="flex items-center gap-2"
                >
                  {isSendingVibration ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      {t("notifications.send_vibration") || "Envoi..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t("notifications.send_vibration") || "Envoyer"}
                    </>
                  )}
                </Button>
              </DrawerFooter>
            </DrawerContent>
          )}
        </Drawer>
      ) : (
        <Dialog open={showReplyConfirm} onOpenChange={setShowReplyConfirm}>
          {replyingEvent && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t("notifications.send_response") || "Envoyer une réponse"}
                </DialogTitle>
                <DialogDescription>
                  À{" "}
                  {getBraceletForEvent(replyingEvent.bracelet_id)?.alias ||
                    getBraceletForEvent(replyingEvent.bracelet_id)?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-foreground">
                    {t("notifications.response_info") ||
                      "Une vibration sera envoyée au bracelet pour signifier que vous avez vu le message."}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Type d'événement:{" "}
                    <span className="font-semibold text-foreground">
                      {getEventInfo(replyingEvent.event_type).label}
                    </span>
                  </p>
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyConfirm(false);
                    setReplyingEvent(null);
                  }}
                  disabled={isSendingVibration}
                >
                  {t("common.cancel") || "Annuler"}
                </Button>
                <Button
                  onClick={handleConfirmReply}
                  disabled={isSendingVibration}
                  className="flex items-center gap-2"
                >
                  {isSendingVibration ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin" />
                      {t("notifications.send_vibration") || "Envoi..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t("notifications.send_vibration") || "Envoyer"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      )}
    </Layout>
  );
};
