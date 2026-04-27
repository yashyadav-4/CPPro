function getISTDate(dateInput) {
    const utcMs = new Date(dateInput ?? Date.now()).getTime();
    const istMs = utcMs + 5.5 * 60 * 60 * 1000;
    const d = new Date(istMs);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function getTodayIST() {
    return getISTDate(Date.now());
}

function getNDaysAgoIST(n) {
    return getISTDate(Date.now() - n * 24 * 60 * 60 * 1000);
}

module.exports = { getISTDate, getTodayIST, getNDaysAgoIST };
