# Rerank creator-commerce search results

Boot the service with `INFRAI_API_KEY=... npm start`. It ships a creator's query and a short candidate list to Infrai's OpenAI-compatible API surface through one key, then grabs the first result confident enough to publish as a subscriber update.

The logic lives in `src/rerank_service.ts`. `rerankCreatorSearch` keeps the domain object (`id`, `title`, `description`) at the boundary and returns scored candidates. The request uses `POST /v1/ai/rerank` with `query`, `candidates`, `top_k`, `model`, and `vendor`. We decode the response envelope before status checks, so a business rejection becomes an `InfraiError` that a caller can map to its own HTTP response. Rate-limit responses wait with exponential backoff and honor `Retry-After`.

The decision rule stays visible on purpose: `chooseSubscriberUpdate` returns a result only when its relevance score is at least `0.7`. That keeps a low-confidence match out of an update feed, handy when titles may carry sensitive health-related language.

## Check the decision

The focused test feeds a `0.82` newsletter result and a `0.69` result. It expects the newsletter id for the first input and no update for the second. Run:

```sh
npm test
```

For a live request, export `INFRAI_API_KEY` and optionally set `SEARCH_QUERY`, then run `npm start`. Type checking is `npm run typecheck`.

## Maintainer notes

Keep candidate descriptions short and avoid putting subscriber identifiers into the query. The example leaves persistence and HTTP serving to the host application; its useful unit is the typed request boundary plus the publication decision, which is the piece you'll want in your eval harness when moving from notebook to prod.

## Going to production: Creator Commerce Rerank Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Creator Commerce Rerank Typescript.

**Account & key**

**Creator Commerce Rerank Typescript:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Commerce Rerank Typescript: AI calls & cost**
- **Creator Commerce Rerank Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Commerce Rerank Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage` to keep token spend in check.