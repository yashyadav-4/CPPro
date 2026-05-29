const { generateOrFetchDailyTopic } = require('../Services/dailyTopicService');
const ErrorLog = require('../Model/ErrorLog');
const User = require('../Model/User');

async function getDailyTopic(req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId, 'preferences').lean();
        const language = user?.preferences?.preferredLanguage || 'cpp';
        const data   = await generateOrFetchDailyTopic(userId, language);

        return res.status(200).json({
            success: true,
            data: {
                date:    data.date,
                topic:   data.topic,
                content: data.content,
                language: language,
            },
        });
    } catch (err) {
        console.error('[DailyTopic] getDailyTopic error:', err.message);
        ErrorLog.create({ source: 'DailyTopic', level: 'error', message: err.message }).catch(() => {});
        return res.status(500).json({
            success: false,
            message: 'Unable to generate your daily topic right now. Please try again later.',
        });
    }
}

module.exports = { getDailyTopic };
