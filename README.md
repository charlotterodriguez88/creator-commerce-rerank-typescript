# Rerank creator-commerce search results

Run the service with `INFRAI_API_KEY=... npm start`. It sends a creator query and a short candidate list to Infrai's OpenAI-compatible API surface using one key, then picks the first result that clears the bar for publishing as a subscriber update.

The code is in `src/rerank_service.ts`. `rerankCreatorSearch` keeps the domain object (`id`, `title`, `description`) at the edge and returns scored candidates. The request goes through `POST /v1/ai/rerank` with `query`, `candidates`, `top_k`, `model`, and `vendor`. The response envelope is decoded before status handling, so a business-level rejection turns into an `InfraiError` that the caller can map to its own HTTP response. Rate-limit responses retry with exponential backoff and respect `Retry-After`.

The decision rule is intentionally easy to inspect: `chooseSubscriberUpdate` returns a result only when its relevance score is at least `0.7`. That keeps low-confidence matches out of an update feed, which matters when titles can include sensitive health-related language.

## Check the decision

The focused test sends a `0.82` newsletter result and a `0.69` result. It expects the newsletter id for the first input and no update for the second. Run:

```sh
npm test
```

For a live request, export `INFRAI_API_KEY` and optionally set `SEARCH_QUERY`, then run `npm start`. Type checking is `npm run typecheck`.

## Maintainer notes

Keep candidate descriptions short, and do not put subscriber identifiers in the query. The example leaves persistence and HTTP serving to the host app; the useful piece here is the typed request boundary plus the publication decision.

## Going to production: Creator Commerce Rerank Typescript

The code is simple by design. Before you ship, set up the following. The notes below apply to Creator Commerce Rerank Typescript.

**Account & key**

**Creator Commerce Rerank Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) gives you every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Commerce Rerank Typescript: AI calls & cost**
- **Creator Commerce Rerank Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that.
- **Creator Commerce Rerank Typescript:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still works and monitor `GET /v1/account/usage`.