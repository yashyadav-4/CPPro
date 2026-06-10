const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose   = require('mongoose');
const DailyTopic = require('../Model/DailyTopic');
const Submission = require('../Model/Submissions');
const Platform   = require('../Model/Platform');
const LeetCodeData = require('../Model/LeetCodeData');
const User       = require('../Model/User');
const ErrorLog   = require('../Model/ErrorLog');
const { getTodayIST, getNDaysAgoIST } = require('../Utils/dateUtils');
const ytSearch = require('yt-search');

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
    return `You are an expert competitive-programming coach writing fun, deeply educational tutorials for beginners who may not know advanced CS concepts.
You will receive a specific algorithm/technique name. Return ONLY a raw JSON object (no markdown fences) with this EXACT schema:
{
  "topic": "string — the exact topic name",
  "term_glossary": {
    "TermName": "Beginner-friendly 1-2 sentence definition. Use plain English, no jargon.",
    ...
  },
  "article": "string — engaging markdown tutorial (see requirements below)",
  "dry_run": "string — step-by-step walkthrough/dry-run with a concrete small example in markdown",
  "code_template": "string — clean, well-commented ${langName} implementation ready for contests",
  "visualization_data": "string - valid Mermaid.js flowchart/graph syntax illustrating the algorithm flow. DO NOT wrap in markdown code blocks. Output raw mermaid syntax only. Use simple labels, no special characters.",
  "study_resources": {
    "reference_site": {
      "title": "string - title of a high-quality written resource (e.g. 'CP-Algorithms: Floyd-Warshall')",
      "exact_url": "string - full https direct URL to this exact article"
    },
    "youtube_video": {
      "title": "string - title of a beginner-friendly YouTube lesson (e.g. 'Floyd-Warshall - WilliamFiset')",
      "search_query": "string - YouTube search query to find this exact video (e.g. 'Floyd-Warshall WilliamFiset')"
    }
  }
}

TERM_GLOSSARY REQUIREMENTS (for the "term_glossary" field):
- Include 8 to 12 key terms that appear in the article and might be unfamiliar to a beginner.
- Each definition must be 1-2 sentences, written in plain everyday English — imagine explaining to a smart 16-year-old.
- Include both algorithm-specific terms (like "bipartite graph", "augmenting path") AND general CS terms used (like "graph", "vertex", "edge") if the topic uses them heavily.
- Example format: { "Bipartite Graph": "A graph whose nodes can be split into two groups where all edges go between the groups, never within the same group.", "Augmenting Path": "A path from an unmatched source to an unmatched destination that can be used to increase the size of a matching by one." }

ARTICLE REQUIREMENTS (for the "article" field):
- Write in **markdown format** with proper headings (##, ###), paragraphs, bold text, lists, and blockquotes.
- Use a fun, conversational tone — like a brilliant friend explaining over coffee.
- Structure with these sections:

  ## What is [Topic]?
  MUST write at LEAST 6 substantial paragraphs. This is the most important section for human understanding.
  PARAGRAPH 1 (real-world analogy): Start with a vivid, relatable real-world story or analogy (postal worker, GPS navigation, building roads, etc.). Make it concrete and specific, not abstract. At least 70 words.
  PARAGRAPH 2 (problem in plain English): Before using CS terms, explain the exact kind of question this topic answers. Say what the input looks like, what the output means, and why a beginner should care. At least 60 words.
  PARAGRAPH 3 (formal definition): Now translate to CS terms. Define formally but still accessibly. Explain the core data structure/concept being operated on and define each essential word the first time you use it. At least 70 words.
  PARAGRAPH 4 (mental model): Explain the core mechanism like a checklist the reader can run in their head. Describe what changes after each step and what stays true. At least 70 words.
  PARAGRAPH 5 (tiny example): Give a tiny inline example with 3-4 nodes/values. Walk through one or two moves slowly, using simple names like A, B, C or a, b, c. At least 70 words.
  PARAGRAPH 6 (why it is special): Compare to naive approaches. Why is this technique better? What problem does it elegantly solve that brute force cannot scale to? Explain the key insight in one memorable sentence. At least 60 words.

  ## Why Should You Care?
  Why this is a contest superpower. Reference problem types, contest scenarios. At the end of this section, give ONE concrete example: "For instance, if a problem asks to find the minimum number of X such that Y, think of this algorithm."

  ## When to Use It
  Pattern recognition: what clues in problem statements scream this technique? List 4-6 specific patterns. After each pattern, add a mini-example in parentheses: e.g. "Keywords like 'minimum cost path' or 'shortest route between all pairs' (e.g. find shortest route between every pair of cities)"

  ## Common Traps and Edge Cases
  Common mistakes beginners make. After each trap, explain WHY it causes issues and HOW to fix it.

  ## Real-World Uses
  2-3 cool real-world applications. Make it interesting — GPS systems, social networks, compilers, etc.

- Use **bold** for key terms (especially those in your term_glossary), \`inline code\` for variable names.
- Use > blockquotes for pro tips.
- NEVER use LaTeX or dollar signs ($). Write complexity as O(N log N).
- Use simple variable names: a, b, c (NOT x_0, x_1). For nodes use A, B, C or 1, 2, 3.
- Target 1000-1300 words total for the article.

STUDY_RESOURCES REQUIREMENTS (for the "study_resources" field):
- Always include exactly one reference_site and exactly one youtube_video.
- reference_site must be a real, high-signal written tutorial or reference for the exact topic. Prefer cp-algorithms.com, usaco.guide, visualgo.net, geeksforgeeks.org, leetcode.com. Provide the EXACT working URL.
- youtube_video must be an ENGLISH YouTube lesson. Prefer English-speaking channels like WilliamFiset, NeetCode, Tushar Roy, Errichto. Provide a YouTube search query that will return it as the top result (append 'English' if needed).
- Do not put these links in the article body; only put them in study_resources.

DRY RUN REQUIREMENTS (for the "dry_run" field):
- Pick a SMALL concrete example (e.g., a graph with 4-5 nodes, an array of 5-6 elements).
- Use SIMPLE, FRIENDLY variable names: a, b, c, d. For nodes use A, B, C, D or 1, 2, 3, 4.
- NEVER use LaTeX, dollar signs, or math notation.
- For EACH step:
  (a) State what the algorithm does in plain English
  (b) Show the example values changing (use a markdown table or code block)
  (c) Add a one-line "Why?" explanation of why this step happens
- Show state of key data structures (arrays, stacks, queues, visited sets) at each step.
- Include the final answer and time/space complexity at the end.
- Make it feel like watching the algorithm in slow motion.

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
The Mermaid diagram should visually illustrate the algorithm's core logic.
Also include one written reference site and one YouTube study video in study_resources.`;

    const maxAttempts = Math.min(KEYS.length, 5);
    let lastError = null;

    // The model cascade: Try these models in order on the SAME key.
    // Each model has its own independent rate-limit bucket on Google's free tier.
    // NOTE: gemini-1.5 and gemini-2.0 were shut down on June 1, 2026.
    // gemini-3.5-flash is the current recommended model, and gemini-3.1-flash-lite is the lightweight alternative.
    // gemini-2.5-flash was removed as it deprecates on June 17, 2026.
    const modelsToTry = [
        MODEL_NAME, // gemma-4-31b-it
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
        'gemini-pro-latest',
        'gemini-flash-latest',
    ];

    for (let i = 0; i < maxAttempts; i++) {
        const key = nextKey();

        // Add a small delay between key retries (not on the first attempt)
        // to avoid hammering the same overloaded infrastructure immediately
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        try {
            const genAI = new GoogleGenerativeAI(key);
            let result = null;
            let modelFailure = null;

            // Try each model sequentially for this specific key
            for (const modelId of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({
                        model: modelId,
                        systemInstruction: buildSystemPrompt(language),
                        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
                    });
                    result = await model.generateContent(userPrompt);

                    // Validate we got parseable JSON before declaring success
                    const rawText = result.response.text();
                    try {
                        const parsed = parseJSON(rawText);
                        // Success! Return the parsed result directly
                        return parsed;
                    } catch (parseErr) {
                        // Model responded but output was malformed JSON — try next model
                        console.log(`[DailyTopic] ${modelId} returned unparseable JSON, trying next model...`);
                        modelFailure = parseErr;
                        result = null;
                        continue;
                    }
                } catch (err) {
                    modelFailure = err;
                    const msg = err.message.toLowerCase();
                    // If rate-limited (429) or overloaded (500/503), try the next model
                    if (msg.includes('500') || msg.includes('503') || msg.includes('429') || msg.includes('overloaded') || msg.includes('quota')) {
                        console.log(`[DailyTopic] ${modelId} failed (${err.message.split('\\n')[0]}). Cascading to next model...`);
                        continue; 
                    } else {
                        // Auth error (400/403) -> The key itself is bad, stop trying models and throw to swap key
                        throw err; 
                    }
                }
            }

            // If we exhausted all models in the cascade, throw to swap the API key
            if (!result) {
                throw new Error(`All fallback models exhausted for this key. Last error: ${modelFailure?.message}`);
            }

            const raw = result.response.text();
            return parseJSON(raw);
        } catch (err) {
            lastError = err;
            const currentKeyIdx = (keyIndex - 1 + KEYS.length) % KEYS.length + 1;
            console.error(`[DailyTopic] Gemini key #${currentKeyIdx} failed:`, err.message);
            ErrorLog.create({ source: 'DailyTopic', level: 'error', message: `Gemini key #${currentKeyIdx} failed: ${err.message}` }).catch(() => {});
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

function buildSearchUrl(base, query) {
    return `${base}${encodeURIComponent(query)}`;
}

function safeHttpsUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:') return '';
        return url.toString();
    } catch {
        return '';
    }
}

