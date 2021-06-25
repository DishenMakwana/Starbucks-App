const User = require('../../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const fs = require('fs');
const path = require('path');

const transport = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key:
                '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',
        },
    })
);

const _getRedirectUrl = (req) => {
    return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders';
};

exports.getLogin = (req, res, next) => {
    res.render('auth/login');
};

exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
        req.flash('error', 'All fields are required');
        return res.redirect('/login');
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            req.flash('error', info.message);
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                req.flash('error', info.message);
                return next(err);
            }
            req.flash('success', 'Logged in successfully');
            return res.redirect(_getRedirectUrl(req));
        });
    })(req, res, next);
};

exports.postLogout = (req, res, next) => {
    req.logout();
    return res.redirect('/login');
};

exports.getRegister = (req, res, next) => {
    res.render('auth/register');
};

exports.postRegister = async (req, res, next) => {
    const { name, email, password } = req.body;

    // Validate request
    if (!name || !email || !password) {
        req.flash('error', 'All fields are required');
        req.flash('name', name);
        req.flash('email', email);
        return res.redirect('/register');
    }

    // Check if email exists
    User.exists({ email: email }, (err, result) => {
        if (result) {
            req.flash('error', 'Email already taken');
            req.flash('name', name);
            req.flash('email', email);
            return res.redirect('/register');
        }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a user
    const user = new User({
        name,
        email,
        password: hashedPassword,
    });

    user.save()
        .then(() => {
            res.redirect('/login');
            const emailTemplate = fs.readFileSync(
                path.join(
                    __dirname,
                    '../../../public/email',
                    'register-template.html'
                ),
                { encoding: 'utf-8' }
            );
            // console.log(emailTemplate);
            transport.sendMail({
                to: email,
                from: 'DISHEN <dixpatel9175@gmail.com>',
                subject: 'Successfully Registered ..!',
                html: emailTemplate,
            });
        })
        .catch((err) => {
            console.log(err);
            req.flash('error', 'Something went wrong');
            return res.redirect('/register');
        });
};

exports.googleLogin = (req, res, next) => {
    return res.redirect(_getRedirectUrl(req));
};
