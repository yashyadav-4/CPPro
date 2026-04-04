import { useState, useCallback, useMemo } from 'react';
import { TREE, getAllTrackableIds } from '../data/learningTreeData';

const STORAGE_KEY = 'cppro_tree_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* silently fail */ }
}

export function useLearningTree() {
  const [progress, setProgress] = useState(loadState);

  const getState = useCallback((id) => progress[id] || 0, [progress]);

  const toggleState = useCallback((id, targetValue) => {
    setProgress(prev => {
      const current = prev[id] || 0;
      const next = current === targetValue ? Math.max(0, targetValue - 1) : targetValue;
      const updated = { ...prev, [id]: next };
      if (next === 0) delete updated[id];
      saveState(updated);
      return updated;
    });
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const allIds = getAllTrackableIds();
    const total = allIds.length;
    const mastered = allIds.filter(id => (progress[id] || 0) === 3).length;
    const inProgress = allIds.filter(id => {
      const s = progress[id] || 0;
      return s > 0 && s < 3;
    }).length;
    const touched = allIds.filter(id => (progress[id] || 0) > 0).length;

    // Per-tier completion
    const tierCompletion = {};
    for (let t = 0; t <= 7; t++) {
      const tierNodes = TREE.filter(n => n.tier === t);
      const tierIds = [];
      for (const node of tierNodes) {
        if (node.subs && node.subs.length > 0) {
          tierIds.push(...node.subs);
        } else {
          tierIds.push(node.id);
        }
      }
      const tierTotal = tierIds.length;
      const tierDone = tierIds.filter(id => (progress[id] || 0) > 0).length;
      const tierMastered = tierIds.filter(id => (progress[id] || 0) === 3).length;
      tierCompletion[t] = {
        total: tierTotal,
        touched: tierDone,
        mastered: tierMastered,
        ratio: tierTotal > 0 ? tierDone / tierTotal : 0,
        masteryRatio: tierTotal > 0 ? tierMastered / tierTotal : 0,
      };
    }

    // Per-node (topic) completion
    const nodeCompletion = {};
    for (const node of TREE) {
      if (node.subs && node.subs.length > 0) {
        const subTotal = node.subs.length;
        const subTouched = node.subs.filter(id => (progress[id] || 0) > 0).length;
        const subMastered = node.subs.filter(id => (progress[id] || 0) === 3).length;
        nodeCompletion[node.id] = {
          total: subTotal,
          touched: subTouched,
          mastered: subMastered,
          ratio: subTouched / subTotal,
          masteryRatio: subMastered / subTotal,
          // Aggregate state: max state among all subs
          maxState: Math.max(0, ...node.subs.map(id => progress[id] || 0)),
          // Average state (for color blending)
          avgState: node.subs.reduce((s, id) => s + (progress[id] || 0), 0) / subTotal,
        };
      } else {
        const s = progress[node.id] || 0;
        nodeCompletion[node.id] = {
          total: 1, touched: s > 0 ? 1 : 0, mastered: s === 3 ? 1 : 0,
          ratio: s > 0 ? 1 : 0, masteryRatio: s === 3 ? 1 : 0,
          maxState: s, avgState: s,
        };
      }
    }

    return { total, mastered, inProgress, touched, tierCompletion, nodeCompletion };
  }, [progress]);

  return { progress, getState, toggleState, stats };
}
