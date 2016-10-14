var express = require('express');
var pizzapi = require('dominos');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// // views is directory for all template files
// app.set('views', __dirname + '/views');
// app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  console.log('---------');
  console.log('Home Page');
  console.log('---------');
});

app.get('/pizzaInfo', function(request, response) {
	pizzapi.Util.findNearbyStores(
	  '2146 Sherman Ave Apt. GC, Evanston, IL, 60201',
	  'Delivery',
	  function(storeData){
	  	var stores = storeData.result.Stores;
	  	console.log(stores);  
	  }
	);
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


