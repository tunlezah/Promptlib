---
title: Fill-in fields (variables)
summary: How the {{curly}} fields on prompt pages work and how to add them to your own prompts.
order: 3
---
Some prompts have parts that change every time you use them: the programming language, the audience, the text to work on. In this library those parts are **variables**. On the page they appear as fill-in fields inside the prompt text.

## Using them

- Type into a field, or pick from the list if it has one. The prompt text updates as you type.
- Fields start with a sensible default, shown in grey. Leave it if it suits you.
- **Copy** copies the prompt with your values filled in.
- Your values are remembered in your browser for that prompt, so next time you do not have to retype them.

Nothing you type into a field leaves your browser, unless you press **Send to AI**, in which case it goes to the configured endpoint and nowhere else.

## Adding variables to a prompt you contribute

In the prompt body, write the field name in double curly braces:

```
Review this {{language}} code for {{focus}}.
```

In the frontmatter, declare each one:

```yaml
variables:
  - name: language
    description: Programming language of the code under review
    default: Python
    options: [Python, Go, Rust, TypeScript]
  - name: focus
    description: What to prioritise
    default: injection and authentication flaws
```

- `name` must match the text between the braces exactly. Letters, digits and underscores only.
- `options` is optional. With it, the field becomes a picker.
- `multiline: true` gives a bigger box for pasting text.
- A `{{field}}` in the body that is not declared is shown as plain text and flagged as a warning when the library is built.

## Next

- [Skills, rules, commands and hooks: which is which?](../skill-vs-rule/)
- [How to contribute](../how-to-contribute/)
