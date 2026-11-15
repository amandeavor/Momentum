/**
 * Friends Service
 * 
 * Handles friend requests, friendships, and encouragements
 */
import { supabase } from './supabase';
import { 
  Database, 
  Friendship, 
  FriendshipInsert, 
  Encouragement, 
  EncouragementInsert, 
  Profile 
} from '@/types/database';
import { logger } from '@/utils/logger';

export interface FriendWithProfile extends Friendship {
  friend: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface EncouragementWithSender extends Encouragement {
  sender: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface FriendStreak {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  streakType: string;
  currentCount: number;
  lastCheckIn: string | null;
}

// Search for users by username
export async function searchUsers(query: string): Promise<Profile[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(10);

  if (error) {
    logger.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

// Get all friends (accepted friendships)
export async function getFriends(): Promise<FriendWithProfile[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      friend:profiles!friendships_friend_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('user_id', user.user.id)
    .eq('status', 'accepted');

  if (error) {
    logger.error('Error fetching friends:', error);
    throw error;
  }

  return (data || []) as unknown as FriendWithProfile[];
}

// Get pending friend requests (sent to me)
export async function getPendingRequests(): Promise<FriendWithProfile[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      friend:profiles!friendships_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('friend_id', user.user.id)
    .eq('status', 'pending');

  if (error) {
    logger.error('Error fetching pending requests:', error);
    throw error;
  }

  return (data || []) as unknown as FriendWithProfile[];
}

// Get sent friend requests (I sent, still pending)
export async function getSentRequests(): Promise<FriendWithProfile[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      *,
      friend:profiles!friendships_friend_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('user_id', user.user.id)
    .eq('status', 'pending');

  if (error) {
    logger.error('Error fetching sent requests:', error);
    throw error;
  }

  return (data || []) as unknown as FriendWithProfile[];
}

// Send friend request
export async function sendFriendRequest(friendId: string): Promise<Friendship> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  if (user.user.id === friendId) {
    throw new Error("You can't send a friend request to yourself");
  }

  // Check if friendship already exists
  const { data: existing } = await (supabase
    .from('friendships') as any)
    .select('id, status')
    .or(`user_id.eq.${user.user.id},friend_id.eq.${user.user.id}`)
    .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
    .single();

  if (existing) {
    throw new Error(
      existing.status === 'pending' 
        ? 'Friend request already pending' 
        : 'You are already friends'
    );
  }

  const { data, error } = await (supabase
    .from('friendships') as any)
    .insert({
      user_id: user.user.id,
      friend_id: friendId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending friend request:', error);
    throw error;
  }

  return data as Friendship;
}

// Accept friend request
export async function acceptFriendRequest(friendshipId: string): Promise<Friendship> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await (supabase
    .from('friendships') as any)
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('friend_id', user.user.id) // Only the recipient can accept
    .select()
    .single();

  if (error) {
    logger.error('Error accepting friend request:', error);
    throw error;
  }

  // Create the reverse friendship as well for bidirectional queries
  await (supabase
    .from('friendships') as any)
    .insert({
      user_id: user.user.id,
      friend_id: data.user_id,
      status: 'accepted',
    });

  return data as Friendship;
}

// Decline friend request
export async function declineFriendRequest(friendshipId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('friendships') as any)
    .delete()
    .eq('id', friendshipId)
    .eq('friend_id', user.user.id);

  if (error) {
    logger.error('Error declining friend request:', error);
    throw error;
  }
}

// Cancel sent friend request
export async function cancelFriendRequest(friendshipId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('friendships') as any)
    .delete()
    .eq('id', friendshipId)
    .eq('user_id', user.user.id);

  if (error) {
    logger.error('Error canceling friend request:', error);
    throw error;
  }
}

// Remove friend
export async function removeFriend(friendshipId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Get the friendship to find the friend's ID
  const { data: friendship } = await (supabase
    .from('friendships') as any)
    .select('user_id, friend_id')
    .eq('id', friendshipId)
    .single();

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  const friendId = friendship.user_id === user.user.id 
    ? friendship.friend_id 
    : friendship.user_id;

  // Delete both directions of the friendship
  const { error } = await (supabase
    .from('friendships') as any)
    .delete()
    .or(`and(user_id.eq.${user.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.user.id})`);

  if (error) {
    logger.error('Error removing friend:', error);
    throw error;
  }
}

// Block user
export async function blockUser(userId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // First remove any existing friendship
  await (supabase
    .from('friendships') as any)
    .delete()
    .or(`and(user_id.eq.${user.user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.user.id})`);

  // Create a blocked relationship
  const { error } = await (supabase
    .from('friendships') as any)
    .insert({
      user_id: user.user.id,
      friend_id: userId,
      status: 'blocked',
    });

  if (error) {
    logger.error('Error blocking user:', error);
    throw error;
  }
}

// Update streak visibility for a friend
export async function updateStreakVisibility(
  friendshipId: string, 
  visibleStreaks: string[]
): Promise<Friendship> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await (supabase
    .from('friendships') as any)
    .update({ visible_streaks: visibleStreaks })
    .eq('id', friendshipId)
    .eq('user_id', user.user.id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating streak visibility:', error);
    throw error;
  }

