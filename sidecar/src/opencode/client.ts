// OpenCode SDK client connection manager
// Wraps @opencode-ai/sdk for real session lifecycle + mock fallback for dev

let sdkClient: any = null;

async function getSdk() {
  try {
    return await import('@opencode-ai/sdk');
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
  const sdk = await getSdk();
  if (!sdk) {
    console.warn('opencode SDK not installed, using mock client');
    const mock = createMockClient();
    connection = { client: mock, host, port, connectedAt: Date.now() };
    return connection;
  }

  console.log('opencode SDK loaded, creating client...');
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

  // Real SDK: client.session.create({ body: { title } })
  // Mock: client.session.create({ title })
  if (conn.client.session?.create) {
    const result = await conn.client.session.create({ body: { title: title ?? 'sidecar-session' } });
    // result.data is the Session object { id, title, ... }
    return result.data ?? result;
  }
  // fallback mock (shouldn't reach here if mock client is correct)
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
    // Real SDK: client.session.prompt({ path: { id }, body: { parts: [...] } })
    const parts: any[] = [{ type: 'text' as const, text }];
    return await conn.client.session.prompt({
      path: { id: sessionId },
      body: { parts },
    });
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
    // Real SDK: client.session.command({ path: { id }, body: { command, arguments } })
    return await conn.client.session.command({
      path: { id: sessionId },
      body: {
        command: commandName,
        arguments: JSON.stringify(args),
      },
    });
  }
  // mock
  return { sessionId, command: commandName, status: 'queued' };
}

export async function abortSession(sessionId: string): Promise<void> {
  const conn = getConnection();
  if (!conn) return;

  if (conn.client.session?.abort) {
    // Real SDK: client.session.abort({ path: { id } })
    await conn.client.session.abort({ path: { id: sessionId } });
  }
}

export async function listSessions(): Promise<any[]> {
  const conn = getConnection();
  if (!conn) return [];

  if (conn.client.session?.list) {
    // Real SDK: client.session.list() returns { data: Session[] }
    const result = await conn.client.session.list();
    return result.data ?? result ?? [];
  }
  return [];
}

// ---- Mock client for dev without SDK ----

function createMockClient() {
  const sessions = new Map<string, any>();

  return {
    session: {
      create: async (opts: any) => {
        const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const title = opts?.body?.title ?? 'mock-session';
        const session = { id, title, status: 'idle', createdAt: new Date().toISOString() };
        sessions.set(id, session);
        return { data: session };
      },
      prompt: async (_opts: any) => {
        return { data: { status: 'sent' } };
      },
      command: async (_opts: any) => {
        return { data: { status: 'queued' } };
      },
      abort: async (opts: any) => {
        const id = typeof opts === 'string' ? opts : opts?.path?.id;
        sessions.delete(id);
      },
      list: async () => {
        return { data: Array.from(sessions.values()) };
      },
    },
  };
}
