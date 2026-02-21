import { z } from "zod";
import { createRouter, procedure } from "../trpc";

// All feature flags are resolved locally — no remote flag service.
export const featureFlagsRouter = createRouter({
  getAll: procedure.query(() => {
    return { flags: {}, payloads: {} };
  }),

  getFlag: procedure
    .input(z.object({ key: z.string() }))
    .query(() => {
      return { value: undefined, payload: undefined };
    }),

  refresh: procedure.mutation(() => {
    return { flags: {}, payloads: {} };
  }),
});
