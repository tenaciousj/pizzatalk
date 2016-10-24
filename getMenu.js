var pizzapi = require('dominos');
var fullAddress = new pizzapi.Address('2133 Sheridan Rd, Evanston, IL, 60201');

pizzapi.Util.findNearbyStores(
    fullAddress,
    'Delivery',
    pickStore
);

var dict = {};

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
                    dict[name] = code;
                }
                console.log("done");
                console.log(dict);
            }
        }
    );
}