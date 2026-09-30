# Send to AI: gateway requirements

The site is static. When a visitor presses **Send to AI**, their browser calls your gateway directly, from the Pages origin. Nothing passes through a server of ours, so the gateway must accept a cross-origin browser request. This page lists what the gateway needs and how the site behaves.

## Configuration recap

```yaml
ai:
  endpoints:
    - id: internal-gateway
      label: Internal LLM gateway
      base_url: https://llm.internal.example/v1
      api_style: openai-chat          # openai-chat | openai-responses | anthropic-messages | ollama
      auth: mtls                      # mtls | bearer | none
      headers:
        X-Requested-By: prompt-library
        X-Team: "${AI_TEAM_HEADER}"   # substituted from a CI variable at build time
      models:
        - { id: gemma-4-27b, label: Gemma 4 27B, default: true }
        - { id: qwen3-coder, label: Qwen3 Coder }
      defaults: { temperature: 0.2, max_tokens: 2048 }
      stream: true
      timeout_seconds: 120
```

The page's `Content-Security-Policy` sets `connect-src` to `'self'` plus the origin of every `base_url`, so the browser refuses to send a prompt anywhere else.

## Requests the site makes

| `api_style` | URL | Body (abridged) | Streaming |
|---|---|---|---|
| `openai-chat` | `{base_url}/chat/completions` | `{model, messages:[{role:system?},{role:user}], temperature, max_tokens, stream, stream_options:{include_usage:true}}` | SSE `data:` lines, `[DONE]` |
| `openai-responses` | `{base_url}/responses` | `{model, instructions?, input, temperature, max_output_tokens, stream}` | SSE events `response.output_text.delta`, `response.completed` |
| `anthropic-messages` | `{base_url}/messages` | `{model, system?, messages:[{role:user}], max_tokens, temperature, stream}` + headers `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true` | SSE `content_block_delta`, `message_delta`, `message_stop` |
| `ollama` | `{base_url}/api/chat` (a trailing `/v1` on `base_url` is dropped) | `{model, messages, stream, options:{temperature, num_predict}}` | NDJSON lines |

For a `system-prompt` artefact the body is sent as the system message and the visitor types the user message. For every other type the body (with variables filled) is the user message, with an optional system message chosen from the library's system prompts. Every request carries `Content-Type: application/json`, the configured `headers`, and for `auth: bearer` an `Authorization: Bearer …` header from a token the visitor pastes once into **Settings** (kept in their browser's localStorage only).

## CORS

Because the request is cross-origin and carries custom headers, the browser sends an `OPTIONS` preflight first. The gateway must answer it and the real request with:

```
Access-Control-Allow-Origin: https://<group>.gitlab.io        # the Pages origin exactly, never *
Access-Control-Allow-Credentials: true                         # required for mTLS (credentials: include)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-By, X-Team, anthropic-version, anthropic-dangerous-direct-browser-access
Access-Control-Max-Age: 600
Vary: Origin
```

Add every header name you configure under `headers` to `Access-Control-Allow-Headers`. With `Allow-Credentials: true` the browser rejects `Allow-Origin: *`; echo the exact origin. Streaming responses need `Content-Type: text/event-stream` (or `application/x-ndjson` for Ollama) and no response buffering on the proxy (`X-Accel-Buffering: no` on nginx).

## mTLS

With `auth: mtls` the site calls `fetch` with `credentials: "include"` and does nothing else: the browser presents the visitor's client certificate during the TLS handshake. Consequences:

- The gateway terminates TLS with client-certificate verification and maps the certificate to a user or team itself.
- The first call in a browser session shows the browser's certificate picker (Edge and Chrome; Firefox needs `security.default_personal_cert` set to ask or a matching certificate). The panel says so before the first request.
- A missing or rejected certificate surfaces as an HTTP 401/403 (explained as a certificate problem in the panel) or as a failed TLS handshake (explained as network/CORS/certificate; the **Check connection** button sends a minimal request and reports which).
- The page never sees the certificate or key.

## Bearer and none

`auth: bearer`: the visitor pastes a token into **Settings** in the panel; it is stored in localStorage under the endpoint id and sent as `Authorization: Bearer`. `auth: none`: only the configured headers are sent (use this for a gateway that authenticates by network position or by the `X-*` headers).

## Testing the gateway without the site

```sh
# Preflight
curl -i -X OPTIONS https://llm.internal.example/v1/chat/completions \
  -H 'Origin: https://group.gitlab.io' -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,x-requested-by'
# Real request with a client certificate
curl -i --cert client.crt --key client.key https://llm.internal.example/v1/chat/completions \
  -H 'Origin: https://group.gitlab.io' -H 'Content-Type: application/json' \
  -d '{"model":"gemma-4-27b","messages":[{"role":"user","content":"Reply with pong"}],"max_tokens":8}'
```

Both responses must include the `Access-Control-*` headers above.

## Privacy

Prompts and replies stay in the visitor's browser. The site does not log them. The **Advanced → keep the last few exchanges** toggle, off by default, stores up to five exchanges per artefact in localStorage.
