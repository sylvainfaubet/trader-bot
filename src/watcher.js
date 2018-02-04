var bittrex = require('node.bittrex.api');
var moment = require('moment');

var dataset = require('./dataset');
var orderSystem = require('./orderSystem');
var calculator = require('./calcAndOrder');

var MAX_HISTORY = 30;
var history = {};

var intervals = {};
var orderBooksIntervals = {};

module.exports.watchAll = function (coinsToWatch) {
	console.log('les monnaies suivantes seront observées :');
	for (var index in coinsToWatch) {
		setTimeout(setWatchInterval, index * 1000, coinsToWatch[index], coinsToWatch.length);
	}
}

function setWatchInterval(coin, interval) {
	console.log(coin);
	intervals[coin] = setInterval(watchAndDecide, interval * 1000, coin);
	orderBooksIntervals[coin] = setInterval(dataset.refreshOrderBook, 20000, coin);
}

function watchAndDecide(coin) {
	bittrex.getticker({
		market: coin
	}, function (data, err) {
		if (err) {
			console.error("ERROR : watchAndDecide getticker", err);
			return;
		}
		var summary = data.result; //[data.result.length - 1];
		if (!!summary) {
			summary.TimeStamp = moment();

			if (!history[coin]) {
				history[coin] = [summary];
			}
			else {
				// console.log('maj de l\'historique', coin, history[coin].length);
				var coinHistory = history[coin];
				var last = coinHistory[coinHistory.length - 1];

				coinHistory.push(summary);

				if (coinHistory.length == MAX_HISTORY + 1) {
					coinHistory.shift();
				}
				calculator.calculateOrder(coin, coinHistory, orderSystem.getLastOrder(coin));
			}
		}
	});
}

module.exports.stopAll = function (coinsToWatch) {
	return new Promise(function (resolve, reject) {
		orderSystem.lockBuy(true);
		var sellsPromises = [];
		coinsToWatch.forEach(coin => {
			clearInterval(intervals[coin]);
			clearInterval(orderBooksIntervals[coin]);
			sellsPromises.push(orderSystem.sell(coin));
		});
		// console.log("sellsPromises", sellsPromises);
		Promise.all(sellsPromises)
			.then((responses) => {
				// console.log(responses);
				resolve();
			}, reject);
	});
}
