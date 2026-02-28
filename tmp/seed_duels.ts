import { client } from "../packages/db/index";

async function main() {
  console.log("Seeding Duel Challenges...");

  const challenges = [
    {
      title: "The Broken Navbar",
      question: "<p>The navigation bar is overlapping with the hero section on mobile devices. Fix the CSS to ensure proper spacing.</p><pre><code>.navbar {\n  position: fixed;\n  top: 0;\n  width: 100%;\n}</code></pre>",
      hint: "Check z-index or margin-top of the hero section.",
      maxPoints: 100,
      duration: 15,
      category: "UIFix",
      type: "Beginner"
    },
    {
      title: "Memory Leak Hunt",
      question: "<p>Identify and fix the memory leak in this React useEffect hook.</p><pre><code>useEffect(() => {\n  const interval = setInterval(() => {\n    console.log('Running...');\n  }, 1000);\n}, []);</code></pre>",
      hint: "Remember to clear intervals on unmount.",
      maxPoints: 200,
      duration: 10,
      category: "Debugging",
      type: "Intermediate"
    },
    {
      title: "API Endpoint Optimization",
      question: "<p>The /api/v1/posts endpoint is taking 2 seconds to load 50 posts. Optimize the following Prisma query.</p><pre><code>const posts = await client.post.findMany();\nfor (const post of posts) {\n  post.author = await client.user.findUnique({ where: { id: post.authorId } });\n}</code></pre>",
      hint: "Use 'include' to fetch relations in a single query (avoid N+1).",
      maxPoints: 300,
      duration: 20,
      category: "APIDesign",
      type: "Advanced"
    }
  ];

  for (const c of challenges) {
    const challenge = await client.challenge.create({
      data: {
        title: c.title,
        question: c.question,
        hint: c.hint,
        maxPoints: c.maxPoints,
        duration: c.duration,
        category: c.category as any,
        type: c.type as any,
        contextStatus: "Completed"
      }
    });
    console.log(`Created challenge: ${challenge.title}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await client.$disconnect();
  });
