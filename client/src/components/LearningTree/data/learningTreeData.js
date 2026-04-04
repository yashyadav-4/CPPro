// ─── CPPro Learning Tree — Full Dataset ───
// Extracted from docs/cp_learning_tree.html
// Each node: { id, label, tier, color, deps?, subs? }
// subs = subtopic IDs that appear on hover

export const TREE = [
  // ═══ TIER 0 — Foundations ═══
  { id: 'bigO',   label: 'Complexity\nAnalysis',     tier: 0, color: 'gray' },
  { id: 'arrays', label: 'Arrays &\nStrings',        tier: 0, color: 'gray' },
  { id: 'math0',  label: 'Basic Math\n& Loops',      tier: 0, color: 'gray' },
  { id: 'bits0',  label: 'Bit\nManipulation',        tier: 0, color: 'gray',
    subs: ['bit-ops', 'bit-tricks', 'bitmask-basics', 'popcount'] },
  { id: 'stl',    label: 'STL /\nBuilt-ins',         tier: 0, color: 'gray' },

  // ═══ TIER 1 — Core DS ═══
  { id: 'sorting', label: 'Sorting\nAlgorithms',     tier: 1, color: 'teal', deps: ['arrays', 'bigO'],
    subs: ['bubble-sel', 'merge-sort', 'quick-sort', 'counting-sort', 'radix-sort'] },
  { id: 'hashing', label: 'Hashing &\nMaps',         tier: 1, color: 'teal', deps: ['arrays'],
    subs: ['hash-map', 'hash-set', 'rolling-hash', 'custom-hash'] },
  { id: 'stacks',  label: 'Stacks &\nQueues',        tier: 1, color: 'teal', deps: ['arrays'] },
  { id: 'prefix',  label: 'Prefix Sums\n& Diff Array', tier: 1, color: 'teal', deps: ['arrays'],
    subs: ['1d-prefix', '2d-prefix', 'diff-array', 'offline-prefix'] },
  { id: 'twoptr',  label: 'Two Pointers\n& Sliding',  tier: 1, color: 'teal', deps: ['arrays', 'sorting'],
    subs: ['two-ptr-basic', 'sliding-win', 'fixed-win', 'variable-win'] },

  // ═══ TIER 2 — Algorithms ═══
  { id: 'binsearch', label: 'Binary\nSearch',         tier: 2, color: 'blue', deps: ['sorting'],
    subs: ['bs-array', 'bs-answer', 'bs-real', 'ternary-search'] },
  { id: 'recur',    label: 'Recursion &\nBacktracking', tier: 2, color: 'blue', deps: ['bigO', 'math0'],
    subs: ['basic-recur', 'backtrack', 'n-queens', 'sudoku', 'subsets-bt'] },
  { id: 'divconq',  label: 'Divide &\nConquer',      tier: 2, color: 'blue', deps: ['recur', 'sorting'],
    subs: ['merge-sort-dc', 'inv-count', 'closest-pair', 'dc-dp'] },
  { id: 'greedy',   label: 'Greedy\nAlgorithms',     tier: 2, color: 'blue', deps: ['sorting', 'binsearch'],
    subs: ['activity-sel', 'job-sched', 'huffman', 'interval-cover', 'greedy-proof'] },
  { id: 'numth',    label: 'Number\nTheory',          tier: 2, color: 'blue', deps: ['math0', 'bits0'],
    subs: ['gcd-lcm', 'sieve', 'prime-factor', 'modular-arith', 'fast-exp', 'euler-totient', 'crt', 'flt'] },

  // ═══ TIER 3 — Structures ═══
  { id: 'linked', label: 'Linked\nLists',            tier: 3, color: 'purple', deps: ['arrays'] },
  { id: 'trees',  label: 'Binary Trees\n& BST',      tier: 3, color: 'purple', deps: ['recur'],
    subs: ['tree-traversal', 'bst-ops', 'avl-rb', 'height-depth', 'lca-naive'] },
  { id: 'heap',   label: 'Heaps &\nPriority Queue',  tier: 3, color: 'purple', deps: ['sorting', 'arrays'],
    subs: ['min-max-heap', 'heap-sort', 'd-ary-heap', 'lazy-heap'] },
  { id: 'graph1', label: 'Graph\nTraversal',         tier: 3, color: 'purple', deps: ['recur', 'stacks'],
    subs: ['bfs', 'dfs', 'flood-fill', 'bipartite', 'cycle-detect', 'connected-comp', 'topo-sort'] },
  { id: 'deque',  label: 'Deque & Mono\nStack/Queue', tier: 3, color: 'purple', deps: ['stacks'],
    subs: ['deque-basic', 'mono-stack', 'mono-queue', 'sliding-win-max'] },

  // ═══ TIER 4 — DP + Graphs ═══
  { id: 'dp1', label: 'DP\nFundamentals', tier: 4, color: 'coral', deps: ['recur', 'prefix'],
    subs: ['dp-memo', 'dp-tabulation', 'dp-states', 'dp-transitions', 'dp1d-classics',
           'dp-knapsack01', 'dp-unbounded-ks', 'dp-bounded-ks', 'dp-lcs', 'dp-lis', 'dp-edit-dist', 'dp-coin-change'] },
  { id: 'dp2', label: 'DP — Grid\n& 2D', tier: 4, color: 'coral', deps: ['dp1'],
    subs: ['dp-grid-paths', 'dp-2d-matrix', 'dp-obstacle-grid', 'dp-triangle', 'dp-chocolate'] },
  { id: 'dp3', label: 'DP — Intervals\n& Strings', tier: 4, color: 'coral', deps: ['dp1'],
    subs: ['dp-mcm', 'dp-burst-balloons', 'dp-palindrome-part', 'dp-string-dp', 'dp-longest-palindrome'] },
  { id: 'graph2', label: 'Shortest\nPaths', tier: 4, color: 'coral', deps: ['graph1', 'heap'],
    subs: ['dijkstra', 'bellman-ford', 'floyd-warshall', 'spfa', '0-1-bfs', 'johnson'] },
  { id: 'mst', label: 'MST &\nSpanning Trees', tier: 4, color: 'coral', deps: ['graph1', 'sorting'],
    subs: ['kruskal', 'prim', 'boruvka', 'mst-properties'] },
  { id: 'union', label: 'Union-Find\n(DSU)', tier: 4, color: 'coral', deps: ['graph1'],
    subs: ['dsu-basic', 'dsu-rank', 'dsu-path-compress', 'dsu-weighted', 'dsu-bipartite'] },

  // ═══ TIER 5 — Advanced ═══
  { id: 'segtree', label: 'Segment Tree\n& BIT', tier: 5, color: 'amber', deps: ['trees', 'prefix'],
    subs: ['bit-fen', 'seg-sum', 'seg-range-update', 'seg-lazy-prop', 'seg-merge-sort', 'seg-persistent', 'seg-beats'] },
  { id: 'sparse', label: 'Sparse Table\n& LCA', tier: 5, color: 'amber', deps: ['prefix', 'dp1'],
    subs: ['sparse-table-rmq', 'lca-binary-lifting', 'binary-lifting'] },
  { id: 'trie', label: 'Tries', tier: 5, color: 'amber', deps: ['trees', 'hashing'],
    subs: ['trie-basic', 'trie-xor', 'compressed-trie', 'suffix-trie'] },
  { id: 'graph3', label: 'Advanced\nGraph', tier: 5, color: 'amber', deps: ['graph2', 'union'],
    subs: ['bridges-ap', 'scc-kosaraju', 'scc-tarjan', 'euler-path', 'hamilton-path', '2-sat', 'virtual-nodes'] },
  { id: 'treedp', label: 'Tree DP &\nDecomposition', tier: 5, color: 'amber', deps: ['trees', 'dp1', 'sparse'],
    subs: ['tree-dp-basic', 'rerooting', 'lca-dp', 'centroid-decomp', 'hld', 'euler-tour', 'small-to-large'] },
  { id: 'dp4', label: 'DP on Trees\n& DAG', tier: 5, color: 'amber', deps: ['treedp', 'dp1'],
    subs: ['dp-on-trees', 'dp-dag', 'dp-subset-sum', 'dp-sos', 'dp-profile'] },
  { id: 'dp5', label: 'Bitmask DP\n& Digit DP', tier: 5, color: 'amber', deps: ['bits0', 'dp1'],
    subs: ['bitmask-dp', 'tsp-dp', 'digit-dp', 'dp-broken-profile', 'dp-counting-paths'] },
  { id: 'combo', label: 'Combinatorics\n& Probability', tier: 5, color: 'amber', deps: ['numth'],
    subs: ['permutations', 'combinations', 'ncr-mod', 'stars-bars', 'catalan', 'inclusion-excl', 'pigeonhole', 'expected-value', 'prob-dp'] },
  { id: 'mathadv', label: 'Advanced\nMath', tier: 5, color: 'amber', deps: ['numth', 'combo'],
    subs: ['matrix-expo', 'linear-recur', 'gauss-elim', 'fft-ntt', 'poly-ops', 'xor-basis', 'sos-dp-math'] },

  // ═══ TIER 6 — Expert ═══
  { id: 'strings', label: 'String\nAlgorithms', tier: 6, color: 'pink', deps: ['trie', 'prefix'],
    subs: ['kmp', 'z-algo', 'rabin-karp', 'manacher', 'suffix-array', 'suffix-automaton', 'aho-corasick', 'palindromic-tree'] },
  { id: 'dpopt', label: 'DP\nOptimizations', tier: 6, color: 'pink', deps: ['dp4', 'segtree'],
    subs: ['dp-div-conquer', 'dp-convex-hull-trick', 'dp-cht-li-chao', 'dp-knuth', 'dp-aliens', 'dp-slope-trick'] },
  { id: 'flows', label: 'Network\nFlows', tier: 6, color: 'pink', deps: ['graph3'],
    subs: ['max-flow-ff', 'edmonds-karp', 'dinic', 'min-cut', 'bipartite-matching', 'hungarian', 'circulation', 'min-cost-flow'] },
  { id: 'geo', label: 'Computational\nGeometry', tier: 6, color: 'pink', deps: ['mathadv'],
    subs: ['points-lines', 'convex-hull', 'line-sweep', 'rotating-calipers', 'point-in-poly', 'half-plane', 'geo-intersect'] },
  { id: 'sqrtdec', label: 'Sqrt\nDecomposition', tier: 6, color: 'pink', deps: ['segtree'],
    subs: ['sqrt-blocks', 'mos-algorithm', 'mos-tree', 'mos-3d'] },

  // ═══ TIER 7 — Mastery ═══
  { id: 'misc', label: 'Misc\nTechniques', tier: 7, color: 'red', deps: ['combo', 'dpopt'],
    subs: ['meet-middle', 'randomized', 'sprague-grundy', 'nim', 'game-theory', 'interactive', 'offline-algos', 'parallel-bin-search', 'small-to-large-adv'] },
  { id: 'godtier', label: 'Competitive\nMastery', tier: 7, color: 'red', deps: ['strings', 'flows', 'geo', 'sqrtdec', 'misc'] },
];

