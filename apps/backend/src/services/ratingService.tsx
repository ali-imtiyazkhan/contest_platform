import { client } from "db/client";

export async function processContestRating(contestId: string) {
    const contest = await client.contest.findUnique({
        where: { id: contestId },
    });

    if (!contest) throw new Error("Contest not found");

    // Fetch final leaderboard sorted by score desc
    const leaderboard = await client.leaderboard.findMany({
        where: { contestId },
        orderBy: { score: "desc" },
        include: { user: true },
    });

    const totalParticipants = leaderboard.length;

    if (totalParticipants < 2) {
        console.log("Not enough participants for rating update.");
        return;
    }

    // Calculate average rating
    const avgRating =
        leaderboard.reduce((sum, entry) => sum + entry.user.rating, 0) /
        totalParticipants;

    const updates: {
        userId: string;
        before: number;
        after: number;
    }[] = [];

    for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const rank = i + 1;
        const oldRating = entry.user.rating;

        // Actual score (rank based)
        const actual =
            (totalParticipants - rank) / (totalParticipants - 1);

        // Expected score (against average field)
        const expected =
            1 / (1 + Math.pow(10, (avgRating - oldRating) / 400));

        const K = oldRating < 1400 ? 40 : 32;

        const newRating = Math.round(
            oldRating + K * (actual - expected)
        );

        updates.push({
            userId: entry.userId,
            before: oldRating,
            after: Math.max(0, newRating),
        });
    }

    // Apply updates in transaction
    await client.$transaction(
        updates.flatMap((u) => [
            client.user.update({
                where: { id: u.userId },
                data: { rating: u.after },
            }),
            client.ratingHistory.create({
                data: {
                    userId: u.userId,
                    contestId,
                    before: u.before,
                    after: u.after,
                },
            }),
        ])
    );

    console.log("Rating updated successfully.");
}
