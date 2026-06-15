// OpenCode SDK client connection manager
// Wave 2: wraps @opencode-ai/sdk for session lifecycle

let sdkClient: any = null;

function getSdk() {
  try {
    return require('@opencode-ai/sdk');
  } catch {
    return null;
  }
}

function makeClientId(): string {
  return `sidecar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface OpenCodeConnection {
  client: any;
  host: string;
  port: number;
  connectedAt: number;
}

let connection: OpenCodeConnection | null = null;

export async function connectToServer(
  host: string = '127.0.0.1',
  port: number = 4196
): Promise<OpenCodeConnection> {
  const sdk = getSdk();
  if (!sdk) {
    console.warn('opencode SDK not installed, using mock client');
    const mock = createMockClient();
    connection = { client: mock, host, port, connectedAt: Date.now() };
    return connection;
  }

  const client = await sdk.createOpencodeClient({
    baseUrl: `http://${host}:${port}`,
  });

  connection = { client, host, port, connectedAt: Date.now() };
  return connection;
}

export function getConnection(): OpenCodeConnection | null {
  return connection;
}

export async function createSession(title?: string): Promise<any> {
  const conn = getConnection();
  if (!conn) throw new Error('not connected to opencode server');

  if (conn.client.createSession) {
    return conn.client.createSession({ title: title ?? 'sidecar-session' });
  }
  // mock
  return { id: `mock-${Date.now()}`, title, status: 'idle' };
}

export async function sendPrompt(
  sessionId: string,
  text: string,
  command?: string
): Promise<any> {
  const conn = getConnection();
  if (!conn) throw new Error('not connected');

  if (conn.client.session?.prompt) {
    return conn.client.session.prompt(sessionId, { text, command });
  }
  // mock
  return { sessionId, status: 'sent' };
}

export async function sendCommand(
  sessionId: string,
  commandName: string,
  args: Record<string, unknown> = {}
): Promise<any> {
  const conn = getConnection();
  if (!conn) throw new Error('not connected');

  if (conn.client.session?.command) {
    return conn.client.session.command(sessionId, commandName, args);
  }
  // mock
  return { sessionId, command: commandName, status: 'queued' };
}

export async function abortSession(sessionId: string): Promise<void> {
  const conn = getConnection();
  if (!conn) return;

  if (conn.client.session?.abort) {
    await conn.client.session.abort(sessionId);
  }
}

export async function listSessions(): Promise<any[]> {
  const conn = getConnection();
  if (!conn) return [];

  if (conn.client.session?.list) {
    return conn.client.session.list();
  }
  return [];
}

// ---- Mock client for dev without SDK ----

function createMockClient() {
  const sessions = new Map<string, any>();

  return {
    createSession: async (opts: any) => {
      const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const session = { id, ...opts, status: 'idle', createdAt: new Date().toISOString() };
      sessions.set(id, session);
      return session;
    },
    session: {
      prompt: async (sessionId: string, _data: any) => {
        return { sessionId, status: 'sent' };
      },
      command: async (sessionId: string, command: string, _args: any) => {
        return { sessionId, command, status: 'queued' };
      },
      abort: async (sessionId: string) => {
        sessions.delete(sessionId);
      },
      list: async () => {
        return Array.from(sessions.values());
      },
    },
  };
}