// ─── Subtopic Display Labels ───
export const SUB_LABELS = {
  'bit-ops': 'Bitwise ops', 'bit-tricks': 'Bit tricks', 'bitmask-basics': 'Bitmask basics', 'popcount': 'Popcount / parity',
  'bubble-sel': 'Bubble / Selection', 'merge-sort': 'Merge sort', 'quick-sort': 'Quicksort', 'counting-sort': 'Counting sort', 'radix-sort': 'Radix sort',
  'hash-map': 'HashMap ops', 'hash-set': 'HashSet', 'rolling-hash': 'Rolling hash', 'custom-hash': 'Custom hash',
  '1d-prefix': '1D prefix sum', '2d-prefix': '2D prefix sum', 'diff-array': 'Difference array', 'offline-prefix': 'Offline prefix',
  'two-ptr-basic': 'Basic two pointer', 'sliding-win': 'Sliding window', 'fixed-win': 'Fixed-size window', 'variable-win': 'Variable window',
  'bs-array': 'Search in array', 'bs-answer': 'Binary search on answer', 'bs-real': 'Search on reals', 'ternary-search': 'Ternary search',
  'basic-recur': 'Basic recursion', 'backtrack': 'Backtracking', 'n-queens': 'N-Queens', 'sudoku': 'Sudoku solver', 'subsets-bt': 'Subsets / permutations',
  'merge-sort-dc': 'Merge sort D&C', 'inv-count': 'Inversion count', 'closest-pair': 'Closest pair of points', 'dc-dp': 'D&C + DP',
  'activity-sel': 'Activity selection', 'job-sched': 'Job scheduling', 'huffman': 'Huffman coding', 'interval-cover': 'Interval covering', 'greedy-proof': 'Exchange argument proof',
  'gcd-lcm': 'GCD / LCM', 'sieve': 'Sieve of Eratosthenes', 'prime-factor': 'Prime factorization', 'modular-arith': 'Modular arithmetic', 'fast-exp': 'Fast exponentiation', 'euler-totient': "Euler's totient", 'crt': 'Chinese Remainder Thm', 'flt': 'Fermat little theorem',
  'tree-traversal': 'Inorder / pre / post', 'bst-ops': 'BST insert / delete', 'avl-rb': 'AVL / Red-Black tree', 'height-depth': 'Height & depth', 'lca-naive': 'LCA naive O(n)',
  'min-max-heap': 'Min / Max heap', 'heap-sort': 'Heapsort', 'd-ary-heap': 'D-ary heap', 'lazy-heap': 'Lazy deletion heap',
  'bfs': 'BFS', 'dfs': 'DFS', 'flood-fill': 'Flood fill', 'bipartite': 'Bipartite check', 'cycle-detect': 'Cycle detection', 'connected-comp': 'Connected components', 'topo-sort': 'Topological sort',
  'deque-basic': 'Deque basics', 'mono-stack': 'Monotonic stack', 'mono-queue': 'Monotonic queue', 'sliding-win-max': 'Sliding window maximum',
  'dp-memo': 'Memoization (top-down)', 'dp-tabulation': 'Tabulation (bottom-up)', 'dp-states': 'State design', 'dp-transitions': 'Transitions', 'dp1d-classics': '1D classics (climb stairs, house rob)',
  'dp-knapsack01': '0/1 Knapsack', 'dp-unbounded-ks': 'Unbounded knapsack', 'dp-bounded-ks': 'Bounded knapsack', 'dp-lcs': 'LCS', 'dp-lis': 'LIS (O(n log n))', 'dp-edit-dist': 'Edit distance', 'dp-coin-change': 'Coin change variants',
  'dp-grid-paths': 'Grid paths counting', 'dp-2d-matrix': '2D matrix DP', 'dp-obstacle-grid': 'Obstacle grid', 'dp-triangle': 'Triangle DP', 'dp-chocolate': 'Broken / chocolate DP',
  'dp-mcm': 'Matrix chain multiplication', 'dp-burst-balloons': 'Burst balloons', 'dp-palindrome-part': 'Palindrome partition', 'dp-string-dp': 'String interval DP', 'dp-longest-palindrome': 'Longest palindromic subsequence',
  'dijkstra': "Dijkstra's algorithm", 'bellman-ford': 'Bellman-Ford', 'floyd-warshall': 'Floyd-Warshall', 'spfa': 'SPFA', '0-1-bfs': '0-1 BFS', 'johnson': "Johnson's algorithm",
  'kruskal': "Kruskal's MST", 'prim': "Prim's MST", 'boruvka': "Borůvka's MST", 'mst-properties': 'MST cut & cycle props',
  'dsu-basic': 'DSU basic', 'dsu-rank': 'Union by rank', 'dsu-path-compress': 'Path compression', 'dsu-weighted': 'Weighted DSU', 'dsu-bipartite': 'Bipartite DSU',
  'bit-fen': 'Fenwick / BIT', 'seg-sum': 'Point update range sum', 'seg-range-update': 'Range update range query', 'seg-lazy-prop': 'Lazy propagation', 'seg-merge-sort': 'Merge sort tree', 'seg-persistent': 'Persistent seg tree', 'seg-beats': 'Segment tree beats',
  'sparse-table-rmq': 'Sparse table RMQ', 'lca-binary-lifting': 'LCA binary lifting', 'binary-lifting': 'Binary lifting (kth ancestor)',
  'trie-basic': 'Trie insert / search', 'trie-xor': 'XOR trie (max XOR)', 'compressed-trie': 'Compressed trie', 'suffix-trie': 'Suffix trie',
  'bridges-ap': 'Bridges & articulation pts', 'scc-kosaraju': 'SCC Kosaraju', 'scc-tarjan': 'SCC Tarjan', 'euler-path': 'Euler path / circuit', 'hamilton-path': 'Hamiltonian path', '2-sat': '2-SAT', 'virtual-nodes': 'Virtual / auxiliary nodes',
  'tree-dp-basic': 'Tree DP basics', 'rerooting': 'Rerooting technique', 'lca-dp': 'LCA with DP', 'centroid-decomp': 'Centroid decomposition', 'hld': 'Heavy-Light Decomposition', 'euler-tour': 'Euler tour (flat tree)', 'small-to-large': 'Small to large merging',
  'dp-on-trees': 'DP on trees', 'dp-dag': 'DP on DAG', 'dp-subset-sum': 'Subset sum DP', 'dp-sos': 'Sum over subsets (SOS)', 'dp-profile': 'Profile / broken DP',
  'bitmask-dp': 'Bitmask DP', 'tsp-dp': 'TSP with bitmask', 'digit-dp': 'Digit DP', 'dp-broken-profile': 'Broken profile DP', 'dp-counting-paths': 'Counting paths DP',
  'permutations': 'Permutations', 'combinations': 'Combinations', 'ncr-mod': 'nCr mod prime', 'stars-bars': 'Stars & bars', 'catalan': 'Catalan numbers', 'inclusion-excl': 'Inclusion-exclusion', 'pigeonhole': 'Pigeonhole principle', 'expected-value': 'Expected value', 'prob-dp': 'Probability DP',
  'matrix-expo': 'Matrix exponentiation', 'linear-recur': 'Linear recurrences', 'gauss-elim': 'Gaussian elimination', 'fft-ntt': 'FFT / NTT', 'poly-ops': 'Polynomial operations', 'xor-basis': 'XOR basis (linear algebra)', 'sos-dp-math': 'SOS DP',
  'kmp': 'KMP algorithm', 'z-algo': 'Z-algorithm', 'rabin-karp': 'Rabin-Karp hashing', 'manacher': "Manacher's palindrome", 'suffix-array': 'Suffix array + LCP', 'suffix-automaton': 'Suffix automaton (SAM)', 'aho-corasick': 'Aho-Corasick', 'palindromic-tree': 'Palindromic tree (Eertree)',
  'dp-div-conquer': 'D&C optimization', 'dp-convex-hull-trick': 'Convex hull trick', 'dp-cht-li-chao': 'Li Chao tree', 'dp-knuth': "Knuth's optimization", 'dp-aliens': 'Aliens trick (λ-optimization)', 'dp-slope-trick': 'Slope trick',
  'max-flow-ff': 'Ford-Fulkerson', 'edmonds-karp': 'Edmonds-Karp', 'dinic': "Dinic's algorithm", 'min-cut': 'Min cut theorem', 'bipartite-matching': 'Bipartite matching', 'hungarian': 'Hungarian algorithm', 'circulation': 'Circulation with demands', 'min-cost-flow': 'Min cost max flow',
  'points-lines': 'Points & lines basics', 'convex-hull': 'Convex hull (Graham/Andrew)', 'line-sweep': 'Line sweep', 'rotating-calipers': 'Rotating calipers', 'point-in-poly': 'Point in polygon', 'half-plane': 'Half-plane intersection', 'geo-intersect': 'Segment intersection',
  'sqrt-blocks': 'Block decomposition', 'mos-algorithm': "Mo's algorithm", 'mos-tree': "Mo's on trees", 'mos-3d': "Mo's 3D / offline",
  'meet-middle': 'Meet in the middle', 'randomized': 'Randomized algorithms', 'sprague-grundy': 'Sprague-Grundy theorem', 'nim': 'Nim & Nim variants', 'game-theory': 'Game theory patterns', 'interactive': 'Interactive problems', 'offline-algos': 'Offline algorithms', 'parallel-bin-search': 'Parallel binary search', 'small-to-large-adv': 'DSU on tree (advanced)',
};

