import {
  parseGoogleChatError,
  type GoogleChatErrorKind,
} from './googleChatFormatter';

const GOOGLE_CHAT_API_BASE = 'https://chat.googleapis.com/v1';

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAA..."
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE' | string;
  singleUserBotDm?: boolean;
  spaceDetails?: {
    description?: string;
    guidelines?: string;
  };
  membershipCount?: {
    joinedDirectHumanUserCount?: number;
    joinedGroupCount?: number;
  };
}

export interface GoogleChatSender {
  name?: string;
  displayName?: string;
  type?: 'HUMAN' | 'BOT' | string;
}

export interface GoogleChatReactionSummary {
  emoji?: {
    unicode?: string;
  };
  reactionCount?: number;
}

export interface GoogleChatMessage {
  name: string; // e.g. "spaces/AAAA/messages/BBBB"
  sender?: GoogleChatSender;
  createTime?: string;
  text?: string;
  formattedText?: string;
  emojiReactionSummaries?: GoogleChatReactionSummary[];
  thread?: {
    name?: string;
  };
}

export interface GoogleChatMember {
  name: string;
  role?: string;
  member?: {
    name?: string;
    displayName?: string;
    type?: string;
  };
}

export class GoogleChatApiError extends Error {
  readonly kind: GoogleChatErrorKind;
  readonly status: number;

  constructor(kind: GoogleChatErrorKind, status: number, message: string) {
    super(message);
    this.name = 'GoogleChatApiError';
    this.kind = kind;
    this.status = status;
  }
}

async function chatFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T> {
  if (!accessToken) {
    throw new GoogleChatApiError('UNAUTHORIZED', 401, 'Missing OAuth access token.');
  }

  const url = path.startsWith('http')
    ? path
    : `${GOOGLE_CHAT_API_BASE}/${path.replace(/^\/+/, '')}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const err = parseGoogleChatError(response.status, parsed);
    throw new GoogleChatApiError(err.kind, err.status, err.rawMessage);
  }

  return (parsed ?? {}) as T;
}

export async function listGoogleChatSpaces(
  accessToken: string
): Promise<GoogleChatSpace[]> {
  const data = await chatFetch<{ spaces?: GoogleChatSpace[] }>(
    'spaces?pageSize=50',
    accessToken
  );
  return data.spaces ?? [];
}

export async function listGoogleChatMessages(
  accessToken: string,
  spaceName: string,
  pageSize: number = 30
): Promise<GoogleChatMessage[]> {
  const encodedSpace = spaceName.replace(/^\/+/, '');
  const data = await chatFetch<{ messages?: GoogleChatMessage[] }>(
    `${encodedSpace}/messages?pageSize=${pageSize}&orderBy=createTime%20desc`,
    accessToken
  );
  // Display chronologically (oldest to newest) in the conversation panel
  return [...(data.messages ?? [])].reverse();
}

export async function listGoogleChatMembers(
  accessToken: string,
  spaceName: string
): Promise<GoogleChatMember[]> {
  const encodedSpace = spaceName.replace(/^\/+/, '');
  const data = await chatFetch<{ memberships?: GoogleChatMember[] }>(
    `${encodedSpace}/members?pageSize=50`,
    accessToken
  );
  return data.memberships ?? [];
}

export async function sendGoogleChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> {
  const encodedSpace = spaceName.replace(/^\/+/, '');
  return chatFetch<GoogleChatMessage>(`${encodedSpace}/messages`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function deleteGoogleChatMessage(
  accessToken: string,
  messageName: string
): Promise<void> {
  const encodedMessage = messageName.replace(/^\/+/, '');
  await chatFetch<Record<string, unknown>>(encodedMessage, accessToken, {
    method: 'DELETE',
  });
}

export async function createGoogleChatSpace(
  accessToken: string,
  displayName: string
): Promise<GoogleChatSpace> {
  return chatFetch<GoogleChatSpace>('spaces', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName: displayName.trim(),
    }),
  });
}

export async function addGoogleChatReaction(
  accessToken: string,
  messageName: string,
  unicodeEmoji: string
): Promise<void> {
  const encodedMessage = messageName.replace(/^\/+/, '');
  await chatFetch<Record<string, unknown>>(
    `${encodedMessage}/reactions`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        emoji: {
          unicode: unicodeEmoji,
        },
      }),
    }
  );
}
