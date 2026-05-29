const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose   = require('mongoose');
const DailyTopic = require('../Model/DailyTopic');
const Submission = require('../Model/Submissions');
const Platform   = require('../Model/Platform');
const LeetCodeData = require('../Model/LeetCodeData');
const User       = require('../Model/User');
const ErrorLog   = require('../Model/ErrorLog');
const { getTodayIST, getNDaysAgoIST } = require('../Utils/dateUtils');

// ── Round-robin key pool ────────────────────────────────────────────
const KEYS = (process.env.GEMINI_API_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

let keyIndex = 0;
function nextKey() {
    if (KEYS.length === 0) throw new Error('GEMINI_API_KEYS not configured');
    const key = KEYS[keyIndex];
    keyIndex = (keyIndex + 1) % KEYS.length;
    return key;
}

// ── Sub-topic mapping (~300+ entries) ───────────────────────────────
const SUB_TOPICS = {
    'graph theory': [
        "Dijkstra's Shortest Path Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall All-Pairs Shortest Path",
        "Prim's Minimum Spanning Tree", "Kruskal's Algorithm with Union-Find", "Topological Sorting (Kahn's BFS)",
        "Tarjan's Strongly Connected Components", "Bridges and Articulation Points", "Euler Path and Euler Circuit",
        "Maximum Bipartite Matching (Hungarian)", "Ford-Fulkerson Max Flow", "0-1 BFS on Weighted Graphs",
        "Cycle Detection in Directed Graphs (DFS Coloring)", "Multi-Source BFS",
        "Dinic's Maximum Flow Algorithm", "Minimum Cost Maximum Flow (MCMF)",
        "Hopcroft-Karp Bipartite Matching", "2-SAT Problem Solving", "Kosaraju's SCC Algorithm",
        "Johnson's Algorithm for Sparse Graphs", "SPFA (Shortest Path Faster Algorithm)",
        "Block-Cut Tree for Biconnected Components", "Virtual Tree (Auxiliary Tree) Construction",
        "Steiner Tree Problem in Graphs", "Chromatic Number and Graph Coloring",
    ],
    'graphs': [
        "Dijkstra's Shortest Path Algorithm", "Bellman-Ford Algorithm", "Prim's Minimum Spanning Tree",
        "Kruskal's Algorithm with Union-Find", "Topological Sorting", "Tarjan's SCC Algorithm",
        "Bridges and Articulation Points", "Euler Path and Circuit", "0-1 BFS", "Multi-Source BFS",
        "Cycle Detection using DFS Coloring", "Floyd-Warshall Algorithm",
        "Dinic's Max Flow Algorithm", "2-SAT via Implication Graph",
        "Minimum Vertex Cover via Konig's Theorem", "Strongly Connected Condensation",
    ],
    'dynamic programming': [
        "0/1 Knapsack Problem", "Longest Common Subsequence (LCS)", "Longest Increasing Subsequence (LIS)",
        "Matrix Chain Multiplication", "Edit Distance (Levenshtein)", "Coin Change Problem (Unbounded Knapsack)",
        "DP on Trees", "Bitmask DP", "Digit DP", "Interval DP (Range DP)",
        "Probability DP", "SOS DP (Sum over Subsets)", "Knuth's Optimization",
        "DP with Convex Hull Trick", "Broken Profile DP",
        "Divide and Conquer Optimization in DP", "Aliens Trick (WQS Binary Search)",
        "DP on DAGs (Topological Order DP)", "Steiner Tree DP", "DP with Matrix Exponentiation",
        "Tree Rerooting DP Technique", "Slope Trick for Convex DP",
        "DP with Segment Tree Optimization", "DP on Subsets of Subsets",
    ],
    'dp': [
        "0/1 Knapsack Problem", "Longest Common Subsequence", "Longest Increasing Subsequence",
        "Edit Distance", "Coin Change Problem", "DP on Trees", "Bitmask DP", "Digit DP",
        "Interval DP", "SOS DP", "Matrix Exponentiation DP",
        "Divide and Conquer DP Optimization", "Convex Hull Trick DP",
        "Slope Trick", "Aliens Trick (Lambda Optimization)",
    ],
    'trees': [
        "Lowest Common Ancestor (Binary Lifting)", "Heavy-Light Decomposition", "Centroid Decomposition",
        "Euler Tour Technique on Trees", "Tree DP (Rerooting Technique)", "Small to Large Merging (DSU on Tree)",
        "Tree Diameter and Center", "Auxiliary Tree (Link-Cut Trees)", "Virtual Tree Construction",
        "Tree Isomorphism via Hashing", "Tree Flattening for Range Queries",
        "AHU Algorithm for Tree Isomorphism", "Prufer Sequence for Labeled Trees",
    ],
    'number theory': [
        "Sieve of Eratosthenes and Linear Sieve", "Extended Euclidean Algorithm", "Modular Exponentiation (Fast Power)",
        "Chinese Remainder Theorem", "Euler's Totient Function", "Mobius Function and Inversion",
        "Miller-Rabin Primality Test", "Pollard's Rho Factorization", "Combinatorics with Modular Inverse",
        "Lucas' Theorem", "Fermat's Little Theorem Applications",
        "Tonelli-Shanks Algorithm (Modular Square Root)", "Discrete Logarithm (Baby-Step Giant-Step)",
        "Primitive Root and Discrete Logarithm", "Multiplicative Functions and Dirichlet Convolution",
        "Floor Sum (Lattice Point Counting)", "Linear Sieve for Multiplicative Functions",
    ],
    'string algorithms': [
        "KMP Pattern Matching Algorithm", "Z-Function for String Matching", "Rabin-Karp Rolling Hash",
        "Suffix Array Construction", "Longest Common Prefix (LCP) Array", "Aho-Corasick Multi-Pattern Search",
        "Manacher's Algorithm for Palindromes", "Suffix Automaton", "Trie-Based String Processing",
        "Palindromic Tree (Eertree)", "Lyndon Factorization (Duval's Algorithm)",
        "Suffix Tree Construction (Ukkonen's)", "Burrows-Wheeler Transform",
    ],
    'strings': [
        "KMP Algorithm", "Z-Function", "Rabin-Karp Hashing", "Suffix Array", "Manacher's Algorithm",
        "Aho-Corasick Automaton", "Trie Data Structure", "Suffix Automaton",
        "Palindromic Tree", "Lyndon Factorization", "Booth's Algorithm",
    ],
    'data structures': [
        "Segment Tree with Lazy Propagation", "Fenwick Tree (Binary Indexed Tree)",
        "Sparse Table for Range Minimum Queries", "Merge Sort Tree", "Persistent Segment Tree",
        "Sqrt Decomposition (Mo's Algorithm)", "Treap (Randomized BST)", "Splay Tree Basics",
        "Wavelet Tree", "Cartesian Tree", "Li Chao Tree for Line Queries", "Link-Cut Tree",
        "Euler Tour Tree", "Scapegoat Tree", "2D Fenwick Tree (BIT)",
        "Implicit Treap (Rope)", "K-D Tree for Multidimensional Queries",
    ],
    'segment trees': [
        "Segment Tree with Lazy Propagation", "Persistent Segment Tree",
        "Segment Tree Beats", "2D Segment Tree", "Merge Sort Tree on Segment Tree",
        "Iterative Segment Tree", "Segment Tree with Coordinate Compression",
        "Li Chao Segment Tree", "Dynamic Segment Tree (Sparse)",
    ],
    'greedy algorithms': [
        "Activity Selection and Interval Scheduling", "Huffman Coding Algorithm",
        "Fractional Knapsack (Greedy)", "Job Sequencing with Deadlines", "Minimum Number of Platforms",
        "Greedy Graph Coloring", "Optimal Merge Pattern", "Exchange Argument Proofs in Greedy",
        "Matroid Intersection Basics", "Scheduling with Deadlines and Penalties",
    ],
    'greedy': [
        "Activity Selection Problem", "Huffman Coding", "Fractional Knapsack",
        "Job Sequencing with Deadlines", "Minimum Platforms", "Exchange Argument Technique",
        "Scheduling to Minimize Lateness", "Matroid Theory Basics",
    ],
    'binary search': [
        "Binary Search on Answer (Parametric Search)", "Ternary Search on Unimodal Functions",
        "Binary Search on Sorted Matrix", "Fractional Binary Search",
        "Binary Search with Monotonic Predicates", "Parallel Binary Search",
        "WQS Binary Search (Aliens Trick)", "Minimax Binary Search",
    ],
    'bit manipulation': [
        "Bitwise Subset Enumeration", "XOR Basis (Linear Algebra over GF(2))",
        "Gosper's Hack (Iterating over Subsets of Fixed Size)", "Bitwise Tricks for Competitive Programming",
        "Finding the Only Non-Repeating Element", "Maximum XOR Subarray using Trie",
        "Gray Code Generation", "XOR Convolution (Walsh-Hadamard Transform)",
    ],
    'geometry': [
        "Convex Hull (Graham Scan / Andrew's Monotone Chain)", "Line Intersection and Segment Intersection",
        "Point in Polygon (Ray Casting)", "Closest Pair of Points (Divide and Conquer)",
        "Rotating Calipers for Diameter", "Sweep Line for Geometric Problems",
        "Half-Plane Intersection", "Minkowski Sum of Convex Polygons", "Pick's Theorem for Lattice Points",
    ],
    'sorting': [
        "Merge Sort and Counting Inversions", "Quick Select (Kth Element in O(n))",
        "Counting Sort and Radix Sort", "Custom Comparators for Greedy Sorting",
        "Coordinate Compression Technique", "Patience Sorting (LIS Connection)",
    ],
    'math': [
        "Modular Arithmetic and Modular Inverse", "Matrix Exponentiation for Linear Recurrences",
        "Inclusion-Exclusion Principle", "Catalan Numbers and Applications",
        "Burnside's Lemma (Group Theory in Counting)", "Gaussian Elimination",
        "Fast Fourier Transform (FFT) for Polynomial Multiplication",
        "Number Theoretic Transform (NTT)", "Sprague-Grundy Theorem for Game Theory",
        "Nim Game and Variants", "Josephus Problem", "Lagrange Interpolation",
        "Berlekamp-Massey Algorithm (Linear Recurrence Recovery)",
    ],
    'combinatorics': [
        "nCr with Modular Inverse (Pascal's Triangle)", "Stars and Bars Technique",
        "Inclusion-Exclusion Principle", "Burnside's Lemma", "Catalan Numbers",
        "Derangements", "Generating Functions Basics",
        "Polya Enumeration Theorem", "Stirling Numbers (First and Second Kind)",
        "Bell Numbers", "Mobius Inversion on Posets",
    ],
    'two pointers': [
        "Two Pointers for Pair Sum", "Sliding Window Maximum (Deque Technique)",
        "Two Pointers on Sorted Arrays", "Three-Sum Problem Variants",
        "Subarray with Given Sum", "Container with Most Water",
        "Longest Substring Without Repeating Characters", "Minimum Window Substring",
    ],
    'dfs': [
        "DFS Tree and Back Edges", "Cycle Detection using DFS",
        "Topological Sort via DFS", "Finding Connected Components",
        "Tarjan's Bridge-Finding Algorithm", "DFS on Implicit Graphs",
        "Iterative DFS with Explicit Stack", "DFS Order and Subtree Queries",
    ],
    'bfs': [
        "Multi-Source BFS", "0-1 BFS with Deque", "BFS on Grid with Obstacles",
        "Bidirectional BFS", "BFS for Shortest Path in Unweighted Graphs",
        "BFS Level Order Applications", "BFS on State-Space Graphs",
    ],
    'flows': [
        "Dinic's Max Flow Algorithm", "Minimum Cost Maximum Flow (MCMF / SPFA-based)",
        "Push-Relabel Algorithm", "Minimum Cut via Max Flow",
        "Project Selection Problem (Max Flow Formulation)",
        "Closure Problem on DAG", "Gomory-Hu Tree for All-Pairs Min Cut",
    ],
    'matching': [
        "Hopcroft-Karp Maximum Bipartite Matching", "Hungarian Algorithm (Weighted Matching)",
        "Kuhn's Algorithm for Bipartite Matching", "Konig's Theorem (Min Vertex Cover = Max Matching)",
        "Hall's Marriage Theorem Applications",
    ],
    'game theory': [
        "Sprague-Grundy Theorem and Grundy Numbers", "Nim Game and Multi-Pile Nim",
        "Staircase Nim", "Green Hackenbush", "Wythoff's Game",
        "Combinatorial Game Theory Basics", "Game on Graphs (Directed Graph Games)",
    ],
    'fft': [
        "Fast Fourier Transform (FFT) for Polynomial Multiplication",
        "Number Theoretic Transform (NTT) for Modular Convolution",
        "Bitwise Convolution (OR/AND/XOR Convolution)", "Walsh-Hadamard Transform",
        "Online Convolution using Divide and Conquer",
    ],
    'hashing': [
        "Polynomial Rolling Hash for Strings", "Double Hashing for Collision Reduction",
        "Tree Hashing for Isomorphism", "Zobrist Hashing for Board States",
    ],
    'stack': [
        "Monotonic Stack for Next Greater Element", "Largest Rectangle in Histogram",
        "Stock Span Problem", "Trapping Rain Water (Stack Approach)",
        "Expression Parsing with Stacks", "Min Stack / Max Stack Design",
    ],
    'divide and conquer': [
        "Merge Sort and Counting Inversions", "Closest Pair of Points (2D Divide and Conquer)",
        "Divide and Conquer Optimization for DP", "CDQ Divide and Conquer (Offline Queries)",
    ],
    'union find': [
        "Union-Find with Path Compression and Rank", "Union-Find for Dynamic Connectivity",
        "Rollback DSU (Persistent Union-Find)", "Weighted Union-Find (Potential DSU)",
        "DSU on Tree (Small to Large Merging)",
    ],
    'matrix': [
        "Matrix Exponentiation for Linear Recurrences", "Gaussian Elimination over Reals",
        "Gaussian Elimination over GF(2) for XOR Systems", "Kirchhoff's Theorem (Counting Spanning Trees)",
    ],
    'probability': [
        "Expected Value and Linearity of Expectation", "Probability DP (States with Probabilities)",
        "Random Algorithms (Randomized Quickselect)", "Markov Chain Steady State",
    ],
    'interactive': [
        "Interactive Binary Search Problems", "Interactive Graph Exploration",
        "Adaptive Strategies with Limited Queries",
    ],
    'constructive': [
        "Constructive Algorithms: Building Valid Permutations",
        "Euler Circuit Construction (Hierholzer's Algorithm)",
        "de Bruijn Sequence Construction", "Gray Code Construction",
    ],
    'implementation': [
        "Efficient I/O in Competitive Programming (Fast IO)", "Common STL Pitfalls in C++",
        "Policy-Based Data Structures (GNU PBDS)", "Pragma Optimizations in C++",
    ],
    'offline algorithms': [
        "Mo's Algorithm for Offline Range Queries", "Mo's Algorithm on Trees",
        "CDQ Divide and Conquer for Offline Updates", "Sqrt Decomposition with Block Decomposition",
    ],
};

function refineToSubTopic(broadTopic, recentSet) {
    const key = broadTopic.toLowerCase().trim();
    const subs = SUB_TOPICS[key];
    if (!subs) return broadTopic;
    const available = subs.filter(s => !recentSet.has(s.toLowerCase()));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    return subs[Math.floor(Math.random() * subs.length)];
}

// ── LLM call with round-robin + retry ───────────────────────────────
const MODEL_NAME = 'gemma-4-31b-it';

function buildSystemPrompt(language) {
    const langNames = { cpp: 'C++', java: 'Java', python: 'Python', javascript: 'JavaScript' };
    const langName = langNames[language] || 'C++';
    return `You are an expert competitive-programming coach writing fun, engaging tutorials.
You will receive a specific algorithm/technique name. Return ONLY a raw JSON object (no markdown fences) with this EXACT schema:
{
  "topic": "string — the exact topic name",
  "article": "string — engaging markdown tutorial (see requirements below)",
  "dry_run": "string — step-by-step walkthrough/dry-run with a concrete small example in markdown",
  "code_template": "string — clean, well-commented ${langName} implementation ready for contests",
  "visualization_data": "string — valid Mermaid.js flowchart/graph syntax illustrating the algorithm flow. Use simple labels, no special characters."
}

ARTICLE REQUIREMENTS (for the "article" field):
- Write in **markdown format** with proper headings (##, ###), paragraphs, bold text, lists, and blockquotes.
- Use a fun, conversational tone — like a brilliant friend explaining over coffee. Use analogies and metaphors.
- Structure with these sections:
  ## 🎯 What is [Topic]?
  (Clear, engaging definition. Use a real-life analogy first, then the formal CS definition. 2-3 paragraphs.)

  ## 💡 Why Should You Care?
  (Why this is a contest superpower. Reference problem types, contest scenarios. Make the reader excited.)

  ## 🔍 When to Use It
  (Pattern recognition: what clues in problem statements scream this technique? Common archetypes.)

  ## ⚠️ Traps & Edge Cases
  (Common mistakes beginners make. Debugging tips. Things that WA/TLE your solution.)

  ## 🌍 Beyond CP — Real-World Uses
  (2-3 cool real-world applications. Make it interesting.)

- Use **bold** for key terms, \`inline code\` for variable names.
- Use > blockquotes for pro tips.
- NEVER use LaTeX or dollar signs ($). Write complexity as O(N log N), NOT $O(N \\log N)$.
- Use simple variable names: a, b, c (NOT x_0, x_1). For nodes use A, B, C or 1, 2, 3.
- Keep it engaging, around 600-800 words. Quality over quantity.

DRY RUN REQUIREMENTS (for the "dry_run" field):
- Pick a SMALL concrete example (e.g., a graph with 4-5 nodes, an array of 5-6 elements).
- Use SIMPLE, FRIENDLY variable names: a, b, c, d (NOT x_0, x_1, x_2). For nodes use A, B, C, D or 1, 2, 3, 4.
- NEVER use LaTeX, dollar signs ($), or math notation. Write everything in plain English.
- Use plain text for operators: "NOT a" instead of "¬a", "a OR b" instead of "a ∨ b", "a AND b" instead of "a ∧ b".
- Use curly braces for sets: {A, B, C} not \\{A, B, C\\} or backslash-escaped braces.
- Show the algorithm running step-by-step with the actual values changing.
- Use markdown tables, numbered steps, and **bold** for values that change.
- Show the state of key data structures (arrays, stacks, queues) at each step.
- Include the final answer and time/space complexity at the end using plain text like O(N + M), NOT $O(N+M)$.
- Make it feel like watching the algorithm execute in slow motion — a reader should be able to follow with pen and paper.

CRITICAL JSON RULES:
- All string values MUST have properly escaped special characters.
- Use \\n for newlines, \\\\ for backslashes, \\" for quotes inside strings.
- NEVER put raw newlines inside JSON string values.
- Code in the code_template field MUST use \\n for line breaks, not actual newlines.

Return ONLY the JSON object. No extra text outside the JSON.`;
}

async function callGemma(topic, language) {
    const langNames = { cpp: 'C++', java: 'Java', python: 'Python', javascript: 'JavaScript' };
    const langName = langNames[language] || 'C++';
    const userPrompt = `Topic: "${topic}"

Write a fun, engaging tutorial and a detailed dry-run with a small concrete example.
The ${langName} template should be clean, contest-ready code with comments.
The Mermaid diagram should visually illustrate the algorithm's core logic.`;

    const maxAttempts = Math.min(KEYS.length, 5);
    let lastError = null;

    for (let i = 0; i < maxAttempts; i++) {
        const key = nextKey();
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({
                model: MODEL_NAME,
                systemInstruction: buildSystemPrompt(language),
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json',
                },
            });
            const result = await model.generateContent(userPrompt);
            const raw = result.response.text();
            return parseJSON(raw);
        } catch (err) {
            lastError = err;
            console.error(`[DailyTopic] Key #${(keyIndex - 1 + KEYS.length) % KEYS.length + 1} failed:`, err.message);
            ErrorLog.create({ source: 'DailyTopic', level: 'error', message: `Gemini key #${(keyIndex - 1 + KEYS.length) % KEYS.length + 1} failed: ${err.message}` }).catch(() => {});
        }
    }
    throw new Error(`All ${maxAttempts} Gemini keys failed. Last: ${lastError?.message}`);
}

