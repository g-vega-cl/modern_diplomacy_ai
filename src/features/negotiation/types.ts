export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  channelId: string
  timestamp: number
}

export type ChannelType = 'global' | 'group'

export interface ChatChannel {
  id: string
  name: string
  type: ChannelType
  memberIds: string[]
  createdBy?: string
}

export interface AuthMessage {
  type: 'auth'
  playerId: string
  playerName: string
}

export interface SendMessage {
  type: 'message'
  channelId: string
  content: string
}

export interface CreateGroupMessage {
  type: 'create_group'
  name: string
  memberIds: string[]
}

export interface InviteToGroupMessage {
  type: 'invite_to_group'
  channelId: string
  playerIds: string[]
}

export interface JoinGroupMessage {
  type: 'join_group'
  channelId: string
}

export interface LeaveGroupMessage {
  type: 'leave_group'
  channelId: string
}

export type ClientWsMessage =
  | AuthMessage
  | SendMessage
  | CreateGroupMessage
  | InviteToGroupMessage
  | JoinGroupMessage
  | LeaveGroupMessage

export interface MessageNotification {
  type: 'message'
  message: Message
}

export interface GroupCreatedNotification {
  type: 'group_created'
  channel: ChatChannel
}

export interface InvitedToGroupNotification {
  type: 'invited_to_group'
  channel: ChatChannel
  invitedBy: string
}

export interface MemberJoinedNotification {
  type: 'member_joined'
  channelId: string
  playerId: string
}

export interface MemberLeftNotification {
  type: 'member_left'
  channelId: string
  playerId: string
}

export interface GroupRemovedNotification {
  type: 'group_removed'
  channelId: string
}

export interface ErrorNotification {
  type: 'error'
  message: string
}

export interface AuthResponse {
  type: 'auth_ok'
  channels: ChatChannel[]
  globalHistory: Message[]
}

export type ServerWsMessage =
  | MessageNotification
  | GroupCreatedNotification
  | InvitedToGroupNotification
  | MemberJoinedNotification
  | MemberLeftNotification
  | GroupRemovedNotification
  | ErrorNotification
  | AuthResponse
