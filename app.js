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
            if (menu.success) {
                for (var i = 0, l = menu.result.length; i < l; i++) {
                    var wrapper = menu.result[i];
                    var itemId = menu.result[i][Object.keys(wrapper)];
                    var item = Object.keys(wrapper);
                    // console.log(item);
                    //var item = wrapper[itemId];
                    //var name = item.Name;
                    console.log(i + " - " + item + " - " + item.Price);
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