function parseJSON(raw) {
    let cleaned = raw.trim();
    // Strip markdown fences
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    // Extract the JSON object if there's extra text around it
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) cleaned = objMatch[0];

    // Attempt 1: direct parse
    try { return JSON.parse(cleaned); } catch {}

    // Attempt 2: repair common LLM JSON issues
    try { return JSON.parse(repairJSON(cleaned)); } catch {}

    // Attempt 3: aggressive — extract each field manually via regex
    try {
        const fields = ['topic', 'article', 'dry_run', 'code_template', 'visualization_data'];
        const obj = {};
        for (const field of fields) {
            // Match "field": "..." allowing for escaped chars
            const rx = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)(?:(?<!\\\\)"\\s*(?:,|\\}))`);
            const m = cleaned.match(rx);
            if (m) obj[field] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        if (Object.keys(obj).length >= 3) return obj; // at least topic + article + one more
    } catch {}

    throw new Error('Failed to parse LLM response as JSON');
}

/**
 * Repair common JSON issues from LLMs:
 * - Unescaped newlines/tabs inside string values
 * - Trailing commas before } or ]
 * - Control characters
 */
function repairJSON(str) {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];

        if (escaped) {
            // Valid escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
            const valid = '"\\/bfnrtu';
            if (valid.includes(ch)) {
                result += ch;
            } else {
                // Invalid escape — double the backslash to make it literal
                result += '\\' + ch;
            }
            escaped = false;
            continue;
        }

        if (ch === '\\' && inString) {
            result += ch;
            escaped = true;
            continue;
        }

        if (ch === '"' && !escaped) {
            inString = !inString;
            result += ch;
            continue;
        }

        if (inString) {
            // Fix unescaped control characters inside strings
            if (ch === '\n') { result += '\\n'; continue; }
            if (ch === '\r') { result += '\\r'; continue; }
            if (ch === '\t') { result += '\\t'; continue; }
            const code = ch.charCodeAt(0);
            if (code < 32) { result += '\\u' + code.toString(16).padStart(4, '0'); continue; }
        }

        result += ch;
    }

    // Fix trailing commas: ,} or ,]
    result = result.replace(/,\s*([\]}])/g, '$1');

    return result;
}

