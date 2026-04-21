import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { CP_TREE, getAllTrackableIds } from '../data/learningTreeData';

export function useLearningTree(activeTree = CP_TREE) {
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from the new backend on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data } = await axios.get('/api/learning/progress', { withCredentials: true });
        if (data && data.progress) {
          setProgress(data.progress);
        }
      } catch (err) {
        console.error('Failed to fetch learning progress:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const getState = useCallback((id) => progress[id] || 0, [progress]);

  const toggleState = useCallback(async (id, targetValue) => {
    // 1. Calculate the new state local update
    const currentStatus = progress[id] || 0;
    const nextStatus = currentStatus === targetValue ? Math.max(0, targetValue - 1) : targetValue;

    // 2. Perform optimistic update locally
    setProgress(prev => {
      const updated = { ...prev, [id]: nextStatus };
      if (nextStatus === 0) delete updated[id];
      return updated;
    });

    // 3. Push to backend
    try {
      await axios.patch('/api/learning/progress', 
        { topicId: id, status: nextStatus }, 
        { withCredentials: true }
      );
    } catch (err) {
      console.error('Failed to save learning progress:', err);
    }
  }, [progress]);

  // Compute stats based on the active tree
  const stats = useMemo(() => {
    const allIds = getAllTrackableIds(activeTree);
    const total = allIds.length;
    const mastered = allIds.filter(id => (progress[id] || 0) === 3).length;
    const inProgress = allIds.filter(id => {
      const s = progress[id] || 0;
      return s > 0 && s < 3;
    }).length;
    const touched = allIds.filter(id => (progress[id] || 0) > 0).length;

    // Per-tier completion using activeTree
    const tierCompletion = {};
    for (let t = 0; t <= 7; t++) {
      const tierNodes = activeTree.filter(n => n.tier === t);
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
    for (const node of activeTree) {
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
  }, [progress, activeTree]);

  return { progress, getState, toggleState, stats, isLoading };
}
