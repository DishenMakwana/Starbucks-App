exports.getCart = (req, res, next) => {
    res.render('customers/cart');
};

exports.updateCart = (req, res, next) => {
    // let cart = {
    //     items: {
    //         pizzaId: { item: pizzaObject, qty:0 },
    //         pizzaId: { item: pizzaObject, qty:0 },
    //         pizzaId: { item: pizzaObject, qty:0 },
    //     },
    //     totalQty: 0,
    //     totalPrice: 0
    // }
    // for the first time creating cart and adding basic object structure
    if (!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0,
        };
    }
    let cart = req.session.cart;

    // Check if item does not exist in cart
    if (!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
            item: req.body,
            qty: 1,
        };
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;
    } else {
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;
    }
    return res.json({ totalQty: req.session.cart.totalQty });
};

exports.updateRemoveCart = (req, res, next) => {
    let temp = req.session.cart.items[req.body.item._id];

    req.session.cart.totalQty = req.session.cart.totalQty - 1;
    temp.qty = temp.qty - 1;
    //   console.log(req.body.qty);
    req.session.cart.totalPrice =
        req.session.cart.totalPrice - req.body.item.price;
    if (temp.qty <= 0) {
        // console.log('deleted');
        delete req.session.cart.items[req.body.item._id];
        // location.reload();
    }
    if (req.session.cart.totalQty == 0 || req.session.cart.totalPrice == 0) {
        delete req.session.cart;

        return res.json({
            totalPrice: 0,
            totalQty: 0,
        });
    }

    return res.json({
        totalQty: req.session.cart.totalQty,
        pqty: temp.qty,
        TotalPrice: req.session.cart.totalPrice,
        singlePizzaPrice: temp.qty * temp.item.price,
    });
};
