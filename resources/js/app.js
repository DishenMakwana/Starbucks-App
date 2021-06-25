import axios from 'axios';
import Noty from 'noty';
import { initAdmin } from './admin';
import moment from 'moment';
import { initStripe } from './stripe';

let addToCart = document.querySelectorAll('.add-to-cart');
let cartRmv = document.querySelectorAll('.cartRmv');
let cartCounter = document.querySelector('#cartCounter');

function updateCart(pizza) {
    axios
        .post('/update-cart', pizza)
        .then((res) => {
            cartCounter.innerText = res.data.totalQty;
            new Noty({
                type: 'success',
                timeout: 1000,
                text: 'Item added to cart',
                progressBar: false,
            }).show();
        })
        .catch((err) => {
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Something went wrong',
                progressBar: false,
            }).show();
        });
}

addToCart.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let pizza = JSON.parse(btn.dataset.pizza);
        updateCart(pizza);
    });
});

let removeFromCart = (cartRemovedPizza) => {
    axios
        .post('/updateRemove-cart', cartRemovedPizza)
        .then((res) => {
            if (res.data.totalPrice == 0 || res.data.totalQty == 0) {
                location.href = '/cart';
            }
            // console.log(res.data.pqty);
            if (res.data.pqty == 0) {
                location.reload();
            }

            pizzaCounter.innerText = res.data.totalQty;
            let id = cartRemovedPizza.item._id;
            let id1 = document.getElementById(id);

            let id1child = id1.childNodes[0];
            id1child.nodeValue = res.data.pqty + ' pcs';
            let TotalPrice = document.getElementById('TotalPrice');
            TotalPrice.innerText = res.data.TotalPrice;
            let temp = 'TP' + id;
            let singlePizzaPrice = document.getElementById(temp);
            singlePizzaPrice.innerText = res.data.singlePizzaPrice;

            new Noty({
                type: 'success',
                timeout: 800,
                text: 'Item Removed from cart',
                progressBar: false,
                //layout:'topLeft'
            }).show();
        })
        .catch((err) => {
            console.log(err);
            new Noty({
                type: 'error',
                timeout: 1000,
                text: 'Something went wrong',
                progressBar: false,
            }).show();
        });
};
cartRmv.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let cartRemovePizza = JSON.parse(btn.dataset.pizzrmv);
        removeFromCart(cartRemovePizza);
    });
});

// Remove alert message after X seconds
const alertMsg = document.querySelector('#success-alert');
if (alertMsg) {
    setTimeout(() => {
        alertMsg.remove();
    }, 2000);
}

// Change order status
let statuses = document.querySelectorAll('.status_line');
let hiddenInput = document.querySelector('#hiddenInput');
let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);
let time = document.createElement('small');

function updateStatus(order) {
    statuses.forEach((status) => {
        status.classList.remove('step-completed');
        status.classList.remove('current');
    });
    let stepCompleted = true;
    statuses.forEach((status) => {
        let dataProp = status.dataset.status;
        if (stepCompleted) {
            status.classList.add('step-completed');
        }
        if (dataProp === order.status) {
            stepCompleted = false;
            time.innerText = moment(order.updatedAt).format('hh:mm A');
            status.appendChild(time);
            if (status.nextElementSibling) {
                status.nextElementSibling.classList.add('current');
            }
        }
    });
}

updateStatus(order);

initStripe();

// Socket
let socket = io();

// Join
if (order) {
    socket.emit('join', `order_${order._id}`);
}
let adminAreaPath = window.location.pathname;
if (adminAreaPath.includes('admin')) {
    initAdmin(socket);
    socket.emit('join', 'adminRoom');
}

socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order };
    updatedOrder.updatedAt = moment().format();
    updatedOrder.status = data.status;
    updateStatus(updatedOrder);
    new Noty({
        type: 'success',
        timeout: 1000,
        text: 'Order updated',
        progressBar: false,
    }).show();
});
