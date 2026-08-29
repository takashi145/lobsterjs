import type { BlockNode, InlineNode } from "../types.js";

const BLOCK_NODE_TYPES = new Set([
  "heading",
  "paragraph",
  "horizontal_rule",
  "code_block",
  "blockquote",
  "bullet_list",
  "ordered_list",
  "table",
  "header_container",
  "footer_container",
  "details",
  "warp_definition",
  "block-directive",
]);

const INLINE_NODE_TYPES = new Set([
  "text",
  "emphasis",
  "strong",
  "strikethrough",
  "code_span",
  "inline_link",
  "link",
  "image",
  "footnote_ref",
  "inline_footnote",
  "warp_ref",
  "line_break",
  "inline-directive",
]);

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function assertBlockTransformResult(value: unknown, name: string): BlockNode {
  if (isPromiseLike(value)) {
    throw new TypeError(`Block directive "${name}" returned a Promise; transforms must be synchronous.`);
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !BLOCK_NODE_TYPES.has(String((value as { type: unknown }).type))
  ) {
    throw new TypeError(`Block directive "${name}" must return a block AST node.`);
  }
  return value as BlockNode;
}

export function assertInlineTransformResult(value: unknown, name: string): InlineNode {
  if (isPromiseLike(value)) {
    throw new TypeError(`Inline directive "${name}" returned a Promise; transforms must be synchronous.`);
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !INLINE_NODE_TYPES.has(String((value as { type: unknown }).type))
  ) {
    throw new TypeError(`Inline directive "${name}" must return an inline AST node.`);
  }
  return value as InlineNode;
}
