// Proof: talk to the Convex backend the *packaged app* spawned, using the same
// public functions the renderer uses. Read → write → read-back = full CRUD.
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const c = new ConvexHttpClient("http://127.0.0.1:3210");

const before = await c.query(anyApi.pages.list, {});
const id = await c.mutation(anyApi.pages.create, {
  title: "✅ Standalone install works — created via app's backend",
});
const after = await c.query(anyApi.pages.list, {});

console.log(
  JSON.stringify(
    {
      pagesBefore: before.length,
      createdId: String(id),
      pagesAfter: after.length,
      titles: after.map((p) => p.title),
    },
    null,
    2
  )
);
