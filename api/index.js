module.exports = (req, res) => {
    res.status(200).json({
        status: 'Aura API Proxy is running ✅',
        endpoints: {
            generate: '/api/generate'
        }
    });
};