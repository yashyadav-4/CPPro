// ─── CPPro Learning Tree — Full Dataset ───
// Extracted from docs/cp_learning_tree.html
// Each node: { id, label, tier, color, deps?, subs? }
// subs = subtopic IDs that appear on hover

export const CP_TREE = [
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

export const CP_SUB_LABELS = {
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

export const DSA_TREE = [
  // T0
  { id: 'dsa-complexity', label: 'Complexity\nAnalysis', tier: 0, color: 'pink', subs: ['dsa-complexity-time', 'dsa-complexity-space', 'dsa-complexity-bigo', 'dsa-complexity-cases', 'dsa-complexity-amortized'] },
  { id: 'dsa-arrays', label: 'Arrays &\nStrings', tier: 0, color: 'pink', subs: ['dsa-arrays-1d2d', 'dsa-arrays-strings', 'dsa-arrays-subarray', 'dsa-arrays-sliding', 'dsa-arrays-kadane'] },
  { id: 'dsa-math', label: 'Basic Math\n& Loops', tier: 0, color: 'pink', subs: ['dsa-math-modular', 'dsa-math-gcd', 'dsa-math-sieve', 'dsa-math-pow', 'dsa-math-nt-basics'] },
  { id: 'dsa-bits', label: 'Bit\nManipulation', tier: 0, color: 'pink', subs: ['dsa-bits-ops', 'dsa-bits-tricks', 'dsa-bits-mask', 'dsa-bits-count', 'dsa-bits-pow2'] },
  { id: 'dsa-stl', label: 'STL /\nBuilt-ins', tier: 0, color: 'pink', subs: ['dsa-stl-vec', 'dsa-stl-str', 'dsa-stl-sort', 'dsa-stl-pair', 'dsa-stl-iter'] },
  // T1
  { id: 'dsa-sort', label: 'Sorting\nAlgorithms', tier: 1, color: 'amber', deps: ['dsa-complexity', 'dsa-arrays'], subs: ['dsa-sort-merge', 'dsa-sort-quick', 'dsa-sort-heap', 'dsa-sort-count-radix', 'dsa-sort-simple'] },
  { id: 'dsa-hash', label: 'Hashing &\nMaps', tier: 1, color: 'amber', deps: ['dsa-arrays'], subs: ['dsa-hash-mapset', 'dsa-hash-cols', 'dsa-hash-freq', 'dsa-hash-anagram', 'dsa-hash-roll'] },
  { id: 'dsa-stacks', label: 'Stacks &\nQueues', tier: 1, color: 'amber', deps: ['dsa-arrays'], subs: ['dsa-stacks-impl', 'dsa-stacks-queue', 'dsa-stacks-mono', 'dsa-stacks-deque', 'dsa-stacks-bal'] },
  { id: 'dsa-prefix', label: 'Prefix Sum\n& Diff Array', tier: 1, color: 'amber', deps: ['dsa-arrays'], subs: ['dsa-prefix-1d', 'dsa-prefix-2d', 'dsa-prefix-diff', 'dsa-prefix-range', 'dsa-prefix-sumk'] },
  { id: 'dsa-twoptr', label: 'Two Pointers\n& Sliding', tier: 1, color: 'amber', deps: ['dsa-arrays', 'dsa-sort'], subs: ['dsa-twoptr-classic', 'dsa-twoptr-fixed', 'dsa-twoptr-var', 'dsa-twoptr-dutch', 'dsa-twoptr-water'] },
  // T2
  { id: 'dsa-bsearch', label: 'Binary\nSearch', tier: 2, color: 'blue', deps: ['dsa-sort'], subs: ['dsa-bsearch-classic', 'dsa-bsearch-ans', 'dsa-bsearch-bound', 'dsa-bsearch-rotated', 'dsa-bsearch-peak'] },
  { id: 'dsa-recursion', label: 'Recursion &\nBacktracking', tier: 2, color: 'blue', deps: ['dsa-complexity', 'dsa-math'], subs: ['dsa-recursion-basics', 'dsa-recursion-subsets', 'dsa-recursion-nqueens', 'dsa-recursion-sudoku', 'dsa-recursion-word'] },
  { id: 'dsa-divconq', label: 'Divide &\nConquer', tier: 2, color: 'blue', deps: ['dsa-recursion', 'dsa-sort'], subs: ['dsa-divconq-merge', 'dsa-divconq-quick', 'dsa-divconq-closest', 'dsa-divconq-matrix', 'dsa-divconq-inv'] },
  { id: 'dsa-greedy', label: 'Greedy\nAlgorithms', tier: 2, color: 'blue', deps: ['dsa-sort', 'dsa-bsearch'], subs: ['dsa-greedy-act', 'dsa-greedy-knap', 'dsa-greedy-huff', 'dsa-greedy-interval', 'dsa-greedy-job'] },
  { id: 'dsa-numth', label: 'Number\nTheory', tier: 2, color: 'blue', deps: ['dsa-math', 'dsa-bits'], subs: ['dsa-numth-prime', 'dsa-numth-euler', 'dsa-numth-inv', 'dsa-numth-crt', 'dsa-numth-flt'] },
  // T3
  { id: 'dsa-linked', label: 'Linked\nLists', tier: 3, color: 'purple', deps: ['dsa-arrays'], subs: ['dsa-linked-sq', 'dsa-linked-cycle', 'dsa-linked-merge', 'dsa-linked-reverse', 'dsa-linked-lru'] },
  { id: 'dsa-bst', label: 'Binary Trees\n& BST', tier: 3, color: 'purple', deps: ['dsa-recursion'], subs: ['dsa-bst-traversal', 'dsa-bst-height', 'dsa-bst-ops', 'dsa-bst-lca', 'dsa-bst-balanced'] },
  { id: 'dsa-heap', label: 'Heaps &\nPriority Queue', tier: 3, color: 'purple', deps: ['dsa-sort', 'dsa-arrays'], subs: ['dsa-heap-minmax', 'dsa-heap-impl', 'dsa-heap-kth', 'dsa-heap-merge', 'dsa-heap-median'] },
  { id: 'dsa-graphtr', label: 'Graph\nTraversal', tier: 3, color: 'purple', deps: ['dsa-recursion', 'dsa-stacks'], subs: ['dsa-graphtr-bfs', 'dsa-graphtr-dfs', 'dsa-graphtr-conn', 'dsa-graphtr-bipartite', 'dsa-graphtr-topo'] },
  { id: 'dsa-deque', label: 'Deque & Mono\nStack/Queue', tier: 3, color: 'purple', deps: ['dsa-stacks'], subs: ['dsa-deque-ops', 'dsa-deque-max', 'dsa-deque-monoq', 'dsa-deque-next', 'dsa-deque-stock'] },
  // T4
  { id: 'dsa-dpfund', label: 'DP\nFundamentals', tier: 4, color: 'coral', deps: ['dsa-recursion', 'dsa-prefix'], subs: ['dsa-dp-memo', 'dsa-dp-tab', 'dsa-dp-01knap', 'dsa-dp-lcs', 'dsa-dp-lis'] },
  { id: 'dsa-dpgrid', label: 'DP — Grid\n& 2D', tier: 4, color: 'coral', deps: ['dsa-dpfund'], subs: ['dsa-dp-grid-paths', 'dsa-dp-grid-min', 'dsa-dp-grid-unique', 'dsa-dp-grid-dungeon', 'dsa-dp-grid-square'] },
  { id: 'dsa-dpinterval', label: 'DP — Intervals\n& Strings', tier: 4, color: 'coral', deps: ['dsa-dpfund'], subs: ['dsa-dp-interval-mcm', 'dsa-dp-interval-pal', 'dsa-dp-interval-burst', 'dsa-dp-interval-edit', 'dsa-dp-interval-egg'] },
  { id: 'dsa-shortest', label: 'Shortest\nPaths', tier: 4, color: 'coral', deps: ['dsa-graphtr', 'dsa-heap'], subs: ['dsa-shortest-dijkstra', 'dsa-shortest-bellman', 'dsa-shortest-floyd', 'dsa-shortest-01bfs', 'dsa-shortest-bibfs'] },
  { id: 'dsa-mst', label: 'MST &\nSpanning Trees', tier: 4, color: 'coral', deps: ['dsa-graphtr', 'dsa-sort'], subs: ['dsa-mst-kruskal', 'dsa-mst-prim', 'dsa-mst-boruvka', 'dsa-mst-flow-intro', 'dsa-mst-cycle'] },
  { id: 'dsa-dsu', label: 'Union-Find\n(DSU)', tier: 4, color: 'coral', deps: ['dsa-graphtr'], subs: ['dsa-dsu-quick', 'dsa-dsu-rank', 'dsa-dsu-path', 'dsa-dsu-cycle', 'dsa-dsu-kruskal'] },
  // T5
  { id: 'dsa-segtree', label: 'Segment Tree\n& BIT', tier: 5, color: 'teal', deps: ['dsa-bst', 'dsa-prefix'], subs: ['dsa-seg-point', 'dsa-seg-range', 'dsa-seg-fenwick', 'dsa-seg-2d', 'dsa-seg-merge'] },
  { id: 'dsa-sparse', label: 'Sparse Table\n& LCA', tier: 5, color: 'teal', deps: ['dsa-prefix', 'dsa-dpfund'], subs: ['dsa-sparse-rmq', 'dsa-sparse-lca', 'dsa-sparse-euler', 'dsa-sparse-offline', 'dsa-sparse-hld'] },
  { id: 'dsa-tries', label: 'Tries', tier: 5, color: 'teal', deps: ['dsa-bst', 'dsa-hash'], subs: ['dsa-tries-basic', 'dsa-tries-prefix', 'dsa-tries-wild', 'dsa-tries-lcp', 'dsa-tries-xor'] },
  { id: 'dsa-advgraph', label: 'Advanced\nGraph', tier: 5, color: 'teal', deps: ['dsa-shortest', 'dsa-dsu'], subs: ['dsa-graph-art', 'dsa-graph-bridge', 'dsa-graph-scc', 'dsa-graph-euler', 'dsa-graph-2sat'] },
  { id: 'dsa-treedp', label: 'Tree DP &\nDecomposition', tier: 5, color: 'teal', deps: ['dsa-bst', 'dsa-dpfund', 'dsa-sparse'], subs: ['dsa-tree-dp-reroot', 'dsa-tree-dp-subtree', 'dsa-tree-dp-knap', 'dsa-tree-dp-centroid', 'dsa-tree-dp-hld'] },
  { id: 'dsa-bitmaskdp', label: 'Bitmask DP\n& Digit DP', tier: 5, color: 'teal', deps: ['dsa-bits', 'dsa-dpfund'], subs: ['dsa-bitmask-tsp', 'dsa-bitmask-profile', 'dsa-bitmask-digit', 'dsa-bitmask-count', 'dsa-bitmask-broken'] },
  { id: 'dsa-combprob', label: 'Combinatorics\n& Prob.', tier: 5, color: 'teal', deps: ['dsa-numth'], subs: ['dsa-comb-perm', 'dsa-comb-pigeon', 'dsa-comb-inc-exc', 'dsa-comb-exp', 'dsa-comb-gen'] },
  { id: 'dsa-advmath', label: 'Advanced\nMath', tier: 5, color: 'teal', deps: ['dsa-numth', 'dsa-combprob'], subs: ['dsa-math-fft', 'dsa-math-matrix', 'dsa-math-game', 'dsa-math-prob', 'dsa-math-power'] },
  // T6
  { id: 'dsa-strings', label: 'String\nAlgorithms', tier: 6, color: 'pink', deps: ['dsa-tries', 'dsa-prefix'], subs: ['dsa-strings-kmp', 'dsa-strings-z', 'dsa-strings-roll', 'dsa-strings-aho', 'dsa-strings-suff'] },
  { id: 'dsa-dpopt', label: 'DP\nOptimizations', tier: 6, color: 'pink', deps: ['dsa-bitmaskdp', 'dsa-segtree'], subs: ['dsa-dpopt-dc', 'dsa-dpopt-cht', 'dsa-dpopt-li', 'dsa-dpopt-knuth', 'dsa-dpopt-smawk'] },
  { id: 'dsa-flows', label: 'Network\nFlows', tier: 6, color: 'pink', deps: ['dsa-advgraph'], subs: ['dsa-flows-max', 'dsa-flows-dinic', 'dsa-flows-mcmf', 'dsa-flows-match', 'dsa-flows-hall'] },
  { id: 'dsa-compgeo', label: 'Computational\nGeometry', tier: 6, color: 'pink', deps: ['dsa-advmath'], subs: ['dsa-geo-convex', 'dsa-geo-intersect', 'dsa-geo-pointInPoly', 'dsa-geo-calipers', 'dsa-geo-voronoi'] },
  { id: 'dsa-sqrtd', label: 'Sqrt\nDecomposition', tier: 6, color: 'pink', deps: ['dsa-segtree'], subs: ['dsa-sqrtd-block', 'dsa-sqrtd-mo', 'dsa-sqrtd-3d', 'dsa-sqrtd-query', 'dsa-sqrtd-bucket'] },
  // T7
  { id: 'dsa-misctech', label: 'Misc\nTechniques', tier: 7, color: 'amber', deps: ['dsa-combprob', 'dsa-dpopt'], subs: ['dsa-misc-meet', 'dsa-misc-parallel', 'dsa-misc-off-dc', 'dsa-misc-stl-merge', 'dsa-misc-persist'] },
  { id: 'dsa-compmaster', label: 'Competitive\nMastery', tier: 7, color: 'pink', deps: ['dsa-strings', 'dsa-flows', 'dsa-compgeo', 'dsa-sqrtd', 'dsa-misctech'], subs: ['dsa-master-strat', 'dsa-master-time', 'dsa-master-cat', 'dsa-master-debug', 'dsa-master-virtual'] },
];

export const DSA_SUB_LABELS = {
  // T0
  'dsa-complexity-time': 'Time complexity', 'dsa-complexity-space': 'Space complexity', 'dsa-complexity-bigo': 'Big-O notation', 'dsa-complexity-cases': 'Best/Worst/Avg case', 'dsa-complexity-amortized': 'Amortized analysis',
  'dsa-arrays-1d2d': '1D / 2D arrays', 'dsa-arrays-strings': 'String manipulation', 'dsa-arrays-subarray': 'Subarray problems', 'dsa-arrays-sliding': 'Sliding window basics', 'dsa-arrays-kadane': "Kadane's algorithm",
  'dsa-math-modular': 'Modular arithmetic', 'dsa-math-gcd': 'GCD & LCM', 'dsa-math-sieve': 'Sieve of Eratosthenes', 'dsa-math-pow': 'Fast exponentiation', 'dsa-math-nt-basics': 'Number theory basics',
  'dsa-bits-ops': 'Bitwise operators', 'dsa-bits-tricks': 'XOR tricks', 'dsa-bits-mask': 'Bitmask basics', 'dsa-bits-count': 'Count set bits', 'dsa-bits-pow2': 'Power of two checks',
  'dsa-stl-vec': 'vector / array', 'dsa-stl-str': 'string methods', 'dsa-stl-sort': 'sort & comparators', 'dsa-stl-pair': 'pair & tuple', 'dsa-stl-iter': 'iterators',
  // T1
  'dsa-sort-merge': 'Merge sort', 'dsa-sort-quick': 'Quick sort', 'dsa-sort-heap': 'Heap sort', 'dsa-sort-count-radix': 'Counting / Radix sort', 'dsa-sort-simple': 'Insertion & Bubble sort',
  'dsa-hash-mapset': 'Hash maps / sets', 'dsa-hash-cols': 'Collision handling', 'dsa-hash-freq': 'Frequency counting', 'dsa-hash-anagram': 'Anagram problems', 'dsa-hash-roll': 'Rolling hash',
  'dsa-stacks-impl': 'Stack implementation', 'dsa-stacks-queue': 'Queue implementation', 'dsa-stacks-mono': 'Monotonic stack', 'dsa-stacks-deque': 'Deque', 'dsa-stacks-bal': 'Balanced parentheses',
  'dsa-prefix-1d': '1D prefix sum', 'dsa-prefix-2d': '2D prefix sum', 'dsa-prefix-diff': 'Difference arrays', 'dsa-prefix-range': 'Range sum queries', 'dsa-prefix-sumk': 'Subarray sum = k',
  'dsa-twoptr-classic': 'Two pointer technique', 'dsa-twoptr-fixed': 'Sliding window (fixed)', 'dsa-twoptr-var': 'Sliding window (variable)', 'dsa-twoptr-dutch': 'Dutch national flag', 'dsa-twoptr-water': 'Container with most water',
  // T2
  'dsa-bsearch-classic': 'Classic binary search', 'dsa-bsearch-ans': 'Binary search on answer', 'dsa-bsearch-bound': 'Lower / upper bound', 'dsa-bsearch-rotated': 'Rotated array search', 'dsa-bsearch-peak': 'Peak element',
  'dsa-recursion-basics': 'Recursion basics', 'dsa-recursion-subsets': 'Subsets / permutations', 'dsa-recursion-nqueens': 'N-Queens', 'dsa-recursion-sudoku': 'Sudoku solver', 'dsa-recursion-word': 'Word search',
  'dsa-divconq-merge': 'Merge sort paradigm', 'dsa-divconq-quick': 'Quick select', 'dsa-divconq-closest': 'Closest pair of points', 'dsa-divconq-matrix': 'Matrix multiplication', 'dsa-divconq-inv': 'Inversion count',
  'dsa-greedy-act': 'Activity selection', 'dsa-greedy-knap': 'Fractional knapsack', 'dsa-greedy-huff': 'Huffman coding', 'dsa-greedy-interval': 'Interval scheduling', 'dsa-greedy-job': 'Job sequencing',
  'dsa-numth-prime': 'Prime factorization', 'dsa-numth-euler': "Euler's totient", 'dsa-numth-inv': 'Modular inverse', 'dsa-numth-crt': 'Chinese remainder theorem', 'dsa-numth-flt': "Fermat's little theorem",
  // T3
  'dsa-linked-sq': 'Singly / doubly linked', 'dsa-linked-cycle': "Floyd's cycle detection", 'dsa-linked-merge': 'Merge sorted lists', 'dsa-linked-reverse': 'Reverse linked list', 'dsa-linked-lru': 'LRU cache',
  'dsa-bst-traversal': 'Tree traversals (DFS/BFS)', 'dsa-bst-height': 'Height & diameter', 'dsa-bst-ops': 'BST insert/delete/search', 'dsa-bst-lca': 'Lowest common ancestor', 'dsa-bst-balanced': 'Balanced BST',
  'dsa-heap-minmax': 'Min / max heap', 'dsa-heap-impl': 'Heapify', 'dsa-heap-kth': 'K-th largest element', 'dsa-heap-merge': 'Merge K sorted lists', 'dsa-heap-median': 'Median from stream',
  'dsa-graphtr-bfs': 'BFS traversal', 'dsa-graphtr-dfs': 'DFS traversal', 'dsa-graphtr-conn': 'Connected components', 'dsa-graphtr-bipartite': 'Bipartite check', 'dsa-graphtr-topo': 'Topological sort',
  'dsa-deque-ops': 'Deque operations', 'dsa-deque-max': 'Sliding window maximum', 'dsa-deque-monoq': 'Monotonic queue', 'dsa-deque-next': 'Next greater element', 'dsa-deque-stock': 'Stock span',
  // T4
  'dsa-dp-memo': 'Memoization', 'dsa-dp-tab': 'Tabulation', 'dsa-dp-01knap': '0/1 Knapsack', 'dsa-dp-lcs': 'Longest common subsequence', 'dsa-dp-lis': 'Longest increasing subsequence',
  'dsa-dp-grid-paths': 'Grid paths', 'dsa-dp-grid-min': 'Minimum path sum', 'dsa-dp-grid-unique': 'Unique paths', 'dsa-dp-grid-dungeon': 'Dungeon game', 'dsa-dp-grid-square': 'Maximal square',
  'dsa-dp-interval-mcm': 'Matrix chain multiplication', 'dsa-dp-interval-pal': 'Palindromic substrings', 'dsa-dp-interval-burst': 'Burst balloons', 'dsa-dp-interval-edit': 'Edit distance', 'dsa-dp-interval-egg': 'Egg drop',
  'dsa-shortest-dijkstra': "Dijkstra's algorithm", 'dsa-shortest-bellman': 'Bellman-Ford', 'dsa-shortest-floyd': 'Floyd-Warshall', 'dsa-shortest-01bfs': '0-1 BFS', 'dsa-shortest-bibfs': 'Bidirectional BFS',
  'dsa-mst-kruskal': "Kruskal's algorithm", 'dsa-mst-prim': "Prim's algorithm", 'dsa-mst-boruvka': "Borůvka's algorithm", 'dsa-mst-flow-intro': 'Min cut / max flow intro', 'dsa-mst-cycle': 'Cycle detection in graph',
  'dsa-dsu-quick': 'Quick find / union', 'dsa-dsu-rank': 'Union by rank', 'dsa-dsu-path': 'Path compression', 'dsa-dsu-cycle': 'Cycle detection', 'dsa-dsu-kruskal': "Kruskal's with DSU",
  // T5
  'dsa-seg-point': 'Point update range query', 'dsa-seg-range': 'Range update (lazy)', 'dsa-seg-fenwick': 'Fenwick tree (BIT)', 'dsa-seg-2d': '2D segment tree', 'dsa-seg-merge': 'Merge sort tree',
  'dsa-sparse-rmq': 'Sparse table RMQ', 'dsa-sparse-lca': 'Binary lifting LCA', 'dsa-sparse-euler': 'Euler tour technique', 'dsa-sparse-offline': 'Offline LCA (Tarjan)', 'dsa-sparse-hld': 'Heavy-Light Decomposition',
  'dsa-tries-basic': 'Trie insert/search', 'dsa-tries-prefix': 'Prefix search autocomplete', 'dsa-tries-wild': 'Wildcard matching', 'dsa-tries-lcp': 'Longest common prefix', 'dsa-tries-xor': 'XOR trie',
  'dsa-graph-art': 'Articulation points', 'dsa-graph-bridge': 'Bridges in graph', 'dsa-graph-scc': 'SCC (Kosaraju / Tarjan)', 'dsa-graph-euler': 'Euler path/circuit', 'dsa-graph-2sat': '2-SAT',
  'dsa-tree-dp-reroot': 'Tree DP (rerooting)', 'dsa-tree-dp-subtree': 'Subtree DP', 'dsa-tree-dp-knap': 'Tree knapsack', 'dsa-tree-dp-centroid': 'Centroid decomposition', 'dsa-tree-dp-hld': 'Heavy-Light Decomp.',
  'dsa-bitmask-tsp': 'Bitmask DP (TSP)', 'dsa-bitmask-profile': 'Profile DP', 'dsa-bitmask-digit': 'Digit DP basics', 'dsa-bitmask-count': 'Count with constraint', 'dsa-bitmask-broken': 'Broken profile DP',
  'dsa-comb-perm': 'Permutations & combinations', 'dsa-comb-pigeon': 'Pigeonhole principle', 'dsa-comb-inc-exc': 'Inclusion-exclusion', 'dsa-comb-exp': 'Expected value DP', 'dsa-comb-gen': 'Generating functions',
  'dsa-math-fft': 'FFT / NTT', 'dsa-math-matrix': 'Linear algebra / matrix exponentiation', 'dsa-math-game': 'Game theory (Sprague-Grundy)', 'dsa-math-prob': 'Probability theory', 'dsa-math-power': 'Formal power series',
  // T6
  'dsa-strings-kmp': 'KMP algorithm', 'dsa-strings-z': 'Z-algorithm', 'dsa-strings-roll': 'Rabin-Karp rolling hash', 'dsa-strings-aho': 'Aho-Corasick automaton', 'dsa-strings-suff': 'Suffix array & LCP',
  'dsa-dpopt-dc': 'Divide & conquer DP', 'dsa-dpopt-cht': 'Convex hull trick', 'dsa-dpopt-li': 'Li Chao tree', 'dsa-dpopt-knuth': "Knuth's optimization", 'dsa-dpopt-smawk': 'SMAWK algorithm',
  'dsa-flows-max': 'Max flow (Ford-Fulkerson)', 'dsa-flows-dinic': "Dinic's algorithm", 'dsa-flows-mcmf': 'Min-cost max-flow', 'dsa-flows-match': 'Bipartite matching', 'dsa-flows-hall': "Hall's theorem",
  'dsa-geo-convex': 'Convex hull', 'dsa-geo-intersect': 'Line intersection', 'dsa-geo-pointInPoly': 'Point in polygon', 'dsa-geo-calipers': 'Rotating calipers', 'dsa-geo-voronoi': 'Voronoi diagram basics',
  'dsa-sqrtd-block': 'Block decomposition', 'dsa-sqrtd-mo': "Mo's algorithm", 'dsa-sqrtd-3d': "Mo's 3D / offline", 'dsa-sqrtd-query': 'Sqrt on queries', 'dsa-sqrtd-bucket': 'Bucket DS',
  // T7
  'dsa-misc-meet': 'Meet in the middle', 'dsa-misc-parallel': 'Parallel binary search', 'dsa-misc-off-dc': 'Offline divide & conquer', 'dsa-misc-stl-merge': 'Small-to-large merging', 'dsa-misc-persist': 'Persistent DS',
  'dsa-master-strat': 'Contest strategy', 'dsa-master-time': 'Time management', 'dsa-master-cat': 'Problem categorization', 'dsa-master-debug': 'Debugging mindset', 'dsa-master-virtual': 'Virtual contests',
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
export const CP_TIER_LABELS = [
  'T0: Foundations',
  'T1: Core DS',
  'T2: Algorithms',
  'T3: Structures',
  'T4: DP + Graphs',
  'T5: Advanced',
  'T6: Expert',
  'T7: Master',
];

export const DSA_TIER_LABELS = [
  'T0: Foundations',
  'T1: Core DS',
  'T2: Algorithms I',
  'T3: Linear Structures',
  'T4: DP & Paths',
  'T5: Advanced DS',
  'T6: Expert',
  'T7: Mastery',
];

// ─── Helper: collect all trackable IDs ───
export function getAllTrackableIds(tree = CP_TREE) {
  const ids = [];
  for (const node of tree) {
    if (node.subs && node.subs.length > 0) {
      ids.push(...node.subs);
    } else {
      ids.push(node.id);
    }
  }
  return ids;
}
