import { describe, expect, it } from "vitest";
import {
  createLobster,
  DirectiveRegistrationError,
  type BlockDirectiveHandler,
  type BlockDirectiveNode,
  type InlineDirectiveNode,
} from "../src/index.node.js";

function makeLobster() {
  const lobster = createLobster();
  lobster.registerBlockDirective("note", {
    transform(context): BlockDirectiveNode {
      return {
        type: "block-directive",
        name: context.name,
        attributes: context.attributes,
        children: context.children,
      };
    },
  });
  lobster.registerInlineDirective("mark", {
    transform(context): InlineDirectiveNode {
      return {
        type: "inline-directive",
        name: context.name,
        attributes: context.attributes,
        children: context.children,
      };
    },
  });
  return lobster;
}

describe("DirectiveRegistry", () => {
  it("validates names, handlers, duplicates, and reserved block names", () => {
    const lobster = createLobster();
    const handler: BlockDirectiveHandler = {
      transform: () => ({ type: "paragraph", children: [] }),
    };
    lobster.registerBlockDirective("valid-name", handler);
    expect(() => lobster.registerBlockDirective("valid-name", handler)).toThrow(
      /already registered/
    );
    expect(() => lobster.registerBlockDirective("123invalid", handler)).toThrow(
      DirectiveRegistrationError
    );
    expect(() => lobster.registerBlockDirective("details", handler)).toThrow(
      /built-in/
    );
  });

  it("keeps registries isolated between instances", () => {
    const first = makeLobster();
    const second = createLobster();
    expect(first.parseDocument(":::note\nhello\n:::").body[0].type).toBe("block-directive");
    expect(second.parseDocument(":::note\nhello\n:::").body[0].type).toBe("paragraph");
  });
});

describe("block directives", () => {
  it("parses attributes and Markdown children", () => {
    const doc = makeLobster().parseDocument(
      ':::note{type=warning title="Hello World" count=3}\n## Important\n\n**Read this**\n:::'
    );
    const node = doc.body[0] as BlockDirectiveNode;
    expect(node.type).toBe("block-directive");
    expect(node.attributes).toEqual({
      type: "warning",
      title: "Hello World",
      count: "3",
    });
    expect(node.children.map((child) => child.type)).toEqual(["heading", "paragraph"]);
  });

  it("supports nested registered directives", () => {
    const doc = makeLobster().parseDocument(
      ":::note\nouter\n\n:::note{type=inner}\ninner\n:::\n\n:::"
    );
    const outer = doc.body[0] as BlockDirectiveNode;
    expect(outer.children.some((node) => node.type === "block-directive")).toBe(true);
  });

  it("does not parse directives inside code fences", () => {
    const doc = makeLobster().parseDocument("```md\n:::note\nhello\n:::\n```");
    expect(doc.body).toHaveLength(1);
    expect(doc.body[0].type).toBe("code_block");
  });

  it("ignores directive-looking lines in a nested code fence", () => {
    const doc = makeLobster().parseDocument(
      ":::note\n```md\n:::note\n```\nafter\n:::"
    );
    const note = doc.body[0] as BlockDirectiveNode;
    expect(note.type).toBe("block-directive");
    expect(note.children.map((node) => node.type)).toEqual(["code_block", "paragraph"]);
  });

  it("preserves unknown, malformed, and unclosed directives as text", () => {
    const lobster = makeLobster();
    for (const markdown of [
      ":::unknown\nhello\n:::",
      ":::note{broken}\nhello\n:::",
      ":::note\nhello",
    ]) {
      const doc = lobster.parseDocument(markdown);
      expect(doc.body[0].type).toBe("paragraph");
    }
  });

  it("renders safe fixed attributes without forwarding Markdown attributes", () => {
    const html = makeLobster().toHTML(":::note{onclick=alert(1)}\n<script>x</script>\n:::");
    expect(html).toContain(
      '<div class="lbs-directive lbs-directive-note" data-directive="note">'
    );
    expect(html).not.toContain("onclick=");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("inline directives", () => {
  it("parses attributes and nested inline Markdown", () => {
    const doc = makeLobster().parseDocument(
      'This is :mark[**important**]{color="bright yellow"} text.'
    );
    const paragraph = doc.body[0];
    if (paragraph.type !== "paragraph") throw new Error("expected paragraph");
    const node = paragraph.children.find(
      (child): child is InlineDirectiveNode => child.type === "inline-directive"
    );
    expect(node?.attributes).toEqual({ color: "bright yellow" });
    expect(node?.children[0].type).toBe("strong");
  });

  it("does not parse inline directives in code spans", () => {
    const doc = makeLobster().parseDocument("`:mark[test]`");
    const paragraph = doc.body[0];
    expect(paragraph.type).toBe("paragraph");
    if (paragraph.type === "paragraph") expect(paragraph.children[0].type).toBe("code_span");
  });

  it("renders the stable inline directive wrapper", () => {
    const html = makeLobster().toHTML("A :mark[highlight] here");
    expect(html).toContain(
      '<span class="lbs-inline-directive lbs-inline-directive-mark" data-directive="mark">highlight</span>'
    );
  });
});
