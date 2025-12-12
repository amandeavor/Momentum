/**
 * Friends Screen
 * 
 * Displays friend list, requests, and allows searching for users
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { colors } from '@/theme/colors';
import { spacing, radii } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import GlassCard from '@/components/common/GlassCard';
import Modal from '@/components/common/Modal';
import { selectFriendsEnabled } from '@/store/slices/capabilitiesSlice';
import {
  FriendWithProfile,
  EncouragementWithSender,
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getEncouragements,
  sendEncouragement,
  markAllEncouragmentsAsRead,
  ENCOURAGEMENT_TEMPLATES,
} from '@/services/friends';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

type TabId = 'friends' | 'requests' | 'messages';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const friendsEnabled = useSelector(selectFriendsEnabled);

  const [activeTab, setActiveTab] = useState<TabId>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [encouragements, setEncouragements] = useState<EncouragementWithSender[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [encourageModalVisible, setEncourageModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [friendsData, pendingData, sentData, messagesData] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
        getEncouragements(),
      ]);
      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
      setEncouragements(messagesData);
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Mark encouragements as read when viewing
    markAllEncouragmentsAsRead().catch(console.error);
  }, [fetchData]);

  // Search debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchUsers(searchQuery);
      // Filter out current user and existing friends
      const friendIds = friends.map(f => f.friend_id);
      setSearchResults(results.filter(u => !friendIds.includes(u.id)));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, friends]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendFriendRequest(userId);
      setSearchQuery('');
      setSearchResults([]);
      await fetchData();
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await acceptFriendRequest(friendshipId);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await declineFriendRequest(friendshipId);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await cancelFriendRequest(friendshipId);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel friend request');
    }
  };

  const handleRemoveFriend = async (friend: FriendWithProfile) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.friend.display_name || friend.friend.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await removeFriend(friend.id);
              await fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleOpenEncourage = (friend: FriendWithProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFriend(friend);
    setEncourageModalVisible(true);
  };

  const handleSendEncouragement = async (template: typeof ENCOURAGEMENT_TEMPLATES[0]) => {
    if (!selectedFriend) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendEncouragement(selectedFriend.friend_id, template.message, template.emoji);
      setEncourageModalVisible(false);
      setSelectedFriend(null);
      Alert.alert('Sent!', 'Your encouragement has been sent 💜');
    } catch (error) {
      Alert.alert('Error', 'Failed to send encouragement');
    }
  };

  if (!friendsEnabled) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="people-outline" size={64} color={colors.dark.textTertiary} />
        <Text style={styles.emptyTitle}>Friends feature disabled</Text>
        <Text style={styles.emptySubtitle}>
          Enable friends in Settings to connect with others
        </Text>
      </View>
    );
  }

  const requestCount = pendingRequests.length;
  const unreadMessageCount = encouragements.filter(e => !e.read).length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.dark.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={colors.dark.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search for users"
          />
          {searchQuery.length > 0 && (
            <Pressable 
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={colors.dark.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.searchResults}>
          {isSearching ? (
            <ActivityIndicator color={colors.dark.pastelBlue} style={styles.loader} />
          ) : searchResults.length === 0 ? (
            <Text style={styles.noResults}>No users found</Text>
          ) : (
            searchResults.map((user, index) => (
              <Animated.View
                key={user.id}
                entering={FadeInUp.delay(index * 50)}
                style={styles.searchResultItem}
              >
                <Avatar 
                  uri={user.avatar_url} 
                  name={user.display_name || user.username || 'User'} 
                  size={40} 
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.display_name || user.username}
                  </Text>
                  {user.username && (
                    <Text style={styles.userUsername}>@{user.username}</Text>
                  )}
                </View>
                <Button
                  label="Add"
                  onPress={() => handleSendRequest(user.id)}
                  variant="secondary"
                  size="small"
                />
              </Animated.View>
            ))
          )}
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { id: 'friends', label: 'Friends', count: friends.length },
          { id: 'requests', label: 'Requests', count: requestCount },
          { id: 'messages', label: 'Messages', count: unreadMessageCount },
        ] as const).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.id }}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.badge, activeTab === tab.id && styles.badgeActive]}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.dark.pastelBlue}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.dark.pastelBlue} style={styles.loader} />
        ) : (
          <>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color={colors.dark.textTertiary} />
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Search for users above to add friends
                    </Text>
                  </View>
                ) : (
                  friends.map((friend, index) => (
                    <Animated.View key={friend.id} entering={FadeInUp.delay(index * 50)}>
                      <GlassCard style={styles.friendCard}>
                        <Avatar
                          uri={friend.friend.avatar_url}
                          name={friend.friend.display_name || friend.friend.username || 'User'}
                          size={48}
                        />
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>
                            {friend.friend.display_name || friend.friend.username}
                          </Text>
                          {friend.friend.username && (
                            <Text style={styles.friendUsername}>@{friend.friend.username}</Text>
                          )}
                        </View>
                        <View style={styles.friendActions}>
                          <Pressable
                            onPress={() => handleOpenEncourage(friend)}
                            style={styles.actionButton}
                            accessibilityLabel="Send encouragement"
                          >
                            <Ionicons name="heart-outline" size={22} color={colors.dark.pastelPeach} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemoveFriend(friend)}
                            style={styles.actionButton}
                            accessibilityLabel="Remove friend"
                          >
                            <Ionicons name="person-remove-outline" size={22} color={colors.dark.textTertiary} />
                          </Pressable>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))
                )}
              </>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <>
                {pendingRequests.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Received Requests</Text>
                    {pendingRequests.map((request, index) => (
                      <Animated.View key={request.id} entering={FadeInUp.delay(index * 50)}>
                        <GlassCard style={styles.requestCard}>
                          <Avatar
                            uri={request.friend.avatar_url}
                            name={request.friend.display_name || request.friend.username || 'User'}
                            size={44}
                          />
                          <View style={styles.requestInfo}>
                            <Text style={styles.friendName}>
                              {request.friend.display_name || request.friend.username}
                            </Text>
                            <Text style={styles.requestText}>wants to be your friend</Text>
                          </View>
                          <View style={styles.requestActions}>
                            <Pressable
                              onPress={() => handleAcceptRequest(request.id)}
                              style={[styles.requestButton, styles.acceptButton]}
                              accessibilityLabel="Accept friend request"
                            >
                              <Ionicons name="checkmark" size={20} color={colors.dark.background} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeclineRequest(request.id)}
                              style={[styles.requestButton, styles.declineButton]}
                              accessibilityLabel="Decline friend request"
                            >
                              <Ionicons name="close" size={20} color={colors.dark.text} />
                            </Pressable>
                          </View>
                        </GlassCard>
                      </Animated.View>
                    ))}
                  </>
                )}

                {sentRequests.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, pendingRequests.length > 0 && { marginTop: spacing.lg }]}>
                      Sent Requests
                    </Text>
                    {sentRequests.map((request, index) => (
                      <Animated.View key={request.id} entering={FadeInUp.delay(index * 50)}>
                        <GlassCard style={styles.requestCard}>
                          <Avatar
                            uri={request.friend.avatar_url}
                            name={request.friend.display_name || request.friend.username || 'User'}
                            size={44}
                          />
                          <View style={styles.requestInfo}>
                            <Text style={styles.friendName}>
                              {request.friend.display_name || request.friend.username}
                            </Text>
                            <Text style={styles.requestText}>Pending...</Text>
                          </View>
                          <Button
                            label="Cancel"
                            onPress={() => handleCancelRequest(request.id)}
                            variant="ghost"
                            size="small"
                          />
                        </GlassCard>
                      </Animated.View>
                    ))}
                  </>
                )}

                {pendingRequests.length === 0 && sentRequests.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-outline" size={48} color={colors.dark.textTertiary} />
                    <Text style={styles.emptyTitle}>No requests</Text>
                    <Text style={styles.emptySubtitle}>
                      Friend requests will appear here
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <>
                {encouragements.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.dark.textTertiary} />
                    <Text style={styles.emptyTitle}>No messages</Text>
                    <Text style={styles.emptySubtitle}>
                      Encouragements from friends will appear here
                    </Text>
                  </View>
                ) : (
                  encouragements.map((message, index) => (
                    <Animated.View key={message.id} entering={FadeInUp.delay(index * 50)}>
                      <GlassCard style={message.read ? styles.messageCard : styles.unreadMessageCard}>
                        <View style={styles.messageHeader}>
                          <Avatar
                            uri={message.sender.avatar_url}
                            name={message.sender.display_name || message.sender.username || 'User'}
                            size={36}
                          />
                          <View style={styles.messageSender}>
                            <Text style={styles.senderName}>
                              {message.sender.display_name || message.sender.username}
                            </Text>
                            <Text style={styles.messageTime}>
                              {formatTimeAgo(new Date(message.created_at))}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.messageBody}>
                          {message.emoji && (
                            <Text style={styles.messageEmoji}>{message.emoji}</Text>
                          )}
                          <Text style={styles.messageText}>{message.message}</Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Encourage Modal */}
      <Modal
        visible={encourageModalVisible}
        onClose={() => setEncourageModalVisible(false)}
        title={`Send to ${selectedFriend?.friend.display_name || selectedFriend?.friend.username || 'Friend'}`}
      >
        <View style={styles.encourageGrid}>
          {ENCOURAGEMENT_TEMPLATES.map((template, index) => (
            <Pressable
              key={index}
              onPress={() => handleSendEncouragement(template)}
              style={styles.encourageOption}
              accessibilityLabel={`Send: ${template.message}`}
            >
              <Text style={styles.encourageEmoji}>{template.emoji}</Text>
              <Text style={styles.encourageMessage} numberOfLines={2}>
                {template.message}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.dark.text,
    padding: 0,
  },
  searchResults: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dark.surface,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
  },
  userUsername: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  noResults: {
    ...typography.body,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    padding: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.dark.surface,
  },
  tabActive: {
    backgroundColor: colors.dark.pastelBlue + '30',
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.dark.textTertiary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.dark.pastelBlue,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.dark.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: colors.dark.pastelBlue,
  },
  badgeText: {
    ...typography.caption,
    color: colors.dark.text,
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.dark.textTertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...typography.body,
    color: colors.dark.text,
    fontWeight: '600',
  },
  friendUsername: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  friendActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.dark.elevated,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  requestInfo: {
    flex: 1,
  },
  requestText: {
    ...typography.caption,
    color: colors.dark.textTertiary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.dark.success,
  },
  declineButton: {
    backgroundColor: colors.dark.elevated,
  },
  messageCard: {
    padding: spacing.md,
  },
  unreadMessageCard: {
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.dark.pastelBlue,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageSender: {
    flex: 1,
  },
  senderName: {
    ...typography.bodySmall,
    color: colors.dark.text,
    fontWeight: '600',
  },
  messageTime: {
    ...typography.caption,
    color: colors.dark.textTertiary,
    fontSize: 11,
  },
  messageBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  messageEmoji: {
    fontSize: 24,
  },
  messageText: {
    ...typography.body,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.dark.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.dark.textTertiary,
    textAlign: 'center',
    maxWidth: 250,
  },
  encourageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  encourageOption: {
    width: '48%',
    backgroundColor: colors.dark.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  encourageEmoji: {
    fontSize: 28,
  },
  encourageMessage: {
    ...typography.caption,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
});