  return data as Friendship;
}

// Get friends' streaks
export async function getFriendsStreaks(): Promise<FriendStreak[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: friendships, error: friendsError } = await (supabase
    .from('friendships') as any)
    .select(`
      friend_id,
      visible_streaks,
      friend:profiles!friendships_friend_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('user_id', user.user.id)
    .eq('status', 'accepted');

  if (friendsError || !friendships) {
    logger.error('Error fetching friends for streaks:', friendsError);
    return [];
  }

  const friendIds = (friendships as any[]).map((f: any) => f.friend_id);
  
  if (friendIds.length === 0) return [];

  // Get streaks for all friends
  const { data: streaks, error: streaksError } = await (supabase
    .from('streaks') as any)
    .select('*')
    .in('user_id', friendIds);

  if (streaksError || !streaks) {
    logger.error('Error fetching friend streaks:', streaksError);
    return [];
  }

  // Map streaks to friends with visibility filtering
  const result: FriendStreak[] = [];

  for (const friendship of (friendships as any[])) {
    const friend = friendship.friend as Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    const friendStreaks = (streaks as any[]).filter((s: any) => 
      s.user_id === friendship.friend_id && 
      friendship.visible_streaks.includes(s.type)
    );

    for (const streak of friendStreaks) {
      result.push({
        userId: friend.id,
        username: friend.username || 'User',
        displayName: friend.display_name || friend.username || 'User',
        avatarUrl: friend.avatar_url,
        streakType: streak.type,
        currentCount: streak.current_count,
        lastCheckIn: streak.last_check_in,
      });
    }
  }

  return result;
}

// === ENCOURAGEMENTS ===

// Send an encouragement
export async function sendEncouragement(
  toUserId: string, 
  message: string, 
  emoji?: string
): Promise<Encouragement> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await (supabase
    .from('encouragements') as any)
    .insert({
      from_user_id: user.user.id,
      to_user_id: toUserId,
      message,
      emoji,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending encouragement:', error);
    throw error;
  }

  return data as Encouragement;
}

// Get received encouragements
export async function getEncouragements(unreadOnly = false): Promise<EncouragementWithSender[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  let query = (supabase
    .from('encouragements') as any)
    .select(`
      *,
      sender:profiles!encouragements_from_user_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('to_user_id', user.user.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    logger.error('Error fetching encouragements:', error);
    throw error;
  }

  return (data || []) as unknown as EncouragementWithSender[];
}

// Get unread encouragement count
export async function getUnreadEncouragementCount(): Promise<number> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { count, error } = await (supabase
    .from('encouragements') as any)
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', user.user.id)
    .eq('read', false);

  if (error) {
    logger.error('Error counting unread encouragements:', error);
    return 0;
  }

  return count || 0;
}

// Mark encouragements as read
export async function markEncouragementAsRead(encouragementId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('encouragements') as any)
    .update({ read: true })
    .eq('id', encouragementId)
    .eq('to_user_id', user.user.id);

  if (error) {
    logger.error('Error marking encouragement as read:', error);
    throw error;
  }
}

// Mark all encouragements as read
export async function markAllEncouragmentsAsRead(): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await (supabase
    .from('encouragements') as any)
    .update({ read: true })
    .eq('to_user_id', user.user.id)
    .eq('read', false);

  if (error) {
    logger.error('Error marking all encouragements as read:', error);
    throw error;
  }
}

// Pre-defined encouragement templates
export const ENCOURAGEMENT_TEMPLATES = [
  { emoji: '🔥', message: "You're on fire! Keep up the great work!" },
  { emoji: '💪', message: 'Stay strong, you got this!' },
  { emoji: '🌟', message: 'Your consistency is inspiring!' },
  { emoji: '🚀', message: 'To the moon! Amazing progress!' },
  { emoji: '👏', message: "Great job! I'm proud of you!" },
  { emoji: '❤️', message: 'Sending love and support your way!' },
  { emoji: '🎯', message: 'Keep hitting those goals!' },
  { emoji: '☀️', message: 'Shine bright today!' },
];
