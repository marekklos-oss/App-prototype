# Local read-only Figma MCP

This local stdio connector exposes only four read-only Figma REST API calls:

- `figma_get_file_structure`
- `figma_get_nodes`
- `figma_render_nodes`
- `figma_get_image_fills`

It requires a Figma personal access token with the `file_content:read` scope.
Keep the token only in Codex's local MCP environment as `FIGMA_ACCESS_TOKEN`.

## Build

```bash
npm install
npm run build
```

## Codex registration

Register this as a local stdio MCP server:

```json
{
  "command": "node",
  "args": ["/Users/marek.klos/Documents/LLM/Projects/App-prototype/figma-mcp-server/dist/index.js"],
  "env": {
    "FIGMA_ACCESS_TOKEN": "your-token-goes-here"
  }
}
```

Restart Codex after saving the connector configuration. Do not put the token in this repository.