// ─── Tier Color Palettes (matches HTML exactly) ───
export const TIER_COLORS = {
  gray:   { bg: '#1e1e20', border: '#3a3a3e', text: '#a0a0ac', accent: '#606068' },
  teal:   { bg: '#0d2420', border: '#1a5c4a', text: '#3dd4a0', accent: '#1db97a' },
  blue:   { bg: '#0d1e36', border: '#1a3d6e', text: '#7ab8f5', accent: '#3d8ef0' },
  purple: { bg: '#1a1028', border: '#3d2470', text: '#b89cf5', accent: '#8b5cf6' },
  coral:  { bg: '#2a150d', border: '#6e3018', text: '#f5a070', accent: '#ff6b35' },
  amber:  { bg: '#261a08', border: '#6b4510', text: '#f5c060', accent: '#e07b2a' },
  pink:   { bg: '#261020', border: '#6b2455', text: '#f580c0', accent: '#d946a8' },
  red:    { bg: '#1f0d0d', border: '#6e2020', text: '#f58080', accent: '#ef4444' },
};

// ─── State Colors for progress levels ───
export const STATE_COLORS = ['#3a3a3e', '#1db97a', '#3d8ef0', '#e07b2a'];
export const STATE_NAMES  = ['untouched', 'theory', 'implemented', 'mastered'];

// ─── Tier Labels ───
export const TIER_LABELS = [
  'T0: Foundations',
  'T1: Core DS',
  'T2: Algorithms',
  'T3: Structures',
  'T4: DP + Graphs',
  'T5: Advanced',
  'T6: Expert',
  'T7: Master',
];

// ─── Helper: collect all trackable IDs ───
export function getAllTrackableIds() {
  const ids = [];
  for (const node of TREE) {
    if (node.subs && node.subs.length > 0) {
      ids.push(...node.subs);
    } else {
      ids.push(node.id);
    }
  }
  return ids;
}
