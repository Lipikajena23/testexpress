const authenticateUser = (req, res, next) => {
    if (req.session && req.session.user) {
        console.log('session data', req.session);
        console.log('session username data', req.session.user);
        next();
    } else {
        res.status(401).json({error: 'Authentication failed ha ha' });

    }
};

export {authenticateUser};
