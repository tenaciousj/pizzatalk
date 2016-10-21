var alexa = require('alexa-app');
var pizzapi = require('dominos');

var app = new alexa.app('Pizza');

app.launch(function (request, response) {
    // Do nothing on launch
    // In the future we can retrieve state here
    return false;
});

app.intent('TestIntent', {},
    function (request, response) {
        response.say("Hello team pizza.");
    });

app.intent('TheUsual', {},
    function (request, response) {
        console.log("Starting usual");
        orderUsual(function (pizza) {
            response.say("I ordered your favorite, a pizza with " + pizza).send();
        });
        return false;
    });

// Export a handler function for Lambda to work with
exports.handler = app.lambda();

function orderUsual(callback) {
    var fullAddress = new pizzapi.Address('2133 Sheridan Rd, Evanston, IL, 60201');
    var myCustomer = new pizzapi.Customer({
        address: fullAddress,
        firstName: 'William',
        lastName: 'Xiao',
        phone: '8167164599',
        email: 'paep3nguin@gmail.com'
    });

    var order = new pizzapi.Order({
        customer: myCustomer,
        // Foster
        storeID: 9175,
        deliveryMethod: 'Delivery'
    });

    order.addItem(new pizzapi.Item({
        code: '12SCREEN',
        options: ["P", "S"],
        quantity: 1
    }));

    order.addItem(new pizzapi.Item({
        code: '12SCREEN',
        options: ["B", "O"],
        quantity: 1
    }));

    // Two medium 2-toppings for 5.99 each
    order.addCoupon(new pizzapi.Coupon({
        code: '9193',
        quantity: 1
    }));

    order.validate(function (result) {
        console.log("-------");
        console.log("We did it!");
        console.log(JSON.stringify(result, null, 2));
    });

    order.price(function (result) {
        console.log("-------");
        console.log("Price!");
        console.log(JSON.stringify(result, null, 2));
        // callback(result.result.Order.Products[0].descriptions[0].value);
    });

    var cardNumber = '4100123422343234';

    var cardInfo = new order.PaymentObject();
    cardInfo.Amount = order.Amounts.Customer;
    cardInfo.Number = cardNumber;
    cardInfo.CardType = order.validateCC(cardNumber);
    cardInfo.Expiration = '0115';//  01/15 just the numbers "01/15".replace(/\D/g,'');
    cardInfo.SecurityCode = '777';
    cardInfo.PostalCode = '90201'; // Billing Zipcode

    order.Payments.push(cardInfo);

    // order.place(function (result) {
    //     console.log("-------");
    //     console.log("Placed!");
    //     console.log(JSON.stringify(result, null, 2));
    //     callback(result.result.Order.Products[0].descriptions[0].value);
    // });
}