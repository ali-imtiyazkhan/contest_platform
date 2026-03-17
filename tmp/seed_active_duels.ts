import { client } from "../packages/db/index";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding Duel Instances (Matches between users)...");

  // Ensure we have at least 3 users to play with
  const password = await bcrypt.hash("User@123", 10);
  
  const usersData = [
    { email: "player1@platform.com", displayName: "EliteCoder", avatarColor: "#34d399" },
    { email: "player2@platform.com", displayName: "BugHunter", avatarColor: "#f87171" },
    { email: "player3@platform.com", displayName: "UI_Wizard", avatarColor: "#60a5fa" }
  ];

  const users = [];
  for (const u of usersData) {
    const user = await client.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        displayName: u.displayName,
        password: password,
        avatarColor: u.avatarColor,
        role: "User"
      }
    });
    users.push(user);
    console.log(`User ready: ${user.displayName}`);
  }

  // Get existing challenge
  const challenges = await client.challenge.findMany({
    where: {
      title: { in: ["The Broken Navbar", "Memory Leak Hunt", "API Endpoint Optimization"] }
    }
  });

  if (challenges.length === 0) {
    console.error("No challenges found. Please run seed_duels.ts first.");
    return;
  }

  // Create some active and completed duels
  const duelsData = [
    {
      player1Id: users[0].id,
      player2Id: users[1].id,
      challengeId: challenges[0].id,
      status: "Active",
      startTime: new Date()
    },
    {
      player1Id: users[1].id,
      player2Id: users[2].id,
      challengeId: challenges[1].id,
      status: "Pending"
    },
    {
      player1Id: users[0].id,
      player2Id: users[2].id,
      challengeId: challenges[2].id,
      status: "Completed",
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() - 1800000),   // 30 mins ago
      winnerId: users[0].id
    }
  ];

  for (const d of duelsData) {
    const duel = await client.duel.create({
      data: {
        player1Id: d.player1Id,
        player2Id: d.player2Id,
        challengeId: d.challengeId,
        status: d.status as any,
        startTime: d.startTime,
        endTime: (d as any).endTime,
        winnerId: (d as any).winnerId
      }
    });
    console.log(`Duel created: ${duel.id} (${d.status})`);

    // If completed, add a submission
    if (d.status === "Completed") {
      await client.duelSubmission.create({
        data: {
          duelId: duel.id,
          userId: users[0].id,
          submission: "Resolved the N+1 problem efficiently.",
          status: "Accepted",
          points: 300
        }
      });
    }
  }

  console.log("Duel seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await client.$disconnect();
  });
