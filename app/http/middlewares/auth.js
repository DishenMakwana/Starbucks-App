exports.auth = (req, res, next) => {
    if (req.isAuthenticated()) {
        // console.log(req);
        return next();
    }
    return res.redirect('/');
};
