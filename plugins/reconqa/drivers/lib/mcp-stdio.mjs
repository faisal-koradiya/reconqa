// Minimal MCP server over stdio (newline-delimited JSON-RPC 2.0) for ReconQA's built-in drivers.
// Node built-ins only. Calls run one at a time, in order.
import { createInterface } from 'node:readline';

// tools: { name: async (args) => string | { image } }, toolList: MCP tool descriptors,
// isExpected(e): true for errors whose message is meant for the user (shown as is).
export function serve({ name, version, tools, toolList, isExpected = () => false }) {
  const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');
  async function handle(req) {
    const { id, method, params } = req;
    if (id === undefined) return; // notification
    if (method === 'initialize') {
      return send({ id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name, version } } });
    }
    if (method === 'ping') return send({ id, result: {} });
    if (method === 'tools/list') return send({ id, result: { tools: toolList } });
    if (method === 'tools/call') {
      const fn = Object.hasOwn(tools, params?.name) ? tools[params.name] : null;
      if (!fn) return send({ id, result: { isError: true, content: [{ type: 'text', text: `Unknown tool ${params?.name}` }] } });
      try {
        const r = await fn(params.arguments ?? {});
        const content = typeof r === 'string' ? [{ type: 'text', text: r }] : [{ type: 'image', data: r.image, mimeType: 'image/png' }];
        return send({ id, result: { content } });
      } catch (e) {
        const text = isExpected(e) ? e.message : `Driver error: ${e.message}`;
        return send({ id, result: { isError: true, content: [{ type: 'text', text }] } });
      }
    }
    send({ id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
  let queue = Promise.resolve();
  process.stdout.on('error', () => process.exit(0)); // client went away
  createInterface({ input: process.stdin }).on('line', (line) => {
    if (!line.trim()) return;
    let req;
    try { req = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: 'Parse error' } }); }
    queue = queue.then(() => handle(req)).catch((e) => send({ id: req.id ?? null, error: { code: -32603, message: e.message } }));
  });
}

// The ReconQA project for a driver: RECONQA_PROJECT, else Claude Code's project dir, else cwd.
export { findProject } from '../../hooks/lib/find-project.mjs';
