const Order = require('../../../models/order');
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

exports.postOrder = (req, res, next) => {
    // Validate request
    const { phone, address, stripeToken, paymentType } = req.body;
    if (!phone || !address) {
        return res.status(422).json({ message: 'All fields are required' });
    }

    const order = new Order({
        customerId: req.user._id,
        items: req.session.cart.items,
        phone,
        address,
    });

    order
        .save()
        .then((result) => {
            Order.populate(
                result,
                { path: 'customerId' },
                (err, placedOrder) => {
                    // Stripe payment
                    if (paymentType === 'card') {
                        stripe.charges
                            .create({
                                amount: req.session.cart.totalPrice * 100,
                                source: stripeToken,
                                currency: 'inr',
                                description: `Pizza order: ${placedOrder._id}`,
                            })
                            .then(() => {
                                placedOrder.paymentStatus = true;
                                placedOrder.paymentType = paymentType;
                                placedOrder
                                    .save()
                                    .then((ord) => {
                                        // Emit
                                        const eventEmitter =
                                            req.app.get('eventEmitter');
                                        eventEmitter.emit('orderPlaced', ord);
                                        delete req.session.cart;
                                        return res.json({
                                            message:
                                                'Payment successful, Order placed successfully',
                                        });
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    });
                            })
                            .catch((err) => {
                                console.log(err);
                                delete req.session.cart;
                                return res.json({
                                    message:
                                        'OrderPlaced but payment failed, You can pay at delivery time',
                                });
                            });
                    } else {
                        req.flash('success', 'Order placed successfully');
                        delete req.session.cart;
                        // Emit
                        const eventEmitter = req.app.get('eventEmitter');
                        eventEmitter.emit('orderPlaced', placedOrder);
                        return res.redirect('/customer/orders');
                    }
                }
            );
        })
        .catch((err) => {
            console.log(err);
            req.flash('error', 'Something went wrong');
            return res.redirect('/cart');
        });
};

exports.getCustomerOrders = async (req, res, next) => {
    const orders = await Order.find({ customerId: req.user._id }, null, {
        sort: { createdAt: -1 },
    });
    res.header(
        'Cache-Control',
        'no-cache,private,no-store,must-revalidate,pre-check=0,post-check=0,max-stale=0'
    );
    res.render('customers/orders', { orders: orders, moment: moment });
};

exports.getStatusOfPizza = async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    //auth of login user only can see there status
    if (req.user._id.toString() === order.customerId.toString()) {
        return res.render('customers/pizzaStatus', { order: order });
    }
    return res.redirect('/');
};
