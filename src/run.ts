import { rerankCreatorSearch, chooseSubscriberUpdate, rerankRequestSchema } from "./rerank_service.ts";

const request = rerankRequestSchema.parse({
  query: process.env.SEARCH_QUERY ?? "creator rerank api",
  candidates: [
  { id: "bundle", title: "Creator asset bundle", description: "Digital downloads for a storefront" },
  { id: "update", title: "Subscriber release notes", description: "A concise update for paying subscribers" },
  { id: "course", title: "TypeScript creator course", description: "Lessons for shipping a small commerce API" }
  ],
  topK: 3
});

const ranked = await rerankCreatorSearch(request.query, request.candidates, request.topK);
const update = chooseSubscriberUpdate(ranked);
console.log(JSON.stringify({ query: request.query, ranked, subscriberUpdate: update?.id ?? null }, null, 2));
