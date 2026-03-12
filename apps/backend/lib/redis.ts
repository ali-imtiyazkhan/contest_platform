import Redis from "ioredis";

// redis connection
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: true })
  : new Redis({
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


// Add Score to LeaderBoard
export async function addScoreToLeaderboard(
  contestId: string,
  userId: string,
  score: number,
) {
  const key = `leaderboard:${contestId}`;
  await redis.zincrby(key, score, userId);
}

// Get LeaderBoard from the DB
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


// Rate Limtiting on Sunmission
export async function checkSubmissionRateLimit(userId: string) {
  const key = `submit:${userId}`;
  const MAX = 5;
  const WINDOW = 60;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > MAX) {
    return false;
  }

  return true;
}
