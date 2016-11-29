var alexa = require('alexa-app');
var pizzapi = require('dominos');
var codes = require('./codes');

var app = new alexa.app('Pizza');

app.dictionary = {
    'quantity_s': ['{-|QUANTITY}', '{-|QUANTITY_WORD}'],
    'pizza_s': ['pizza', 'pizzas'],
    'party': ['rager', 'banger', 'party', 'get-together', 'celebration'],
    'party_verb': ['turn up', 'rage', 'get lit', 'have a good time'],
    'topping_s': ['{-|TOPPING}', '{-|TOPPING} and {-|TOPPING_B}', '{-|TOPPING} {-|TOPPING_B} and {-|TOPPING_C}'],
    'Gimme': ['I want', 'I need', 'Get me', 'Can I have', 'Can I get', 'Order me', 'I would like', 'May I please have', 'May it please the court to obtain']
};

// This object automatically gets filled in with session info before every intent
// Any changes to this object automatically get saved in the response
var session;
var SESSION_INFO = "session_info";
var DEFAULT_SESSION = {
    // Current state
    state: "start",
    // Current order details, stored as array of objects with quantity, size, topping
    order: [],
    // Used if they have less than 5 pizzas and we ask for toppings individually
    template: undefined,
    // Question we're asking the user
    prompt: "",
    // Last question we asked, for reprompting and if they say something unexpected
    last_prompt: "You can tell me what pizza you want or that you're having a party"
};

// Runs before every request
app.pre = function(request, response) {
    // Don't end sessions by default
    response.shouldEndSession(false);
    // Fill in some session info if the session is undefined
    session = request.session(SESSION_INFO) || JSON.parse(JSON.stringify(DEFAULT_SESSION));
    response.session(SESSION_INFO, session);
}

// Runs after every request, reprompt if reprompt message specified
app.post = function(request, response) {
    var prompt = session.prompt;
    if (prompt) {
        response.say(prompt).reprompt("Hey, " + prompt);
    }
    session.last_prompt = prompt;
    session.prompt = "";
}

app.sessionEnded(function(request, response) {
    console.log("Session ended");
});

// Possible states for the skill
// Each state corresponds to a time when the skill is waiting for user input
// Each state may allow multiple intents
var STATE_START = "start";
var STATE_PARTY_QTY = "partyQty";
var STATE_PIZZA_QTY = "pizzaQty";
var STATE_CONFIRM_PIZZA_QTY = "confirmPizzaQty";
var STATE_PIZZA_SIZE = "pizzaSize";
var STATE_PIZZA_TOPPING = "pizzaTopping";
var STATE_CONFIRM_TOPPING = "confirmTopping";
var STATE_ADD_MORE = "addMore";
var STATE_CONFIRM_CHECKOUT = "confirmCheckout";

// Intents defined
var START_INTENT = 'StartIntent';
var TEST_INTENT = 'TestIntent';
var USUAL_INTENT = 'TheUsualIntent';
var PARTY_INTENT = 'PartyIntent';
var GIMME_PIZZA_INTENT = 'GimmePizzaIntent';
var QUANTITY_INTENT = 'QuantityIntent';
var SIZE_INTENT = 'SizeIntent';
var TOPPING_INTENT = 'ToppingIntent';
var YES_INTENT = 'AMAZON.YesIntent';
var NO_INTENT = 'AMAZON.NoIntent';
var STOP_INTENT = 'AMAZON.StopIntent';

// Might wanna use at some point
// https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/implementing-the-built-in-intents
// AMAZON.CancelIntent
// AMAZON.HelpIntent
// AMAZON.RepeatIntent
// AMAZON.StartOverIntent

