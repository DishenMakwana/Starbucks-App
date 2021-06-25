const express = require('express');
const homeController = require('../app/http/controllers/homeController');
const authController = require('../app/http/controllers/authController');
const cartController = require('../app/http/controllers/customers/cartController');
const orderController = require('../app/http/controllers/customers/orderController');
const adminOrderController = require('../app/http/controllers/admin/orderController');
const statusController = require('../app/http/controllers/admin/statusController');
const errorController = require('../App/http/controllers/errorController');
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const User = require('../app/models/user');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_ID,
            callbackURL: '/auth/google/redirect',
        },
        (accessToken, refreshToken, profile, done) => {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
                return done(err, user);
            });
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

// Middlewares
const guest = require('../app/http/middlewares/guest');
const isAuth = require('../app/http/middlewares/auth');
const admin = require('../app/http/middlewares/admin');

const route = express.Router();

route.get('/', homeController.homePage);

route.get('/login', guest.auth, authController.getLogin);
route.post('/login', authController.postLogin);
route.get('/logout', authController.postLogout);
route.post('/logout', authController.postLogout);
route.get('/register', guest.auth, authController.getRegister);
route.post('/register', authController.postRegister);

// google-auth routes
route.get(
    '/auth/google',
    guest.auth,
    passport.authenticate('google', {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'profile',
            'email',
        ],
    })
);
route.get(
    '/auth/google/redirect',
    passport.authenticate('google', { failureRedirect: '/login' }),
    authController.googleLogin
);

route.get('/cart', cartController.getCart);
route.post('/update-cart', cartController.updateCart);
route.post('/updateRemove-cart', cartController.updateRemoveCart);

// Customer routes
route.post('/orders', isAuth.auth, orderController.postOrder);
route.get('/customer/orders', isAuth.auth, orderController.getCustomerOrders);
route.get(
    '/customer/orders/:id',
    isAuth.auth,
    orderController.getStatusOfPizza
);

// Admin routes
route.get('/admin/orders', admin.auth, adminOrderController.getAdminOrders);
route.post(
    '/admin/order/status',
    admin.auth,
    statusController.postUpdateStatusAdmin
);

//errors
route.get('/errors/404', errorController.error404);

module.exports = route;
