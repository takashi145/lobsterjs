import type { BlockDirectiveHandler, InlineDirectiveHandler } from "../types.js";

export const DIRECTIVE_NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
export const RESERVED_BLOCK_DIRECTIVE_NAMES = new Set([
  "header",
  "footer",
  "details",
  "warp",
]);

export class DirectiveRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DirectiveRegistrationError";
  }
}

function validateHandler(
  kind: "Block" | "Inline",
  handler: BlockDirectiveHandler | InlineDirectiveHandler
): void {
  if (!handler || typeof handler !== "object" || typeof handler.transform !== "function") {
    throw new DirectiveRegistrationError(
      `${kind} directive handler must define a transform(context) function.`
    );
  }
}

function validateName(name: string): void {
  if (!DIRECTIVE_NAME_RE.test(name)) {
    throw new DirectiveRegistrationError(`Invalid directive name "${name}".`);
  }
}

export class DirectiveRegistry {
  private readonly block = new Map<string, BlockDirectiveHandler>();
  private readonly inline = new Map<string, InlineDirectiveHandler>();

  registerBlock(name: string, handler: BlockDirectiveHandler): void {
    validateName(name);
    validateHandler("Block", handler);
    if (RESERVED_BLOCK_DIRECTIVE_NAMES.has(name)) {
      throw new DirectiveRegistrationError(
        `Block directive "${name}" conflicts with a built-in directive.`
      );
    }
    if (this.block.has(name)) {
      throw new DirectiveRegistrationError(
        `Block directive "${name}" is already registered.`
      );
    }
    this.block.set(name, handler);
  }

  registerInline(name: string, handler: InlineDirectiveHandler): void {
    validateName(name);
    validateHandler("Inline", handler);
    if (this.inline.has(name)) {
      throw new DirectiveRegistrationError(
        `Inline directive "${name}" is already registered.`
      );
    }
    this.inline.set(name, handler);
  }

  getBlock(name: string): BlockDirectiveHandler | undefined {
    return this.block.get(name);
  }

  getInline(name: string): InlineDirectiveHandler | undefined {
    return this.inline.get(name);
  }

  hasBlock(name: string): boolean {
    return this.block.has(name);
  }

  hasInline(name: string): boolean {
    return this.inline.has(name);
  }
}

export const defaultDirectiveRegistry = new DirectiveRegistry();

export function registerBlockDirective(
  name: string,
  handler: BlockDirectiveHandler
): void {
  defaultDirectiveRegistry.registerBlock(name, handler);
}

export function registerInlineDirective(
  name: string,
  handler: InlineDirectiveHandler
): void {
  defaultDirectiveRegistry.registerInline(name, handler);
}
