import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeGuardianColors } from '../constants/Colors';

export interface EventTimelineItem {
  id: string | number;
  title: string;
  description: string;
  timestamp: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon?: string;
}

interface EventTimelineProps {
  events: EventTimelineItem[];
  isLoading?: boolean;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  isLoading = false,
}) => {
  const getEventStyle = (type: EventTimelineItem['type']) => {
    const styles_: Record<string, { color: string; bgColor: string; icon: string }> = {
      danger: {
        color: LeGuardianColors.danger,
        bgColor: '#FADBD8',
        icon: 'alert-circle',
      },
      warning: {
        color: LeGuardianColors.warning,
        bgColor: '#FEF5E7',
        icon: 'warning',
      },
      success: {
        color: LeGuardianColors.success,
        bgColor: '#E8F8F5',
        icon: 'checkmark-circle',
      },
      info: {
        color: LeGuardianColors.primary,
        bgColor: '#EBF5FB',
        icon: 'information-circle',
      },
    };
    return styles_[type];
  };

  const renderEvent = ({ item, index }: { item: EventTimelineItem; index: number }) => {
    const eventStyle = getEventStyle(item.type);
    const isLast = index === events.length - 1;

    return (
      <View style={styles.eventContainer}>
        {/* Timeline line and dot */}
        <View style={styles.timelineTrack}>
          <View style={[styles.dot, { backgroundColor: eventStyle.color }]} />
          {!isLast && <View style={[styles.line, { borderLeftColor: eventStyle.color }]} />}
        </View>

        {/* Event card */}
        <View style={[styles.eventCard, { borderLeftColor: eventStyle.color }]}>
          <View style={[styles.eventIconBg, { backgroundColor: eventStyle.bgColor }]}>
            <Ionicons
              name={(item.icon || eventStyle.icon) as any}
              size={16}
              color={eventStyle.color}
            />
          </View>

          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDescription}>{item.description}</Text>
            <Text style={styles.eventTime}>
              {new Date(item.timestamp).toLocaleString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="checkmark-circle"
          size={48}
          color={LeGuardianColors.success}
        />
        <Text style={styles.emptyTitle}>Tout va bien!</Text>
        <Text style={styles.emptyText}>Aucun événement pour le moment</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderEvent}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  eventContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineTrack: {
    width: 30,
    alignItems: 'center',
    paddingRight: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: LeGuardianColors.primary,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    borderLeftWidth: 2,
    marginTop: 8,
  },
  eventCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: LeGuardianColors.white,
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  eventIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LeGuardianColors.textPrimary,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: LeGuardianColors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  eventTime: {
    fontSize: 11,
    color: LeGuardianColors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LeGuardianColors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: LeGuardianColors.textSecondary,
    marginTop: 8,
  },
});
