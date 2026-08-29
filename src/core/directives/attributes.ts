import type { DirectiveAttributes } from "../types.js";

const ATTRIBUTE_NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*/;

/** Parses the contents of a directive attribute block (without braces). */
export function parseDirectiveAttributes(source: string): DirectiveAttributes | null {
  const attributes: DirectiveAttributes = {};
  let position = 0;

  while (position < source.length) {
    while (/\s/.test(source[position] ?? "")) position++;
    if (position >= source.length) break;

    const nameMatch = source.slice(position).match(ATTRIBUTE_NAME_RE);
    if (!nameMatch) return null;
    const name = nameMatch[0];
    position += name.length;

    while (/\s/.test(source[position] ?? "")) position++;
    if (source[position] !== "=") return null;
    position++;
    while (/\s/.test(source[position] ?? "")) position++;

    let value = "";
    const quote = source[position];
    if (quote === '"' || quote === "'") {
      position++;
      const end = source.indexOf(quote, position);
      if (end === -1) return null;
      value = source.slice(position, end);
      position = end + 1;
      if (position < source.length && !/\s/.test(source[position])) return null;
    } else {
      const start = position;
      while (position < source.length && !/\s/.test(source[position])) position++;
      if (position === start) return null;
      value = source.slice(start, position);
    }

    attributes[name] = value;
  }

  return attributes;
}

/** Parses an optional complete `{...}` suffix. */
export function parseDirectiveAttributeSuffix(
  source: string
): { attributes: DirectiveAttributes; length: number } | null {
  if (!source.startsWith("{")) return { attributes: {}, length: 0 };
  const end = source.indexOf("}", 1);
  if (end === -1) return null;
  const attributes = parseDirectiveAttributes(source.slice(1, end));
  if (!attributes) return null;
  return { attributes, length: end + 1 };
}
