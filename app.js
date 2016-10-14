var pizzapi = require('dominos');

var addr = new pizzapi.Address({
    Street: '2133 Sheridan Rd',
    City: 'Evanston',
    Region: 'IL',
    PostalCode: 60201
});

var madhav = new pizzapi.Customer(
    {
        firstName: 'Madhav',
        lastName: 'Ghei',
        address: addr,
        phone: '202-730-5851',
        email: 'madhavghei2018@u.northwestern.edu'
    }
);

var order = new pizzapi.Order({
    customer: madhav,
    deliveryMethod: 'Delivery'
});

pizzapi.Util.findNearbyStores(
    addr,
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
    order.storeID = closestInfo.ID;
    store.getFriendlyNames(
        function (menu) {
            if (menu.success === true) {
                for (var i = 0, l = menu.result.length; i < l; i++) {
                    var wrapper = menu.result[i];
                    var itemId = Object.keys(wrapper)[0];
                    var item = wrapper[itemId];
                    var name = item.Name;
                    console.log(i + " - " + name + " - " + item.Price);
                }
                console.log("done");
            }
        }
    );
    var pizza = new pizzapi.Item({
        code: "14SCEXTRAV",
        options: [""],
        quantity: 1
    });
    order.addItem(pizza);
    order.price(
        function (result) {
            console.log("Price!");
        }
    );
}