function isYoutubeUrl(url) {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
        if (host === 'youtu.be') return parsed.pathname.length > 1;
        if (host !== 'youtube.com' && host !== 'm.youtube.com') return false;
        return (parsed.pathname === '/watch' && parsed.searchParams.has('v'))
            || parsed.pathname.startsWith('/embed/');
    } catch {
        return false;
    }
}

function cleanResourceTitle(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const cleaned = value.replace(/\s+/g, ' ').trim();
    return cleaned ? cleaned.slice(0, 140) : fallback;
}

function asResource(value) {
    if (!value) return {};
    if (typeof value === 'string') return { url: value };
    if (typeof value === 'object') return value;
    return {};
}

function fallbackStudyResources(topic) {
    const topicQuery = `${topic} competitive programming algorithm tutorial`;
    return {
        reference_site: {
            title: `${topic} written reference`,
            url: buildSearchUrl('https://www.geeksforgeeks.org/?s=', topic),
        },
        youtube_video: {
            title: `${topic} YouTube lesson`,
            url: buildSearchUrl('https://www.youtube.com/results?search_query=', topicQuery),
        },
    };
}

// ── Verify URL is alive ─────────────────────────────────────────────
async function checkUrlAlive(url) {
    if (!url) return false;
    try {
        const res = await axios.get(url, { timeout: 3000, maxRedirects: 3 });
        return res.status >= 200 && res.status < 400;
    } catch {
        return false;
    }
}

