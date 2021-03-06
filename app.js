var pizzapi = require('dominos');

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
    //foster
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
    console.log("A pizza with " + result.result.Order.Products[0].descriptions[0].value);
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

// order.place(
//   function(result) {
//       console.log("-------");
//       console.log("Placed!");
//       console.log(JSON.stringify(result, null, 2));
//   }
// );

pizzapi.Util.findNearbyStores(
    fullAddress,
    'Delivery',
    pickStore
);

function pickStore(storeData) {
    if (storeData.success !== true) {
        console.log("Store not found!");
        return;
    }

    var closestInfo = storeData.result.Stores[0];
    var store = new pizzapi.Store({
        ID: closestInfo.StoreID
    });
    store.getFriendlyNames(
        function (menu) {
            if (menu.success) {
                for (var i = 0, l = menu.result.length; i < l; i++) {
                    var wrapper = menu.result[i];
                    var name = Object.keys(wrapper)[0];
                    var code = wrapper[name];
                    console.log(i, "-", name, "-", code);
                }
                console.log("done");
            }
        }
    );
}
