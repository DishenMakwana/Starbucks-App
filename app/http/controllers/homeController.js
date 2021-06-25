const Menu = require('../../models/menu');

exports.homePage = async (req, res, next) => {
    const pizzas = await Menu.find();
    return res.render('home', { pizzas: pizzas });
};