// Mapping from state name to state handler function
// State handlers must return RESULT_ASYNC, RESULT_BAD_INTENT, or undefined
var STATE_HANDLERS = {
    [STATE_START]: handleStart,
    [STATE_PARTY_QTY]: handlePartyQty,
    [STATE_PIZZA_QTY]: handlePizzaInfo,
    [STATE_CONFIRM_PIZZA_QTY]: handleConfirmPizzaQty,
    [STATE_PIZZA_SIZE]: handlePizzaInfo,
    [STATE_PIZZA_TOPPING]: handlePizzaInfo,
    [STATE_CONFIRM_TOPPING]: handleToppingConfirmation,
    [STATE_ADD_MORE]: handleAddMore,
    [STATE_CONFIRM_CHECKOUT]: handleConfirmCheckout,
};

var RESULT_ASYNC = "async";
var RESULT_BAD_INTENT = "wut";

// Routes intents to the current state handler
function router(request, response) {
    var intent = request.data.request.intent.name;
    console.log("Routed: " + session.state + ", " + intent);
    if (intent === STOP_INTENT) {
        response.say("Fine, bye").shouldEndSession(true);
        return;
    }
    // Call the appropriate state handler
    switch (STATE_HANDLERS[session.state](request, response, intent)) {
        case RESULT_BAD_INTENT:
            response.say("Hey, ");
            session.prompt = session.last_prompt;
            break;
        case RESULT_ASYNC:
            return false;
        default:
    }
}

function handleStart(request, response, intent) {
    switch (intent) {
        case TEST_INTENT:
            response.say("yo").say(" mama").say(" " + codes.lol);
            break;
        case PARTY_INTENT:
            session.state = handlePartyIntent(request, response);
            break;
        case GIMME_PIZZA_INTENT:
            var pizza = {};
            pizza = addQuantityToPizza(request, pizza);
            pizza = addSizeToPizza(request, pizza);
            pizza = addToppingsToPizza(request, pizza);

            session.state = getNextPizzaState(request, response, pizza);
            break;
        case USUAL_INTENT:
            orderUsual(function(description) {
                response.say("I ordered your favorite, " + description).send();
            });
            return RESULT_ASYNC;
        case START_INTENT:
        default:
            return RESULT_BAD_INTENT;
    }
}

function handlePartyQty(request, response, intent) {
    switch (intent) {
        case QUANTITY_INTENT:
            session.state = handlePartyIntent(request, response);
            break;
        default:
            return RESULT_BAD_INTENT;
    }
}

function handlePizzaInfo(request, response, intent) {
    var pizza = session.order.pop();
    switch (intent) {
        case QUANTITY_INTENT:
            pizza = addQuantityToPizza(request, pizza);
            break;
        case SIZE_INTENT:
            pizza = addSizeToPizza(request, pizza);
            break;
        case TOPPING_INTENT:
            pizza = addToppingsToPizza(request, pizza);
            break;
        default:
            session.order.push(pizza);
            return RESULT_BAD_INTENT;
    }
    session.state = getNextPizzaState(request, response, pizza);
}

function handleConfirmPizzaQty(request, response, intent) {
    var pizza = session.order.pop();
    switch (intent) {
        case YES_INTENT:
            response.say("Great! ");
            session.state = getNextPizzaState(request, response, pizza);
            break;
        case NO_INTENT:
            response.say("No problem, ");
            session.prompt = "how many pizzas do you want?";
            pizza.quantity = undefined;
            session.order.push(pizza);
            session.state = STATE_PIZZA_QTY;
            break;
        default:
            session.order.push(pizza);
            return RESULT_BAD_INTENT;
    }
}

function handleToppingConfirmation(request, response, intent) {
    var pizza = session.order.pop();
    switch (intent) {
        case YES_INTENT:
            session.order = createPartyOrder(pizza.quantity, pizza.size);
            session.state = finishOrder(response, pizza);
            break;
        case NO_INTENT:
            pizza.accepted_suggestion = false;
            session.state = getNextPizzaState(request, response, pizza);
            break;
        default:
            session.order.push(pizza);
            return RESULT_BAD_INTENT;
    }
}

function handleAddMore(request, response, intent) {
    switch (intent) {
        case YES_INTENT:
            response.say("Great, ");
            session.prompt = "what else do you want?";
            session.state = STATE_START;
            break;
        case NO_INTENT:
            checkout(request, response);
            return RESULT_ASYNC;
        default:
            return RESULT_BAD_INTENT;
    }
}

