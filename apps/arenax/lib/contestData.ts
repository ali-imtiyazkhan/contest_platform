export type ContestStatus = "live" | "upcoming" | "completed";
export type ContestCategory =
  | "Math & Logic"
  | "Writing"
  | "General Knowledge"
  | "Tech & Coding"
  | "All";

export interface Challenge {
  id: string;
  title: string;
  type: string;
  points: number;
  duration: string;
  durationSeconds: number;
  question: string;
  hint?: string;
}

export interface ActivityEvent {
  id: string;
  user: string;
  avatar: string;
  avatarColor: string;
  action: string;
  time: string;
  points?: number;
}

export interface Contest {
  id: string;
  title: string;
  category: ContestCategory;
  status: ContestStatus;
  participants: number;
  maxParticipants: number;
  prize: string;
  startTime: string; // ISO date string
  endTime: string;
  challenges: Challenge[];
  activity: ActivityEvent[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Elite";
  host: string;
  description: string;
  tags: string[];
}

export const CONTESTS: Contest[] = [
  {
    id: "c1",
    title: "Logic Masters Invitational",
    category: "Math & Logic",
    status: "live",
    participants: 2841,
    maxParticipants: 5000,
    prize: "$2,500",
    startTime: new Date(Date.now() - 1000 * 60 * 37).toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 83).toISOString(),
    difficulty: "Advanced",
    host: "ArenaX Official",
    description:
      "The premier mathematical reasoning contest. Five progressively harder challenges test speed, precision, and creative problem-solving.",
    tags: ["Math", "Logic", "Timed"],
    challenges: [
      {
        id: "ch1",
        title: "Number Theory Basics",
        type: "Short Answer",
        points: 200,
        duration: "3 min",
        durationSeconds: 180,
        question:
          "Find the smallest positive integer that is divisible by 1, 2, 3, 4, 5, 6, 7, 8, 9, and 10.",
        hint: "Think about the Least Common Multiple (LCM) of all these numbers.",
      },
      {
        id: "ch2",
        title: "Probability Puzzles",
        type: "Multi-part",
        points: 350,
        duration: "5 min",
        durationSeconds: 300,
        question:
          "A bag contains 4 red balls, 3 blue balls, and 5 green balls.\n\n(a) What is the probability of drawing a red ball?\n(b) If one red ball is removed, what is the probability of drawing a blue ball next?\n(c) What is the probability of drawing two green balls in a row (without replacement)?",
        hint: "For part (c), calculate the probability of the first green ball, then the second given the first was already drawn.",
      },
      {
        id: "ch3",
        title: "Sequence & Series",
        type: "Calculation",
        points: 400,
        duration: "6 min",
        durationSeconds: 360,
        question:
          "The Fibonacci sequence starts: 1, 1, 2, 3, 5, 8, 13, 21…\n\nFind the sum of all Fibonacci numbers that are less than 1000 and also even. Show your working.",
        hint: "Every third Fibonacci number is even. List them first, then sum.",
      },
      {
        id: "ch4",
        title: "Geometric Proofs",
        type: "Written",
        points: 500,
        duration: "8 min",
        durationSeconds: 480,
        question:
          "A circle has a chord AB of length 16 cm. The perpendicular distance from the center O to the chord is 6 cm.\n\nProve that the radius of the circle is 10 cm, and explain why any perpendicular from a circle's center to a chord always bisects that chord.",
        hint: "Use the Pythagorean theorem with the right triangle formed by the radius, the perpendicular, and half the chord.",
      },
      {
        id: "ch5",
        title: "The Grand Finale",
        type: "Open Problem",
        points: 750,
        duration: "10 min",
        durationSeconds: 600,
        question:
          "A farmer has a 40m × 30m rectangular field. He wants to fence off a circular garden inside the field such that the circle touches all four sides of the rectangle — but he quickly realizes that's impossible.\n\nInstead, he decides to place the largest possible circle that fits inside the rectangle.\n\n(a) What is the radius of this circle?\n(b) What percentage of the rectangular field does the circle cover?\n(c) If fencing costs $12 per metre, how much will it cost to fence the garden?",
        hint: "The diameter of the largest circle that fits in a rectangle equals the shorter side of the rectangle.",
      },
    ],
    activity: [
      {
        id: "a1",
        user: "Priya K.",
        avatar: "P",
        avatarColor: "#4f86f7",
        action: "submitted Challenge 3",
        time: "12s ago",
        points: 400,
      },
      {
        id: "a2",
        user: "Marcos T.",
        avatar: "M",
        avatarColor: "#e8554e",
        action: "joined the contest",
        time: "34s ago",
      },
      {
        id: "a3",
        user: "Yuki S.",
        avatar: "Y",
        avatarColor: "#c8f135",
        action: "scored 750 pts on Final",
        time: "1m ago",
        points: 750,
      },
      {
        id: "a4",
        user: "Dev R.",
        avatar: "D",
        avatarColor: "#f5a623",
        action: "completed all challenges",
        time: "2m ago",
      },
      {
        id: "a5",
        user: "Lena M.",
        avatar: "L",
        avatarColor: "#a855f7",
        action: "submitted Challenge 4",
        time: "3m ago",
        points: 500,
      },
      {
        id: "a6",
        user: "Carlos B.",
        avatar: "C",
        avatarColor: "#14b8a6",
        action: "joined the contest",
        time: "4m ago",
      },
    ],
  },
  {
    id: "c2",
    title: "Wordsmith Championship",
    category: "Writing",
    status: "live",
    participants: 1204,
    maxParticipants: 2000,
    prize: "$1,000",
    startTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 108).toISOString(),
    difficulty: "Intermediate",
    host: "ArenaX Official",
    description:
      "Three creative writing challenges judged by AI and community vote. Voice, structure, and originality all count.",
    tags: ["Writing", "Creative", "Judged"],
    challenges: [
      {
        id: "ch1",
        title: "Flash Fiction: 150 Words",
        type: "Creative",
        points: 300,
        duration: "5 min",
        durationSeconds: 300,
        question:
          "Write a complete story in exactly 150 words or fewer.\n\nPrompt: A stranger knocks on your door at 3am holding a suitcase that has your name on it — but you've never seen this person before.\n\nYour story must have a beginning, middle, and end. Judged on originality, tension, and prose quality.",
        hint: "Focus on one sharp moment rather than trying to explain everything. Ambiguity can be powerful.",
      },
      {
        id: "ch2",
        title: "Persuasive Essay",
        type: "Written",
        points: 500,
        duration: "10 min",
        durationSeconds: 600,
        question:
          'Write a short persuasive essay (200–300 words) arguing FOR or AGAINST the following statement:\n\n"Artificial intelligence will ultimately create more jobs than it destroys."\n\nYou must clearly state your position, provide at least two supporting arguments with reasoning, and end with a strong conclusion.',
        hint: "Pick one side firmly — wishy-washy essays score lower. Use concrete examples to support each argument.",
      },
      {
        id: "ch3",
        title: "Live Story Prompt",
        type: "Open",
        points: 700,
        duration: "15 min",
        durationSeconds: 900,
        question:
          'You are given the following opening line. Continue the story for at least 250 words:\n\n"The last library on Earth was about to close forever, and Maya had exactly one hour to decide which single book deserved to survive."\n\nBe bold. Be specific. Make us care about Maya and her choice.',
        hint: "The best stories show, don't tell. What does Maya see, smell, feel? What impossible trade-offs does she face?",
      },
    ],
    activity: [
      {
        id: "a1",
        user: "Sofia A.",
        avatar: "S",
        avatarColor: "#f43f5e",
        action: "submitted Flash Fiction",
        time: "22s ago",
        points: 300,
      },
      {
        id: "a2",
        user: "James L.",
        avatar: "J",
        avatarColor: "#4f86f7",
        action: "joined the contest",
        time: "55s ago",
      },
      {
        id: "a3",
        user: "Amara N.",
        avatar: "A",
        avatarColor: "#c8f135",
        action: "scored perfect on Essay",
        time: "2m ago",
        points: 500,
      },
    ],
  },
  {
    id: "c3",
    title: "Global IQ Open",
    category: "General Knowledge",
    status: "upcoming",
    participants: 892,
    maxParticipants: 10000,
    prize: "$5,000",
    startTime: new Date(
      Date.now() + 1000 * 60 * 60 * 4 + 1000 * 60 * 23,
    ).toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    difficulty: "Intermediate",
    host: "ArenaX Official",
    description:
      "The biggest open contest of the season. History, science, pop culture, and more across 8 rapid-fire challenges.",
    tags: ["Knowledge", "Open", "Rapid-fire"],
    challenges: [
      {
        id: "ch1",
        title: "World History Sprint",
        type: "MCQ",
        points: 200,
        duration: "2 min",
        durationSeconds: 120,
        question:
          "Answer all three questions:\n\n1. In what year did the Berlin Wall fall?\n2. Which empire was ruled by Genghis Khan?\n3. Name the treaty that ended World War I.\n4. Who was the first woman to win a Nobel Prize?\n5. In which city was the Magna Carta signed?",
      },
      {
        id: "ch2",
        title: "Science & Nature",
        type: "Short Answer",
        points: 250,
        duration: "3 min",
        durationSeconds: 180,
        question:
          "Answer the following science questions:\n\n1. What is the chemical symbol for gold?\n2. How many chambers does the human heart have?\n3. What is the powerhouse of the cell?\n4. At what temperature (°C) does water boil at sea level?\n5. What force keeps planets in orbit around the sun?",
        hint: "Think back to high school science — these are foundational facts.",
      },
      {
        id: "ch3",
        title: "Pop Culture Blitz",
        type: "MCQ",
        points: 150,
        duration: "2 min",
        durationSeconds: 120,
        question:
          "Quick-fire pop culture questions — name them all:\n\n1. Who played Iron Man in the Marvel Cinematic Universe?\n2. What is the highest-grossing film of all time (not adjusted for inflation)?\n3. Which band performed 'Bohemian Rhapsody'?\n4. Name the streaming platform that produced 'Stranger Things'.\n5. What fictional country is Black Panther's home?",
      },
      {
        id: "ch4",
        title: "Geography Challenge",
        type: "Short Answer",
        points: 250,
        duration: "3 min",
        durationSeconds: 180,
        question:
          "Name the correct answers:\n\n1. What is the capital of Australia?\n2. Which river is the longest in the world?\n3. Name the country with the most time zones.\n4. What ocean lies between Africa and Australia?\n5. Which mountain range separates Europe from Asia?",
        hint: "The capital of Australia often surprises people — it's not Sydney!",
      },
      {
        id: "ch5",
        title: "Tech Trivia",
        type: "MCQ",
        points: 200,
        duration: "2 min",
        durationSeconds: 120,
        question:
          "Technology knowledge check:\n\n1. What does 'HTTP' stand for?\n2. Who co-founded Apple with Steve Jobs?\n3. In what year was the first iPhone released?\n4. What programming language is known as the 'language of the web'?\n5. What does 'RAM' stand for?",
      },
      {
        id: "ch6",
        title: "Literature & Arts",
        type: "Short Answer",
        points: 300,
        duration: "4 min",
        durationSeconds: 240,
        question:
          "Literature and arts questions:\n\n1. Who wrote '1984'?\n2. Which artist painted the Sistine Chapel ceiling?\n3. Name Shakespeare's play featuring the character Ophelia.\n4. What nationality was Franz Kafka?\n5. Which novel begins with 'It was the best of times, it was the worst of times'?",
      },
      {
        id: "ch7",
        title: "Current Affairs",
        type: "Written",
        points: 350,
        duration: "5 min",
        durationSeconds: 300,
        question:
          "In 100–150 words, describe ONE major global development from the past two years that you believe will have the most lasting impact on society over the next decade.\n\nExplain what the development is, why it matters, and what long-term effects you predict.",
      },
      {
        id: "ch8",
        title: "The Grand Quiz",
        type: "Open",
        points: 600,
        duration: "8 min",
        durationSeconds: 480,
        question:
          "Final challenge — this one is worth 600 points.\n\nIf you could redesign one system in the world (education, healthcare, government, economy, etc.), which would you choose and why?\n\nWrite 200–250 words explaining:\n• Which system you'd redesign and its biggest current flaw\n• Your proposed redesign and how it works\n• What measurable improvement it would create\n\nJudged on clarity of argument, originality, and feasibility.",
      },
    ],
    activity: [
      {
        id: "a1",
        user: "Tomas V.",
        avatar: "T",
        avatarColor: "#4f86f7",
        action: "registered",
        time: "5m ago",
      },
      {
        id: "a2",
        user: "Nina P.",
        avatar: "N",
        avatarColor: "#e8554e",
        action: "registered",
        time: "8m ago",
      },
      {
        id: "a3",
        user: "Ravi K.",
        avatar: "R",
        avatarColor: "#c8f135",
        action: "registered",
        time: "11m ago",
      },
    ],
  },
  {
    id: "c4",
    title: "CodeStorm Elite",
    category: "Tech & Coding",
    status: "upcoming",
    participants: 430,
    maxParticipants: 1000,
    prize: "$3,000",
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 29).toISOString(),
    difficulty: "Elite",
    host: "ArenaX Dev League",
    description:
      "Four algorithmic challenges with live judge feedback. Optimize for speed and correctness. Top solutions get published.",
    tags: ["Algorithms", "Coding", "Elite"],
    challenges: [
      {
        id: "ch1",
        title: "Array Manipulation",
        type: "Code",
        points: 300,
        duration: "8 min",
        durationSeconds: 480,
        question:
          "Given an unsorted array of integers, write a function that:\n\n1. Removes all duplicate values\n2. Sorts the remaining values in ascending order\n3. Returns the sum of all values at even indices (0, 2, 4…) in the sorted result\n\nExample:\nInput: [4, 2, 7, 2, 9, 4, 1, 7, 3]\nAfter dedup + sort: [1, 2, 3, 4, 7, 9]\nEven indices: [1, 3, 7] → Sum = 11\n\nWrite your solution in any language. Explain your time complexity.",
        hint: "Use a Set to remove duplicates efficiently before sorting.",
      },
      {
        id: "ch2",
        title: "Graph Traversal",
        type: "Code",
        points: 500,
        duration: "12 min",
        durationSeconds: 720,
        question:
          "You are given a grid of characters where:\n• '.' represents open path\n• '#' represents a wall\n• 'S' is the start position\n• 'E' is the exit\n\nGrid:\nS . . # .\n# # . # .\n. . . . .\n. # # # E\n\nWrite an algorithm (BFS or DFS) to find the shortest path from S to E. Return the number of steps in the shortest path, or -1 if no path exists.\n\nExplain your approach and trace through your algorithm.",
        hint: "BFS guarantees the shortest path in an unweighted grid. Use a queue and mark visited cells.",
      },
      {
        id: "ch3",
        title: "Dynamic Programming",
        type: "Code",
        points: 700,
        duration: "15 min",
        durationSeconds: 900,
        question:
          "The 0/1 Knapsack Problem:\n\nYou have a knapsack with capacity W = 10.\nYou have the following items (each can only be taken once):\n\nItem | Weight | Value\n  A  |   2    |   6\n  B  |   3    |  10\n  C  |   4    |  12\n  D  |   5    |  13\n  E  |   6    |  15\n\nWhat is the maximum value you can fit in the knapsack? Which items do you include?\n\nWrite a dynamic programming solution and show the DP table.",
        hint: "Build a 2D table where dp[i][w] = max value using first i items with capacity w.",
      },
      {
        id: "ch4",
        title: "System Design Brief",
        type: "Written",
        points: 1000,
        duration: "20 min",
        durationSeconds: 1200,
        question:
          "Design a real-time contest platform (like ArenaX) that can support 100,000 simultaneous users.\n\nIn 300–400 words, describe:\n\n1. Architecture — what services/components would you use? (frontend, backend, database, caching, etc.)\n2. Real-time updates — how do you push live activity feeds and countdowns to all users?\n3. Submission handling — how do you prevent cheating and handle answer submissions at scale?\n4. One major failure point — identify it and explain how you'd handle it.\n\nYou don't need to write code — focus on the high-level design decisions and your reasoning.",
        hint: "Think about WebSockets for real-time, Redis for caching, and horizontal scaling for load.",
      },
    ],
    activity: [
      {
        id: "a1",
        user: "Kai Z.",
        avatar: "K",
        avatarColor: "#14b8a6",
        action: "registered",
        time: "1h ago",
      },
      {
        id: "a2",
        user: "Preethi M.",
        avatar: "P",
        avatarColor: "#a855f7",
        action: "registered",
        time: "2h ago",
      },
    ],
  },
  {
    id: "c5",
    title: "Speed Math Blitz",
    category: "Math & Logic",
    status: "completed",
    participants: 3210,
    maxParticipants: 5000,
    prize: "$1,500",
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    difficulty: "Beginner",
    host: "ArenaX Official",
    description:
      "A fast-paced arithmetic and mental math contest. Perfect for beginners looking to get their first win.",
    tags: ["Math", "Beginner", "Speed"],
    challenges: [
      {
        id: "ch1",
        title: "Mental Arithmetic",
        type: "Short Answer",
        points: 100,
        duration: "2 min",
        durationSeconds: 120,
        question:
          "Solve these as fast as you can — no calculator!\n\n1. 47 × 8 = ?\n2. 256 ÷ 16 = ?\n3. 15% of 240 = ?\n4. √144 = ?\n5. 2⁸ = ?",
      },
      {
        id: "ch2",
        title: "Fraction Frenzy",
        type: "Calculation",
        points: 150,
        duration: "3 min",
        durationSeconds: 180,
        question:
          "Simplify and solve:\n\n1. 3/4 + 5/6 = ?\n2. 7/8 − 1/3 = ?\n3. 2/5 × 15/4 = ?\n4. 9/10 ÷ 3/5 = ?\n5. Which is larger: 7/12 or 5/8? Show your reasoning.",
        hint: "Find the Lowest Common Denominator (LCD) for addition and subtraction problems.",
      },
      {
        id: "ch3",
        title: "Speed Algebra",
        type: "Short Answer",
        points: 200,
        duration: "4 min",
        durationSeconds: 240,
        question:
          "Solve for x in each equation:\n\n1. 3x + 7 = 22\n2. 5x − 3 = 2x + 9\n3. x/4 + 2 = 7\n4. 2(x + 5) = 3(x − 1)\n5. x² − 9 = 0 (find both values of x)",
        hint: "For equation 5, think about the difference of squares: a² − b² = (a+b)(a−b)",
      },
    ],
    activity: [
      {
        id: "a1",
        user: "Winner: Arjun S.",
        avatar: "A",
        avatarColor: "#c8f135",
        action: "won 1st place — $1,500",
        time: "4h ago",
        points: 450,
      },
      {
        id: "a2",
        user: "2nd: Maria C.",
        avatar: "M",
        avatarColor: "#4f86f7",
        action: "finished 2nd",
        time: "4h ago",
      },
    ],
  },
];
