import { z } from "zod";

export const inviteDuelSchema = z.object({
    player2Id: z.string().uuid("Invalid opponent ID format"),
    challengeId: z.string().uuid("Invalid challenge ID format"),
});

export const acceptDuelSchema = z.object({
    duelId: z.string().uuid("Invalid duel ID format"),
});

export const submitDuelSchema = z.object({
    duelId: z.string().uuid("Invalid duel ID format"),
    submission: z.string().min(1, "Submission cannot be empty"),
});