async function normalizeStudyResources(content, fallbackTopic) {
    const fallback = fallbackStudyResources(fallbackTopic);
    const resources = content?.study_resources && typeof content.study_resources === 'object'
        ? content.study_resources
        : {};

    const rawReference = asResource(resources.reference_site || resources.reference || resources.website);
    const rawYoutube = asResource(resources.youtube_video || resources.youtube || resources.video);

    // Written reference -> try the exact URL LLM provided. If it's dead, fallback to Google search
    let referenceUrl = safeHttpsUrl(rawReference.exact_url || rawReference.url || rawReference.href);
    if (referenceUrl) {
        const isAlive = await checkUrlAlive(referenceUrl);
        if (!isAlive) {
            const query = rawReference.title || fallbackTopic;
            referenceUrl = buildSearchUrl('https://www.google.com/search?q=', query + ' competitive programming');
        }
    } else {
        const query = rawReference.search_query || rawReference.title || fallbackTopic;
        referenceUrl = buildSearchUrl('https://www.google.com/search?q=', query + ' competitive programming');
    }

    let finalYoutubeUrl = fallback.youtube_video.url;
    let finalYoutubeTitle = cleanResourceTitle(rawYoutube.title || rawYoutube.name, fallback.youtube_video.title);

    // YouTube -> Use yt-search to get the direct video link! Append English to force English videos.
    if (rawYoutube.search_query) {
        try {
            const ytRes = await ytSearch(rawYoutube.search_query + " English tutorial");
            if (ytRes && ytRes.videos && ytRes.videos.length > 0) {
                finalYoutubeUrl = ytRes.videos[0].url;
                finalYoutubeTitle = ytRes.videos[0].title || finalYoutubeTitle;
            } else {
                finalYoutubeUrl = buildSearchUrl('https://www.youtube.com/results?search_query=', rawYoutube.search_query);
            }
        } catch (err) {
            finalYoutubeUrl = buildSearchUrl('https://www.youtube.com/results?search_query=', rawYoutube.search_query);
        }
    } else {
        const youtubeUrl = safeHttpsUrl(rawYoutube.url || rawYoutube.href);
        if (youtubeUrl && isYoutubeUrl(youtubeUrl)) {
            finalYoutubeUrl = youtubeUrl;
        }
    }

    return {
        reference_site: {
            title: cleanResourceTitle(rawReference.title || rawReference.name, fallback.reference_site.title),
            url: referenceUrl,
        },
        youtube_video: {
            title: finalYoutubeTitle,
            url: finalYoutubeUrl,
        },
    };
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
    if (existing) {
        if (existing.content && !existing.content.study_resources) {
            const studyResources = await normalizeStudyResources(existing.content, existing.topic);
            await DailyTopic.updateOne(
                { _id: existing._id },
                { $set: { 'content.study_resources': studyResources } },
            );
            existing.content.study_resources = studyResources;
        }
        return existing;
    }

    const weakTopic = await findWeakestTopic(userId);
    console.log(`[DailyTopic] Generating for user=${userId} topic="${weakTopic}"`);

    const content = await callGemma(weakTopic, language);
    const topicName = content.topic || weakTopic;
    const studyResources = await normalizeStudyResources(content, topicName);

    const doc = await DailyTopic.findOneAndUpdate(
        { userId, date: today },
        {
            $setOnInsert: {
                userId,
                date: today,
                topic: topicName,
                language,
                content: {
                    article:            content.article            || '',
                    dry_run:            content.dry_run            || '',
                    code_template:      content.code_template      || '',
                    visualization_data: content.visualization_data || '',
                    term_glossary:      content.term_glossary      || {},
                    study_resources:    studyResources,
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
