var pizzapi = require('dominos');


var fullAddress = new pizzapi.Address('1970 Campus Dr, Evanston, IL, 60201');
var myCustomer = new pizzapi.Customer(
  {
      address: fullAddress,
      firstName: 'Jeanette',
      lastName: 'Pranin',
      phone: '1-702-906-5906',
      email: 'jeanettepranin@gmail.com'
  }
);


var order = new pizzapi.Order(
  {
      customer: myCustomer,

      //foster
      storeID: 9175,

      deliveryMethod: 'Delivery'
  }
);

order.addItem(
  new pizzapi.Item(
      {
          code: '14SCREEN',
          options: [],
          quantity: 1
      }
  )
);

order.validate(
  function(result) {
      console.log("-------");
      console.log("We did it!");
      console.log(JSON.stringify(result, null, 2));

  }
);

order.price(
  function(result) {
      console.log("-------");
      console.log("Price!");
      console.log(JSON.stringify(result, null, 2));
  }
);

var cardNumber = '4100123422343234';

var cardInfo = new order.PaymentObject();
cardInfo.Amount = order.Amounts.Customer;
cardInfo.Number = cardNumber;
cardInfo.CardType = order.validateCC(cardNumber);
cardInfo.Expiration = '0115';//  01/15 just the numbers "01/15".replace(/\D/g,'');
cardInfo.SecurityCode = '777';
cardInfo.PostalCode = '90201'; // Billing Zipcode

order.Payments.push(cardInfo);

order.place(
  function(result) {
      console.log("-------");
      console.log("Order placed!");
      console.log(JSON.stringify(result, null, 2));
  }
);


//foster one is = '9175'
// pizzapi.Util.findNearbyStores(
//     '60201',
//     'Delivery',
//     function(storeData){
//         var stores = storeData.result.Stores;
//         for(var i = 0; i < stores.length; i++){
//             console.log(stores[i]);
//         }
//         // console.log(storeData);
//     }
// );



// var cardNumber = '4100123422343234';
// var cardInfo = new order.PaymentObject();
// cardInfo.Amount = order.Amounts.Customer;
// cardInfo.Number = cardNumber;
// cardInfo.CardType = order.validateCC(cardNumber);
// cardInfo.Expiration = '0115';//  01/15 just the numbers "01/15".replace(/\D/g,'');
// cardInfo.SecurityCode = '777';
// cardInfo.PostalCode = '90210'; // Billing Zipcode

// order.Payments.push(cardInfo);

// order.place(
//   function(result) {
//       console.log("Order placed!");
//   }
// );

// var pizzapi = require('dominos');
// var addr = new pizzapi.Address({
//     Street: '2133 Sheridan Rd',
//     City: 'Evanston',
//     Region: 'IL',
//     PostalCode: 60201
// });

// var madhav = new pizzapi.Customer(
//     {
//         firstName: 'Madhav',
//         lastName: 'Ghei',
//         address: addr,
//         phone: '202-730-5851',
//         email: 'madhavghei2018@u.northwestern.edu'
//     }
// );

// var order = new pizzapi.Order({
//     customer: madhav,
//     deliveryMethod: 'Delivery'
// });

// pizzapi.Util.findNearbyStores(
//     addr,
//     'Delivery',
//     pickStore
// );

// // Setup your Credit Card Info
// console.log("Setting up credit card info...")
// var cardInfo = new order.PaymentObject();
// cardInfo.Amount = order.Amounts.Customer;
// cardInfo.Number = "4100123422343234";
// cardInfo.CardType = order.validateCC("4100123422343234");
// cardInfo.Expiration = "0115"//  01/15 just the numbers "01/15".replace(/\D/g,'');
// cardInfo.SecurityCode = "777";
// cardInfo.PostalCode = "90210"; // Billing Zipcode

// console.log("Adding card to order...");
// order.Payments.push(cardInfo);

// function pickStore(storeData) {
//     if (storeData.success !== true) {
//         console.log("Store not found!");
//         return;
//     }

//     var closestInfo = storeData.result.Stores[0];
//     var store = new pizzapi.Store({
//         ID: 3302
//     });
//     order.storeID = closestInfo.ID;
//     store.getFriendlyNames(
//         function (menu) {
//             if (menu.success) {
//                 for (var i = 0, l = menu.result.length; i < l; i++) {
//                     var wrapper = menu.result[i];
//                     var itemId = menu.result[i][Object.keys(wrapper)];
//                     var item = Object.keys(wrapper);
//                     console.log(menu.result);
//                     // console.log(i + " - " + item + " - " + item.Price);
//                 }
//                 console.log("done");
//             }
//         }
//     );
// }
