var alexa = require('alexa-app');
var pizzapi = require('dominos');
var codes = require('./codes');

var app = new alexa.app('Pizza');

var STATE_START = "start";
var STATE_PARTY = "party";
var STATE_CLARIFY = "clarify";
var STATE_ADD_MORE = "add more";
var STATE_CHECKOUT = "checkout";

app.dictionary = {
    'quantity_s': ['{-|QUANTITY}', '{-|QUANTITY_WORD}'],
    'pizza_s': ['pizza', 'pizzas'],
    'party': ['rager', 'banger', 'party', 'get-together', 'celebration'],
    'party_verb': ['turn up', 'rage', 'get lit', 'have a good time'],
    'topping_s': ['{-|TOPPING}', '{-|TOPPING} and {-|TOPPING_B}', '{-|TOPPING} {-|TOPPING_B} and {-|TOPPING_C}'],
    'Gimme': ['I want', 'I need', 'Get me', 'Can I have', 'Can I get', 'Order me', 'I would like', 'May I please have', 'May it please the court to obtain']
};

var SESSION_INFO = "session_info";
var DEFAULT_SESSION = {
    state: STATE_START,
    order: []
};

// This object automatically gets filled in with session info before every intent
// Any changes to this object automatically get saved in the response
var session;
app.pre = function (request, response, type) {
    // Don't end sessions by default
    response.shouldEndSession(false);
    // Fill in some session info if the session is undefined
    session = request.session(SESSION_INFO) || JSON.parse(JSON.stringify(DEFAULT_SESSION));
    response.session(SESSION_INFO, session);
}

app.sessionEnded(function (request, response) {
    console.log("Session ended");
});

// Might wanna use at some point
// https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/implementing-the-built-in-intents
// app.intent('AMAZON.CancelIntent');
// app.intent('AMAZON.HelpIntent');
// app.intent('AMAZON.RepeatIntent');
// app.intent('AMAZON.StartOverIntent');
// app.intent('AMAZON.StopIntent');

app.intent('TestIntent', {
    'utterances': ['hello world', 'say hello world', 'to say hello world']
}, function (request, response) {
    response.say("yo").say(" mama").say(" " + codes.lol);
});

// Default intent when a user starts the app with no utterance
// Ex. "Alexa, talk to Pizza", "Alexa, open Pizza", "Alexa, start Pizza"
app.launch(handleDefaultIntent);

app.intent('StartIntent', {
    'utterances': ["I'm hungry", "{Gimme} pizza"]
}, handleDefaultIntent);

function handleDefaultIntent(request, response) {
    console.log("DefaultIntent");
    response.say("What kind of pizza do you want?");
}

app.intent('AMAZON.StopIntent', {}, function (request, response) {
    console.log("StopIntent");
    response.say("Fine, bye").shouldEndSession(true);
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

app.intent('PartyIntent', {
    'slots': { 'QUANTITY': 'AMAZON.NUMBER' },
    'utterances': [
        "I'm having a {party}",
        "I'm throwing a {party}",
        "I'm trying to {party_verb}",
        "I'm having people over",
        "I'm having friends over",
        "It's gonna be lit in here",
        "How many pizzas should I get for a {party}",
        "How many pizzas should I get for a {party} of {-|QUANTITY}",
        "I'm having {-|QUANTITY} people over",
        "I'm having {-|QUANTITY} friends over",
        "{Gimme} {pizza_s} for {-|QUANTITY} people",
        "{Gimme} {pizza_s} for a {party} of {-|QUANTITY}",
    ]
}, function (request, response) {
    console.log('PartyIntent');
    var partySize = request.slot('QUANTITY');
    if (partSize === undefined) {
        response.say("How many pizzas do you want?");
    } else {

    }
    session.state = STATE_PARTY;
});

// A fully-formed sentence requesting pizza with any or none of quantity, size, or toppings
app.intent('GimmePizzaIntent', {
    'slots': { 'SIZE': 'PizzaSizes', 'TOPPING': 'PizzaToppings', 'TOPPING_B': 'PizzaToppings', 'TOPPING_C': 'PizzaToppings', 'QUANTITY': 'AMAZON.NUMBER', 'QUANTITY_WORD': 'QuantityWords' },
    'utterances': [
        '{Gimme} {quantity_s} {pizza_s}',
        '{Gimme} {quantity_s} {-|SIZE} {pizza_s}',
        '{Gimme} {quantity_s} {topping_s} {pizza_s}',
        '{Gimme} {quantity_s} {-|SIZE} {topping_s} {pizza_s}',
    ]
}, function (request, response) {
    console.log('GimmePizzaIntent');
    if (session.state === STATE_CLARIFY) {
        response.say("I thought we were ready, want to start over?");
        return;
    }

    var pizza = {};

    addQuantityToPizza(request, pizza);
    addSizeToPizza(request, pizza);
    addToppingsToPizza(request, pizza);

    handlePizzaInput(request, response, pizza);
});

// User says yes
app.intent('AMAZON.YesIntent', {}, function (request, response) {
    console.log('AMAZON.YesIntent');
    if (session.state === STATE_ADD_MORE) {
        response.say("Great, what else do you want?");
        session.state = STATE_START;
    }
});

// User says no
app.intent('AMAZON.NoIntent', {}, function (request, response) {
    console.log('AMAZON.NoIntent');
    if (session.state === STATE_ADD_MORE) {
        response.say("No problem");
        // TODO: start checkout flow here
    }
});

// A quantity in response to a clarification prompt
app.intent('QuantityIntent', {
    'slots': { 'QUANTITY': 'AMAZON.NUMBER' },
    'utterances': [
        '{-|QUANTITY}',
    ]
}, function (request, response) {
    console.log('QuantityIntent');
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
        return;
    }

    handlePizzaInput(request, response, addQuantityToPizza(request, {}));
});

// A size in response to a clarification prompt
app.intent('SizeIntent', {
    'slots': { 'SIZE': 'PizzaSizes' },
    'utterances': [
        '{-|SIZE}',
    ]
}, function (request, response) {
    console.log('SizeIntent');
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
        return;
    }

    handlePizzaInput(request, response, addSizeToPizza(request, {}));
});

