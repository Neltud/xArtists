# xArtists MCP Server

Model Context Protocol bridge between **GrokyversX (Grok)** and **Vellum / LIA**.

See [docs/GROK_VELLUM_MCP.md](../../docs/GROK_VELLUM_MCP.md) for full contract.

## Quick start

```bash
export XARTISTS_ROOT=/path/to/xArtists
python3 packages/xartists-mcp/src/server.py
```

Or register in `.mcp.json` (see repo root example).

## Self-test (no MCP client needed)

```bash
export XARTISTS_ROOT=/path/to/xArtists
python3 packages/xartists-mcp/src/selftest.py
```
