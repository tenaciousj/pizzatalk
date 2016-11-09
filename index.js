var alexa = require('alexa-app');
var pizzapi = require('dominos');

var app = new alexa.app('Pizza');
// Export a handler function for Lambda to work with
exports.handler = app.lambda();

var STATE_START = "start";
var STATE_CLARIFY = "clarify";
var STATE_CHECKOUT = "checkout";

app.dictionary = {
    'Gimme': ['I want', 'Get me', 'Can I have', 'Can I get', 'Order me', 'I would like', 'May I please have', 'May it please the court to obtain']
};

var yo = "yo mama";
var SESSION_INFO = "session_info";
var default_session = {
    state: STATE_START,
    order: []
};

app.launch(function (request, response) {
    // Do nothing on launch
    // In the future we can retrieve state here
    return false;
});

app.intent('TestIntent', {
    'utterances': ['hello world', 'say hello world', 'to say hello world']
}, function (request, response) {
    if (yo) {
        response.say(yo);
    } else {
        response.say("ugh");
    }
});

app.intent('StartIntent', {
    'utterances': ['Open pizza',
        'Start pizza']
}, function (request, response) {
    var session = request.session(SESSION_INFO) || default_session;
    response.say("Hello what would you like to order?");
});

app.intent('TheUsualIntent', {
    'utterances': ['{Gimme} the usual']
}, function (request, response) {
    console.log("Starting usual");
    orderUsual(function (pizza) {
        response.say("I ordered your favorite, " + pizza).send();
    });
    return false;
});

app.intent('GimmePizzaIntent', {
    'slots': { 'SIZE': 'PizzaSizes', 'TOPPING': 'PizzaToppings', 'QUANTITY': 'AMAZON.NUMBER' },
    'utterances': [
        '{Gimme} a pizza',
        '{Gimme} a {-|SIZE} pizza',
        '{Gimme} a {-|TOPPING} pizza',
        '{Gimme} {-|QUANTITY} pizzas',
        '{Gimme} {-|QUANTITY} {-|SIZE} pizzas',
        '{Gimme} {-|QUANTITY} {-|TOPPING} pizzas',
        '{Gimme} a {-|SIZE} {-|TOPPING} pizza',
        '{Gimme} {-|QUANTITY} {-|SIZE} {-|TOPPING} pizzas'
    ]
}, function (request, response) {
    var session = request.session(SESSION_INFO) || default_session;
    if (session.state !== STATE_START) {
        response.say("I thought we were ready, want to start over?").shouldEndSession(false);
        return;
    }
    var quantity = request.slot('QUANTITY');
    var size = request.slot('SIZE');
    var topping = request.slot('TOPPING');
    if (quantity === '?') {
        response.say("Sorry I don't understand, could you say that again?").shouldEndSession(false);
        return
    } else if (quantity === undefined) {
        quantity = 1;
    } else {
        quantity = parseInt(quantity);
    }

    var multiple = quantity > 1;

    if (size === undefined) {
        response.say("Got it, what size pizza" + (multiple ? 's' : '') + "  do you want?").shouldEndSession(false);
        session.state = STATE_CLARIFY;
        return;
    }

    if (topping === undefined) {
        response.say("Got it, what toppings do you want on your pizza" + (multiple ? 's' : '') + "?").shouldEndSession(false);
        session.state = STATE_CLARIFY;
        return;
    }

    if (size && topping && quantity) {
        response.say("K, I'll order you " + request.slot('QUANTITY') + " " + request.slot('SIZE') + " " + request.slot('TOPPING') + " pizzas");
    }

    // if(typeof quantity === undefined){
    // 	getQuantity(request, response);
    // } else if(typeof topping === undefined){
    // 	getTopping(request, response);
    // } else if(typeof size === undefined){
    // 	getSize(request, response);
    // } else {
    //     response.say("K, I'll order you " + request.slot('QUANTITY') + " " + request.slot('SIZE') + " " + request.slot('TOPPING') + " pizzas");
    // }

});

// function getQuantity(request, response){
// 	response.ask("How many pizzas would you like?");
// }

app.intent('QuantityIntent', {
    'slots': { 'QUANTITY': 'AMAZON.NUMBER' },
    'utterances': [
        '{-|QUANTITY}',
        '{Gimme} {-|QUANTITY} pizza'
    ]
}, function (request, response) {
    // getQuantity(request, response);
    var session = request.session(SESSION_INFO) || default_session;
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
        return;
    }

    response.say("Sure thing" + request.slot('QUANTITY'));
});

app.intent('SizeIntent', {
    'slots': { 'SIZE': 'PizzaSizes' },
    'utterances': [
        '{-|SIZE}',
        '{Gimme} a {-|SIZE} pizza'
    ]
}, function (request, response) {
    var session = request.session(SESSION_INFO) || default_session;
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
    }

    response.say("Sure thing" + request.slot('SIZE'));
});

app.intent('ToppingIntent', {
    'slots': { 'TOPPING': 'PizzaToppings' },
    'utterances': [
        '{-|TOPPING}',
        '{Gimme} {-|TOPPING}',
        '{Gimme} {-|TOPPING} and {-|TOPPING}',
        '{Gimme} {-|TOPPING}, {-|TOPPING} and {-|TOPPING}'
    ]
}, function (request, response) {
    var session = request.session(SESSION_INFO) || default_session;
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
    }

    response.say("Sure thing" + request.slot('TOPPING'));
});

console.log(app.schema());
console.log(app.utterances());

// orderUsual(function (pizza) {
//     console.log(pizza);
// });

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
        options: ["K", "O"],
        quantity: 21
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
        callback(generateOrderDescription(result.result.Order));
    });

    // order.price(function (result) {
    //     console.log("-------");
    //     console.log("Price!");
    //     console.log(JSON.stringify(result, null, 2));
    // });

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

function generateOrderDescription(order) {
    var products = [];
    for (var i = 0, l = order.Products.length; i < l; i++) {
        var product = order.Products[i];
        // Example Name: Medium (12") Hand Tossed Pizza
        var name = product.Name.replace('(', '').replace(')', '').replace('"', ' inch');
        var quantity = product.Qty;
        if (quantity === 1) {
            quantity = 'a';
        } else {
            name += 's';
        }
        var toppings = joinAnd(product.descriptions[0].value.split(', '));
        products.push(quantity + ' ' + name + ' with ' + toppings);
    }
    return joinAnd(products);
}

// Join a bunch of strings with commas + 'and' in the right place
// Ex. ['eggs'] -> "eggs"
// Ex. ['eggs', 'ham'] -> "eggs and ham"
// Ex. ['eggs', 'ham', 'bacon'] -> "eggs, ham, and bacon"
function joinAnd(strings) {
    if (strings.length === 1) {
        return strings;
    } else if (strings.length === 2) {
        return strings[0] + ' and ' + strings[1];
    }

    var joined = "";
    for (var i = 0, l = strings.length - 1; i < l; i++) {
        joined += strings[i] + ', ';
    }
    joined += 'and ' + strings[strings.length - 1];
    return joined;
}