import { z } from "zod";

/** Zod schema for qualitative recovery tips returned by the LLM. */
export const RecoveryTipsSchema = z.object({
  tips: z.array(z.string().min(1).max(300)).min(1).max(5),
});

export type RecoveryTips = z.infer<typeof RecoveryTipsSchema>;
