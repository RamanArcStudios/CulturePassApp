import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/query-client";
import Colors from "@/constants/colors";

interface AdminStats {
  users: number;
  events: number;
  organisations: number;
  businesses: number;
  artists: number;
  orders: number;
  pendingOrganisations: number;
  pendingBusinesses: number;
  pendingArtists: number;
  totalPending: number;
}

interface PendingOrganisation {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  status: string;
  ownerId: string;
  categories: string[] | null;
  established: string | null;
  imageUrl: string | null;
}

interface PendingBusiness {
  id: string;
  name: string;
  description: string;
  category: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  status: string;
  ownerId: string;
  imageUrl: string | null;
}

interface PendingArtist {
  id: string;
  name: string;
  genre: string;
  bio: string;
  city: string;
  state: string;
  status: string;
  ownerId: string;
  imageUrl: string | null;
}

interface PendingData {
  organisations: PendingOrganisation[];
  businesses: PendingBusiness[];
  artists: PendingArtist[];
}

type TabType = "organisations" | "businesses" | "artists";

const STAT_CARDS: { key: keyof AdminStats; label: string; icon: string; color: string }[] = [
  { key: "users", label: "Users", icon: "people", color: Colors.light.secondary },
  { key: "events", label: "Events", icon: "calendar", color: Colors.light.primary },
  { key: "organisations", label: "Orgs", icon: "business", color: Colors.light.secondaryLight },
  { key: "businesses", label: "Businesses", icon: "storefront", color: Colors.light.accent },
  { key: "artists", label: "Artists", icon: "musical-notes", color: "#9B59B6" },
  { key: "orders", label: "Orders", icon: "receipt", color: Colors.light.warning },
  { key: "totalPending", label: "Pending", icon: "time", color: Colors.light.error },
];

const TABS: { key: TabType; label: string }[] = [
  { key: "organisations", label: "Organisations" },
  { key: "businesses", label: "Businesses" },
  { key: "artists", label: "Artists" },
];

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("organisations");

  const goBack = () =>
    navigation.canGoBack() ? router.back() : router.replace("/");

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.roleGlobal === "admin",
  });

  const {
    data: pending,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery<PendingData>({
    queryKey: ["/api/admin/pending"],
    enabled: user?.roleGlobal === "admin",
  });

  const approveMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await apiRequest("POST", `/api/admin/approve/${type}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      await apiRequest("POST", `/api/admin/reject/${type}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
    },
  });

  const handleApprove = (type: string, id: string, name: string) => {
    if (Platform.OS === "web") {
      if (confirm(`Approve "${name}"?`)) {
        approveMutation.mutate({ type, id });
      }
    } else {
      Alert.alert("Approve", `Approve "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Approve", onPress: () => approveMutation.mutate({ type, id }) },
      ]);
    }
  };

  const handleReject = (type: string, id: string, name: string) => {
    if (Platform.OS === "web") {
      if (confirm(`Reject "${name}"?`)) {
        rejectMutation.mutate({ type, id });
      }
    } else {
      Alert.alert("Reject", `Reject "${name}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Reject", style: "destructive", onPress: () => rejectMutation.mutate({ type, id }) },
      ]);
    }
  };

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchPending();
  }, [refetchStats, refetchPending]);

  const isLoading = authLoading || statsLoading || pendingLoading;

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!user || user.roleGlobal !== "admin") {
    return (
      <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Admin</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You do not have permission to view this page.
          </Text>
        </View>
      </View>
    );
  }

  const truncate = (text: string | null | undefined, len: number) => {
    if (!text) return "";
    return text.length > len ? text.substring(0, len) + "..." : text;
  };

  const currentItems = pending?.[activeTab] ?? [];

  const getTypeKey = (tab: TabType): string => {
    if (tab === "organisations") return "organisation";
    if (tab === "businesses") return "business";
    return "artist";
  };

  const renderPendingItem = (item: any, type: string) => {
    const desc = type === "artist" ? item.bio : item.description;
    const subtitle = type === "artist" ? item.genre : (type === "business" ? item.category : null);

    return (
      <View key={item.id} style={styles.pendingCard}>
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingName}>{item.name}</Text>
          {subtitle ? (
            <Text style={styles.pendingSubtitle}>{subtitle}</Text>
          ) : null}
          <Text style={styles.pendingDesc}>{truncate(desc, 80)}</Text>
          <View style={styles.pendingLocation}>
            <Ionicons name="location-outline" size={13} color={Colors.light.textTertiary} />
            <Text style={styles.pendingLocationText}>
              {item.city}, {item.state}
            </Text>
          </View>
        </View>
        <View style={styles.pendingActions}>
          <Pressable
            onPress={() => handleApprove(type, item.id, item.name)}
            style={({ pressed }) => [styles.approveBtn, { opacity: pressed ? 0.7 : 1 }]}
            disabled={approveMutation.isPending}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => handleReject(type, item.id, item.name)}
            style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.7 : 1 }]}
            disabled={rejectMutation.isPending}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12 }]}>
        <Pressable onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={!!statsLoading && !!pendingLoading}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        {isLoading && !stats ? (
          <View style={[styles.centered, { paddingTop: 60 }]}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={18} color={Colors.light.secondary} />
              <Text style={styles.sectionTitle}>Overview</Text>
            </View>

            <View style={styles.statsGrid}>
              {STAT_CARDS.map((card) => (
                <View key={card.key} style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: card.color + "15" }]}>
                    <Ionicons name={card.icon as any} size={20} color={card.color} />
                  </View>
                  <Text style={styles.statValue}>{stats?.[card.key] ?? 0}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={18} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>Pending Submissions</Text>
              {stats?.totalPending ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.totalPending}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.tabBar}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const count =
                  tab.key === "organisations"
                    ? stats?.pendingOrganisations
                    : tab.key === "businesses"
                    ? stats?.pendingBusinesses
                    : stats?.pendingArtists;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tab, isActive && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                      {tab.label}
                    </Text>
                    {(count ?? 0) > 0 ? (
                      <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                        <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pendingList}>
              {currentItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={40} color={Colors.light.success} />
                  <Text style={styles.emptyTitle}>All Clear</Text>
                  <Text style={styles.emptyText}>
                    No pending {activeTab} submissions
                  </Text>
                </View>
              ) : (
                currentItems.map((item: any) =>
                  renderPendingItem(item, getTypeKey(activeTab))
                )
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    backgroundColor: Colors.light.background,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.light.text,
  },
  scrollContent: {
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.light.text,
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.text,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    width: "47%",
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    alignItems: "flex-start",
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.light.textSecondary,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: Colors.light.surfaceElevated,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.light.surface,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.text,
  },
  tabBadge: {
    backgroundColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: Colors.light.primary + "18",
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.light.primary,
  },
  pendingList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  pendingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pendingInfo: {
    flex: 1,
    gap: 3,
  },
  pendingName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.text,
  },
  pendingSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.light.primary,
  },
  pendingDesc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  pendingLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  pendingLocationText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.light.textTertiary,
  },
  pendingActions: {
    gap: 8,
    alignItems: "center",
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.success,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.error,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.light.textSecondary,
  },
});