// Toppings in response to a clarification prompt
app.intent('ToppingIntent', {
    'slots': { 'TOPPING': 'PizzaToppings', 'TOPPING_B': 'PizzaToppings', 'TOPPING_C': 'PizzaToppings' },
    'utterances': [
        '{topping_s}',
    ]
}, function (request, response) {
    console.log('ToppingIntent');
    if (session.state !== STATE_CLARIFY) {
        response.say("Wtf do you want");
        return;
    }

    handlePizzaInput(request, response, addToppingsToPizza(request, {}));
});

// TODO: Better error handling for unrecognizable quantities
// Augment a pizza object with quantity data
function addQuantityToPizza(request, pizza) {
    console.log("addQuantityToPizza");
    var quantity = request.slot('QUANTITY');

    var pizzaCount;

    if (quantity) {
        if (quantity === '?') {
            return pizza;
        } else {
            pizzaCount = parseInt(quantity);
        }
    } else {
        var quantityWord = request.slot('QUANTITY_WORD');
        if (quantityWord !== undefined) {
            if (quantityWord === "a") {
                pizzaCount = 1;
            } else {
                // Unable to determine number of pizzas
                return pizza;
            }
        }
    }

    pizza.quantity = pizzaCount;
    pizza.plural = pizzaCount > 1 ? 's' : '';

    return pizza;
}

// Augment a pizza object with a size
function addSizeToPizza(request, pizza) {
    console.log("addSizeToPizza");
    var size = request.slot('SIZE');
    if (size !== undefined) {
        pizza.size = size;
    }
    return pizza;
}

// Augment a pizza object with toppings
function addToppingsToPizza(request, pizza) {
    console.log('addToppingsToPizza');
    var toppingA = request.slot('TOPPING');
    var toppingB = request.slot('TOPPING_B');
    var toppingC = request.slot('TOPPING_C');
    if (toppingA !== undefined) {
        var toppings = [toppingA];
        if (toppingB !== undefined) {
            toppings.push(toppingB);
        }
        if (toppingC !== undefined) {
            toppings.push(toppingC);
        }
        pizza.toppings = toppings;
    }
    return pizza;
}

// Given a pizza object and a state, figure out what to ask for next
function handlePizzaInput(request, response, input) {
    console.log('handlePizzaInput ' + session.state);
    // TODO: use a more well-defined pizza object
    var pizza;
    if (session.state === STATE_START) {
        pizza = input;
    } else if (session.state === STATE_CLARIFY) {
        pizza = session.order.pop();
        Object.assign(pizza, input);
    }

    if (pizza.quantity === undefined) {
        session.state = STATE_CLARIFY;
        response.say("Sounds good, how many pizzas do you want?");
    } else if (pizza.size === undefined) {
        session.state = STATE_CLARIFY;
        response.say("Alright, what size pizza" + (pizza.plural ? 's' : '') + "  do you want: small, medium, large, or extra large?");
    } else if (pizza.toppings === undefined) {
        session.state = STATE_CLARIFY;
        response.say("Got it, what toppings do you want on your pizza" + (pizza.plural ? 's' : '') + "?");
    } else {
        session.state = STATE_ADD_MORE;
        response.say("K, I'll add " + pizza.quantity + " " + pizza.size + " "
            + joinAnd(pizza.toppings) + " pizza" + pizza.plural
            + " to your order. Do you want to add another pizza?");
    }

    session.order.push(pizza);
}

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

module.exports = {
    handler: app.lambda(),
    schema: app.schema(),
    utterances: app.utterances()
}