// ── Flat set of all unique sub-topics (for exhaustion check) ────────
const ALL_SUB_TOPICS = new Set();
for (const subs of Object.values(SUB_TOPICS)) {
    for (const s of subs) ALL_SUB_TOPICS.add(s.toLowerCase());
}
console.log(`[DailyTopic] ${ALL_SUB_TOPICS.size} unique sub-topics loaded`);

// ── Weakness detection ──────────────────────────────────────────────
async function findWeakestTopic(userId) {
    const today = getTodayIST();

    // Get ALL past topics for this user (not just 30 days) to prevent repeats
    let pastTopics = await DailyTopic.find({ userId }).distinct('topic');
    let usedSet = new Set(pastTopics.map(t => t.toLowerCase()));

    // If all sub-topics exhausted → wipe history and restart the cycle
    const unusedCount = [...ALL_SUB_TOPICS].filter(t => !usedSet.has(t)).length;
    if (unusedCount === 0 && usedSet.size > 0) {
        console.log(`[DailyTopic] All ${ALL_SUB_TOPICS.size} topics exhausted for user=${userId}, resetting history`);
        await DailyTopic.deleteMany({ userId, date: { $ne: today } });
        usedSet = new Set(); // fresh start
    }

    const uid = new mongoose.Types.ObjectId(userId);
    const pipeline = [
        { $match: { userId: uid } },
        { $unwind: '$tags' },
        { $group: {
            _id: '$tags',
            total: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'AC'] }, 1, 0] } },
        }},
        { $match: { total: { $gte: 3 } } },
        { $addFields: { solveRate: { $divide: ['$accepted', '$total'] } } },
        { $sort: { solveRate: 1 } },
        { $limit: 20 },
    ];

    const weakTags = await Submission.aggregate(pipeline);
    for (const tag of weakTags) {
        const refined = refineToSubTopic(tag._id, usedSet);
        if (!usedSet.has(refined.toLowerCase())) return refined;
    }

    const fallbackTopic = await fallbackWeakness(userId, usedSet);
    if (fallbackTopic) {
        const refined = refineToSubTopic(fallbackTopic, usedSet);
        if (!usedSet.has(refined.toLowerCase())) return refined;
    }

    // Last resort: pick any unused sub-topic from the entire pool
    const allUnused = [...ALL_SUB_TOPICS].filter(t => !usedSet.has(t));
    if (allUnused.length > 0) {
        // Find the original casing from SUB_TOPICS
        const pick = allUnused[Math.floor(Math.random() * allUnused.length)];
        for (const subs of Object.values(SUB_TOPICS)) {
            const match = subs.find(s => s.toLowerCase() === pick);
            if (match) return match;
        }
        return pick;
    }

    // Truly exhausted (shouldn't happen after reset above, but safety net)
    const defaults = [
        "Dijkstra's Shortest Path Algorithm", "Longest Increasing Subsequence (LIS)",
        "Segment Tree with Lazy Propagation", "KMP Pattern Matching Algorithm",
        "Binary Search on Answer", "Bitmask DP", "Kruskal's Algorithm with Union-Find",
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
}

