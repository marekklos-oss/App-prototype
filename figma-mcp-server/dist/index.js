import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const API_URL = "https://api.figma.com/v1";
const TIMEOUT_MS = 20_000;
const MAX_RESPONSE_CHARS = 100_000;
const readOnlyAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
function requireToken() {
    const token = process.env.FIGMA_ACCESS_TOKEN;
    if (!token) {
        throw new Error("FIGMA_ACCESS_TOKEN is missing. Add it to this MCP server's local environment in Codex settings.");
    }
    return token;
}
function assertFileKey(fileKey) {
    if (!/^[A-Za-z0-9_-]{10,128}$/.test(fileKey)) {
        throw new Error("Invalid Figma file key.");
    }
}
function assertNodeIds(nodeIds) {
    if (!nodeIds.length || nodeIds.length > 20 || nodeIds.some((id) => !/^\d+:\d+$/.test(id))) {
        throw new Error("Provide between 1 and 20 node IDs in Figma's numeric form, for example 28452:50102.");
    }
}
async function figmaGet(path, params = {}) {
    const url = new URL(`${API_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined)
            url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, {
        headers: { "X-Figma-Token": requireToken() },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const text = await response.text();
    if (!response.ok) {
        if (response.status === 403)
            throw new Error("Figma rejected the token. Check its expiry, file access, and file_content:read scope.");
        if (response.status === 404)
            throw new Error("Figma could not find this file or node. Check the link and file access.");
        throw new Error(`Figma request failed (${response.status}): ${text.slice(0, 500)}`);
    }
    return JSON.parse(text);
}
function result(data) {
    const text = JSON.stringify(data, null, 2);
    const output = text.length > MAX_RESPONSE_CHARS
        ? `${text.slice(0, MAX_RESPONSE_CHARS)}\n\n[Response truncated. Request fewer nodes or use a smaller depth.]`
        : text;
    return { content: [{ type: "text", text: output }] };
}
function failure(error) {
    const message = error instanceof Error ? error.message : "Unexpected Figma connector error.";
    return { isError: true, content: [{ type: "text", text: `Error: ${message}` }] };
}
const server = new McpServer({ name: "figma-mcp-server", version: "1.0.0" });
server.registerTool("figma_get_file_structure", {
    title: "Get Figma file structure",
    description: "Read a Figma file's top-level structure. This connector is read-only.",
    inputSchema: {
        file_key: z.string().describe("File key from a Figma URL"),
        depth: z.number().int().min(1).max(4).optional().describe("Tree depth; defaults to 2")
    },
    annotations: readOnlyAnnotations
}, async ({ file_key, depth }) => {
    try {
        assertFileKey(file_key);
        return result(await figmaGet(`/files/${encodeURIComponent(file_key)}`, { depth: depth ?? 2 }));
    }
    catch (error) {
        return failure(error);
    }
});
server.registerTool("figma_get_nodes", {
    title: "Get Figma nodes",
    description: "Read selected Figma nodes and their descendants. This connector is read-only.",
    inputSchema: {
        file_key: z.string().describe("File key from a Figma URL"),
        node_ids: z.array(z.string()).min(1).max(20).describe("Figma node IDs, for example 28452:50102"),
        depth: z.number().int().min(1).max(10).optional().describe("Optional descendant depth")
    },
    annotations: readOnlyAnnotations
}, async ({ file_key, node_ids, depth }) => {
    try {
        assertFileKey(file_key);
        assertNodeIds(node_ids);
        return result(await figmaGet(`/files/${encodeURIComponent(file_key)}/nodes`, { ids: node_ids.join(","), depth }));
    }
    catch (error) {
        return failure(error);
    }
});
server.registerTool("figma_render_nodes", {
    title: "Render Figma nodes",
    description: "Create temporary Figma-hosted PNG, JPG, SVG, or PDF render URLs for selected nodes. This connector is read-only.",
    inputSchema: {
        file_key: z.string().describe("File key from a Figma URL"),
        node_ids: z.array(z.string()).min(1).max(20).describe("Figma node IDs, for example 28452:50102"),
        format: z.enum(["png", "jpg", "svg", "pdf"]).default("png").describe("Render format"),
        scale: z.number().min(0.01).max(4).optional().describe("Optional render scale from 0.01 to 4")
    },
    annotations: readOnlyAnnotations
}, async ({ file_key, node_ids, format, scale }) => {
    try {
        assertFileKey(file_key);
        assertNodeIds(node_ids);
        return result(await figmaGet(`/images/${encodeURIComponent(file_key)}`, { ids: node_ids.join(","), format, scale }));
    }
    catch (error) {
        return failure(error);
    }
});
server.registerTool("figma_get_image_fills", {
    title: "Get Figma image fills",
    description: "Read temporary download URLs for image fills in a Figma file. This connector is read-only.",
    inputSchema: { file_key: z.string().describe("File key from a Figma URL") },
    annotations: readOnlyAnnotations
}, async ({ file_key }) => {
    try {
        assertFileKey(file_key);
        return result(await figmaGet(`/files/${encodeURIComponent(file_key)}/images`));
    }
    catch (error) {
        return failure(error);
    }
});
await server.connect(new StdioServerTransport());