function handleConfirmCheckout(request, response, intent) {
    switch (intent) {
        case YES_INTENT:
            var order = createOrderFromPizzas(session.order);
            placeOrder(order, function(description) {
                response.say("Great, I ordered " + description + ". Enjoy!")
                    .shouldEndSession(true).send();
            });
            return RESULT_ASYNC;
        case NO_INTENT:
            session.state = STATE_START;
            response.say("Alright, well what would you like?");
            session.order = [];
            break;
        default:
            return RESULT_BAD_INTENT;
    }
}

// Default intent when a user starts the app with no utterance
// Ex. "Alexa, talk to Pizza", "Alexa, open Pizza", "Alexa, start Pizza"
app.launch(handleStart);

app.intent(START_INTENT, {
    'utterances': ["I'm hungry", "{Gimme} pizza"]
}, router);

app.intent(TEST_INTENT, {
    'utterances': ['hello world', 'say hello world', 'to say hello world']
}, router);

app.intent(USUAL_INTENT, {
    'utterances': ['{Gimme} the usual']
}, router);

app.intent(PARTY_INTENT, {
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
}, router);

// A fully-formed sentence requesting pizza with any or none of quantity, size, or toppings
app.intent(GIMME_PIZZA_INTENT, {
    'slots': { 'SIZE': 'PizzaSizes', 'TOPPING': 'PizzaToppings', 'TOPPING_B': 'PizzaToppings', 'TOPPING_C': 'PizzaToppings', 'QUANTITY': 'AMAZON.NUMBER', 'QUANTITY_WORD': 'QuantityWords' },
    'utterances': [
        '{Gimme} {quantity_s} {pizza_s}',
        '{Gimme} {quantity_s} {-|SIZE} {pizza_s}',
        '{Gimme} {quantity_s} {topping_s} {pizza_s}',
        '{Gimme} {quantity_s} {-|SIZE} {topping_s} {pizza_s}',
        '{Gimme} {quantity_s} {pizza_s} with {topping_s} ',
        '{Gimme} {quantity_s} {-|SIZE} {pizza_s} with {topping_s} ',
    ]
}, router);

// A quantity in response to a clarification prompt
app.intent(QUANTITY_INTENT, {
    'slots': { 'QUANTITY': 'AMAZON.NUMBER' },
    'utterances': [
        '{-|QUANTITY}',
    ]
}, router);

// A size in response to a clarification prompt
app.intent(SIZE_INTENT, {
    'slots': { 'SIZE': 'PizzaSizes' },
    'utterances': [
        '{-|SIZE}',
    ]
}, router);

// Toppings in response to a clarification prompt
app.intent(TOPPING_INTENT, {
    'slots': { 'TOPPING': 'PizzaToppings', 'TOPPING_B': 'PizzaToppings', 'TOPPING_C': 'PizzaToppings' },
    'utterances': [
        '{topping_s}',
    ]
}, router);

// User says yes
app.intent(YES_INTENT, {}, router);

// User says no
app.intent(NO_INTENT, {}, router);

// User says stop or shut up
app.intent(STOP_INTENT, {}, router);

function handlePartyIntent(request, response) {
    var numPeople = request.slot('QUANTITY');
    if (numPeople === undefined || numPeople === '?') {
        response.say("Awesome, ");
        session.prompt = "how many people are coming to your event?";
        return STATE_PARTY_QTY;
    }

    var pizza = calculatePartyPizzas(numPeople);
    response.say("Hmm, ");
    session.prompt = ["does", pizza.quantity, "medium pizza" + pizza.plural, "sound okay?"].join(' ');
    session.order = [pizza];
    return STATE_CONFIRM_PIZZA_QTY;
}