async function fallbackWeakness(userId, recentSet) {
    const cf = await Platform.findOne({ userId, platform: 'codeforces' }, 'solvedByTopics').lean();
    if (cf?.solvedByTopics) {
        const entries = Object.entries(cf.solvedByTopics instanceof Map ? Object.fromEntries(cf.solvedByTopics) : cf.solvedByTopics);
        const sorted = entries.filter(([, c]) => typeof c === 'number').sort(([, a], [, b]) => a - b);
        const found = sorted.find(([tag]) => !recentSet.has(tag.toLowerCase()));
        if (found) return found[0];
    }
    const lc = await LeetCodeData.findOne({ userId }, 'skillStats').lean();
    if (lc?.skillStats) {
        const all = [
            ...(lc.skillStats.fundamental || []),
            ...(lc.skillStats.intermediate || []),
            ...(lc.skillStats.advanced || []),
        ];
        const sorted = all.filter(t => typeof t.problemsSolved === 'number').sort((a, b) => a.problemsSolved - b.problemsSolved);
        const found = sorted.find(t => !recentSet.has((t.tagName || t.tagSlug).toLowerCase()));
        if (found) return found.tagName || found.tagSlug;
    }
    const cc = await Platform.findOne({ userId, platform: 'codechef' }, 'solvedByTopics').lean();
    if (cc?.solvedByTopics) {
        const entries = Object.entries(cc.solvedByTopics instanceof Map ? Object.fromEntries(cc.solvedByTopics) : cc.solvedByTopics);
        const sorted = entries.filter(([, c]) => typeof c === 'number').sort(([, a], [, b]) => a - b);
        const found = sorted.find(([tag]) => !recentSet.has(tag.toLowerCase()));
        if (found) return found[0];
    }
    return null;
}

