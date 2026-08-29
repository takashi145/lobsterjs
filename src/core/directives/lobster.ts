import { parseDocument } from "../block-parser.js";
import type {
  BlockDirectiveHandler,
  Document,
  InlineDirectiveHandler,
} from "../types.js";
import { renderDocument } from "../../renderer/html/renderer.js";
import { DirectiveRegistry } from "./registry.js";

export interface LobsterInstance {
  registerBlockDirective(name: string, handler: BlockDirectiveHandler): void;
  registerInlineDirective(name: string, handler: InlineDirectiveHandler): void;
  parseDocument(markdown: string): Document;
  renderDocument(document: Document): string;
  toHTML(markdown: string): string;
}

/** Creates an isolated lobster parser with its own directive registry. */
export function createLobster(): LobsterInstance {
  const registry = new DirectiveRegistry();
  return {
    registerBlockDirective: (name, handler) => registry.registerBlock(name, handler),
    registerInlineDirective: (name, handler) => registry.registerInline(name, handler),
    parseDocument: (markdown) => parseDocument(markdown, registry),
    renderDocument,
    toHTML: (markdown) => renderDocument(parseDocument(markdown, registry)),
  };
}
