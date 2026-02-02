import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log(" Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function addScoreToLeaderboard(
  contestId: string,
  userId: string,
  score: number,
) {
  const key = `leaderboard:${contestId}`;
  await redis.zincrby(key, score, userId);
}

export async function getLeaderboard(contestId: string, limit = 10) {
  const key = `leaderboard:${contestId}`;

  const raw = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");

  const leaderboard: { userId: string; score: number; rank: number }[] = [];

  for (let i = 0; i < raw.length; i += 2) {
    leaderboard.push({
      rank: i / 2 + 1,
      userId: raw[i],
      score: Number(raw[i + 1]),
    });
  }

  return leaderboard;
}

export async function checkSubmissionRateLimit(userId: string) {
  const key = `submit:${userId}`;
  const MAX = 5;
  const WINDOW = 60; // seconds

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > MAX) {
    return false;
  }

  return true;
}