// ── In-flight generation lock (prevents duplicate LLM calls) ────────
const inFlight = new Map(); // key: `${userId}:${date}` → Promise

// ── Main orchestrator ───────────────────────────────────────────────
function generateOrFetchDailyTopic(userId, language = 'cpp') {
    const today = getTodayIST();
    const lockKey = `${userId}:${today}`;

    // If another call is already generating for this user+day, piggyback on it
    if (inFlight.has(lockKey)) {
        return inFlight.get(lockKey);
    }

    const promise = _doGenerate(userId, today, language).finally(() => {
        inFlight.delete(lockKey);
    });

    inFlight.set(lockKey, promise);
    return promise;
}

async function _doGenerate(userId, today, language) {
    const existing = await DailyTopic.findOne({ userId, date: today }).lean();
    if (existing) return existing;

    const weakTopic = await findWeakestTopic(userId);
    console.log(`[DailyTopic] Generating for user=${userId} topic="${weakTopic}"`);

    const content = await callGemma(weakTopic, language);

    const doc = await DailyTopic.findOneAndUpdate(
        { userId, date: today },
        {
            $setOnInsert: {
                userId,
                date: today,
                topic: content.topic || weakTopic,
                language,
                content: {
                    article:            content.article || '',
                    dry_run:            content.dry_run || '',
                    code_template:      content.code_template || '',
                    visualization_data: content.visualization_data || '',
                },
                generatedAt: new Date(),
            },
        },
        { upsert: true, new: true, lean: true },
    );

    // Strip content from all previous days (keep only topic name for dedup)
    DailyTopic.updateMany(
        { userId, date: { $ne: today } },
        { $set: { content: null } }
    ).catch(() => {});

    return doc;
}

module.exports = { generateOrFetchDailyTopic };
