const LearningProgress = require('../Model/LearningProgress');
const ProgressHistory = require('../Model/ProgressHistory');

const recomputeStats = (progressMap) => {
  let mastered = 0, implemented = 0, theory = 0;
  for (const [, status] of progressMap.entries()) {
    if (status === 3) mastered++;
    else if (status === 2) implemented++;
    else if (status === 1) theory++;
  }
  return { mastered, implemented, theory };
};

const getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    let doc = await LearningProgress.findOne({ userId });

    if (!doc) {
      doc = await LearningProgress.create({ userId, progress: {} });
    }

    const progressObj = {};
    if (doc.progress) {
      for (const [key, val] of doc.progress.entries()) {
        progressObj[key] = val;
      }
    }

    return res.json({
      progress: progressObj,
      stats: {
        mastered: doc.totalMastered,
        implemented: doc.totalImplemented,
        theory: doc.totalTheory
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { topicId, status } = req.body;

    let doc = await LearningProgress.findOne({ userId });
    
    let previousStatus = 0;
    if (doc) {
      previousStatus = doc.progress.get(topicId) || 0;
    } else {
      doc = new LearningProgress({ userId, progress: {} });
    }

    if (status === 0) {
      doc.progress.delete(topicId);
    } else {
      doc.progress.set(topicId, status);
    }

    const { mastered, implemented, theory } = recomputeStats(doc.progress);
    doc.totalMastered = mastered;
    doc.totalImplemented = implemented;
    doc.totalTheory = theory;

    doc.markModified('progress');
    await doc.save();

    // Fire-and-forget History Write
    ProgressHistory.create({
      userId,
      topicId,
      previousStatus,
      newStatus: status
    }).catch(() => {});

    const progressObj = {};
    if (doc.progress) {
      for (const [key, val] of doc.progress.entries()) {
        progressObj[key] = val;
      }
    }

    return res.json({
      progress: progressObj,
      stats: {
        mastered: doc.totalMastered,
        implemented: doc.totalImplemented,
        theory: doc.totalTheory
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 100;
    
    const history = await ProgressHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
      
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const bulkUpdateProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body; // Array of { topicId, status }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Body must be an array of updates' });
    }

    let doc = await LearningProgress.findOne({ userId });
    if (!doc) {
      doc = new LearningProgress({ userId, progress: {} });
    }

    const historyPayloads = [];

    for (const update of updates) {
      const { topicId, status } = update;
      const previousStatus = doc.progress.get(topicId) || 0;
      
      if (status === 0) {
        doc.progress.delete(topicId);
      } else {
        doc.progress.set(topicId, status);
      }
      
      historyPayloads.push({
        userId,
        topicId,
        previousStatus,
        newStatus: status
      });
    }

    const { mastered, implemented, theory } = recomputeStats(doc.progress);
    doc.totalMastered = mastered;
    doc.totalImplemented = implemented;
    doc.totalTheory = theory;

    doc.markModified('progress');
    await doc.save();

    // Fire-and-forget History Writes
    if (historyPayloads.length > 0) {
       ProgressHistory.insertMany(historyPayloads).catch(() => {});
    }

    const progressObj = {};
    if (doc.progress) {
      for (const [key, val] of doc.progress.entries()) {
        progressObj[key] = val;
      }
    }

    return res.json({
      progress: progressObj,
      stats: {
        mastered: doc.totalMastered,
        implemented: doc.totalImplemented,
        theory: doc.totalTheory
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getProgress,
  updateProgress,
  getHistory,
  bulkUpdateProgress
};
