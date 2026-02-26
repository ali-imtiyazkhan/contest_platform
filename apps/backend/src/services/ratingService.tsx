import { client } from "db/client";

export async function processContestRating(contestId: string) {
  const contest = await client.contest.findUnique({
    where: { id: contestId },
  });

  if (!contest) throw new Error("Contest not found");

  const leaderboard = await client.leaderboard.findMany({
    where: { contestId },
    orderBy: { score: "desc" },
    include: { user: true },
  });

  // FILTER INVALID PARTICIPANTS FIRST
  const validLeaderboard = leaderboard.filter(
    (entry) => entry.user && entry.userId
  );

  const totalParticipants = validLeaderboard.length;

  if (totalParticipants < 2) {
    console.log("Not enough participants for rating update.");
    return;
  }

  // SAFE AVG RATING
  const avgRating =
    validLeaderboard.reduce(
      (sum, entry) => sum + (entry.user!.rating ?? 0),
      0
    ) / totalParticipants;

  const updates: {
    userId: string;
    before: number;
    after: number;
  }[] = [];

  for (let i = 0; i < validLeaderboard.length; i++) {
    const entry = validLeaderboard[i];

    const rank = i + 1;
    const oldRating = entry.user!.rating ?? 0;

    const actual =
      (totalParticipants - rank) / (totalParticipants - 1);

    const expected =
      1 / (1 + Math.pow(10, (avgRating - oldRating) / 400));

    const K = oldRating < 1400 ? 40 : 32;

    const newRating = Math.round(
      oldRating + K * (actual - expected)
    );

    updates.push({
      userId: entry.userId!, // now safe because we filtered
      before: oldRating,
      after: Math.max(0, newRating),
    });
  }

  // TRANSACTION SAFE UPDATE
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