function createPartyOrder(numPizzas, size) {
    var numCheese = Math.ceil(numPizzas / 3);
    var numPepperoni = Math.round(numPizzas / 3);
    var numSausage = Math.floor(numPizzas / 3);

    var order = [];
    if (numCheese >= 1) {
        order.push({
            size: size,
            toppings: ["cheese"],
            quantity: numCheese
        });
    }
    if (numPepperoni >= 1) {
        order.push({
            size: size,
            toppings: ["pepperoni"],
            quantity: numPepperoni
        });
    }
    if (numSausage >= 1) {
        order.push({
            size: size,
            toppings: ["sausage"],
            quantity: numSausage
        });
    }
    return order;
}

function calculatePartyPizzas(numPeople) {
    console.log('Calculate Pizza Quantity');
    var numPizzas = Math.ceil(parseInt(numPeople) * 3 / 8);
    var pizza = { size: "medium" };
    return quantifyPizza(pizza, numPizzas);
}

// Augment a pizza object with quantity data from a request
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

    return quantifyPizza(pizza, pizzaCount);
}

// Augment a pizza object with a quantity
function quantifyPizza(pizza, n) {
    pizza.quantity = n;
    pizza.plural = n > 1 ? 's' : '';
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

// Given a pizza object and some input, figure out what to ask for next
function getNextPizzaState(request, response, pizza) {
    console.log('getNextPizzaState ' + JSON.stringify(session) + ", pizza:" + JSON.stringify(pizza));

    var newState;
    if (pizza.quantity === undefined) {
        newState = STATE_PIZZA_QTY;
        response.say("Sounds good, ");
        session.prompt = "how many pizzas do you want?";
    } else if (pizza.size === undefined) {
        newState = STATE_PIZZA_SIZE;
        response.say("Alright, ");
        session.prompt = "what size pizza" + pizza.plural + " do you want: small, medium, large, or extra large?";
    } else if (pizza.toppings === undefined) {
        if (pizza.quantity >= 5) {
            if (pizza.accepted_suggestion === false) {
                newState = STATE_PIZZA_TOPPING;

                response.say("No problem, ");
                session.prompt = "what toppings do you want on your pizzas?";
            } else {
                newState = STATE_CONFIRM_TOPPING;

                var cheese = Math.ceil(pizza.quantity / 3);
                var pepperoni = Math.round(pizza.quantity / 3);
                var sausage = Math.floor(pizza.quantity / 3);
                response.say(["That's a lot of pizza!", "I suggest getting",
                    cheese, "cheese pizzas",
                    pepperoni, "pepperoni pizzas", "and",
                    sausage, "sausage pizzas. "].join(' '));
                session.prompt = "do those toppings sound okay?";
            }
        } else {
            newState = STATE_PIZZA_TOPPING;

            // We haven't topped any pizzas yet
            pizza.need_toppings = 1;
            session.template = pizza;
            var t = session.template;
            pizza = { quantity: 1, size: pizza.size };

            var ordinal = "";
            if (t.need_toppings === 1 && t.quantity > 1) {
                ordinal = "first ";
            }
            session.prompt = "what toppings do you want on your " + ordinal + "pizza?";
        }
    } else if (session.template !== undefined) {
        var t = session.template;
        t.need_toppings++;
        session.order.push(pizza);
        if (t.need_toppings <= t.quantity) {
            pizza = { quantity: 1, size: pizza.size };
            newState = STATE_PIZZA_TOPPING;
            var ordinal = "";
            if (t.need_toppings === 4) {
                ordinal = "fourth ";
            } else if (t.need_toppings === 3) {
                ordinal = "third ";
            } else if (t.need_toppings === 2) {
                ordinal = "second ";
            }
            session.prompt = "what toppings do you want on your " + ordinal + "pizza?";
        } else {
            session.template = undefined;
            if (t.quantity > 1) {
                return finishOrder(response, t);
            } else {
                return finishOrder(response, pizza);
            }
        }
    } else {
        newState = finishOrder(response, pizza);
    }

    session.order.push(pizza);
    return newState;
}

function finishOrder(response, pizza) {
    if (pizza.toppings !== undefined && pizza.toppings.length) {
        response.say(["Okay, I'll add", pizza.quantity, pizza.size, joinAnd(pizza.toppings),
            "pizza" + pizza.plural, "to your order. "].join(' '));
    } else if (pizza.quantity > 1) {
        response.say(["Okay, I'll add those", pizza.quantity, pizza.size, "pizzas to your order. "].join(' '));
    } else {
        response.say(["Okay, I'll add that", pizza.size, "pizza with",
            joinAnd(pizza.toppings), "to your order. "].join(' '));
    }
    session.prompt = "do you want to add another pizza?";
    return STATE_ADD_MORE;
}

function checkout(request, response) {
    session.state = STATE_CONFIRM_CHECKOUT;

    var order = createOrderFromPizzas(session.order);
    priceOrder(order, function(price) {
        response.say("I found a coupon for 50% off your order. Your total is " + price + ". Should I go ahead and place your order?").send();
        response.reprompt('Should I go ahead and place your order?');
    });
}

function createOrderFromPizzas(pizzas) {
    var myCustomer = new pizzapi.Customer({
        address: new pizzapi.Address('2133 Sheridan Rd, Evanston, IL, 60201'),
        firstName: 'William',
        lastName: 'Xiao',
        phone: '8167164599',
        email: 'paep3nguin@gmail.com'
    });

    var order = new pizzapi.Order({
        customer: myCustomer,
        storeID: 9175, // Foster
        deliveryMethod: 'Delivery'
    });

    for (var i = 0, l = pizzas.length; i < l; i++) {
        var p = pizzas[i];
        var options = [];
        for (var j = 0, m = p.toppings.length; j < m; j++) {
            options.push(codes.topping[p.toppings[j]]);
        }

        console.log("Item " + JSON.stringify(p) + " options: " + options);
        order.addItem(new pizzapi.Item({
            code: codes.size[p.size],
            options: options,
            quantity: p.quantity
        }));
    }

    // 50% off!!!
    order.addCoupon(new pizzapi.Coupon({
        code: '9413',
        quantity: 1
    }));

    console.log("Created order" + JSON.stringify(order, null, 2));
    return order;
}

function priceOrder(order, callback) {
    order.price(function(result) {
        console.log(JSON.stringify(result, null, 2));
        callback(result.result.Order.Amounts.Payment);
    });
}

function placeOrder(order, callback) {
    // For debug purposes
    order.validate(function(result) {
        console.log(JSON.stringify(result, null, 2));
        callback(generateOrderDescription(result.result.Order));
    });

    // var cardNumber = '4100123422343234';

    // var cardInfo = new order.PaymentObject();
    // cardInfo.Amount = order.Amounts.Customer;
    // cardInfo.Number = cardNumber;
    // cardInfo.CardType = order.validateCC(cardNumber);
    // cardInfo.Expiration = '0115';//  01/15 just the numbers "01/15".replace(/\D/g,'');
    // cardInfo.SecurityCode = '777';
    // cardInfo.PostalCode = '90201'; // Billing Zipcode

    // order.Payments.push(cardInfo);

    // order.place(function (result) {
    //     console.log(JSON.stringify(result, null, 2));
    //     callback(generateOrderDescription(result.result.Order));
    // });
}

function orderUsual(callback) {
    var pizzas = [{
        size: 'medium',
        toppings: ['pepperoni', 'sausage'],
        quantity: 1,
    }, {
        size: 'medium',
        toppings: ['bacon', 'onions'],
        quantity: 1,
    }];
    var order = createOrderFromPizzas(pizzas);

    // Two medium 2-toppings for 5.99 each
    // order.addCoupon(new pizzapi.Coupon({
    //     code: '9193',
    //     quantity: 1
    // }));

    // order.price(function (result) {
    //     console.log("-------");
    //     console.log("Price!");
    //     console.log(JSON.stringify(result, null, 2));
    // });

    placeOrder(order, callback);
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
        toppings = toppings.replace('Robust Inspired Tomato Sauce', 'tomato sauce');
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
