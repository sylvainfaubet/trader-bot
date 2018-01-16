var bittrex = require('node-bittrex-api');
var moment = require('moment');
var fs = require('fs');

var tools = require('./tools');
var dataset = require('./dataset');

var isOrderPlaying = {};
var isOrderSelling = {};
var orders = dataset.orders;
var locked = false;

fs.writeFile('orders.csv', 'COIN;BUY_VALUE;BUY_TIMESTAMP;SELL_VALUE;SELL_TIMESTAMP;GAIN\r\n',
	function (err) {
		if (err) throw err;
		console.log('initialisation fichier de résultats.');
	});

module.exports.lockBuy = function (lock) {
	locked = lock;
}

module.exports.buy = function (coin) {
	return new Promise((resolve, reject) => {
		var orderList = getOrders(coin);
		var last = getLastOrder(coin);
		if ((!last || !!last.sell) && !isOrderPlaying[coin] && !locked) {
			console.log('-----------------------------------------> achat', coin);
			isOrderPlaying[coin] = true;
			bittrex.getmarketsummary({
				market: coin
			}, (data, err) => {
				if (err) {
					console.log("buy error", err);
					reject(err);
					isOrderPlaying[coin] = false;
				}
				else {
					var summary = data.result[data.result.length - 1];
					summary.TimeStamp = moment();
					orderList.push({
						buy: summary
					});
					isOrderPlaying[coin] = false;
					console.log(coin, 'acheté au prix', summary.Ask);
					resolve();
				}
			});
		}
		else {
			resolve();
		}
	})
};

module.exports.sell = function (coin) {
	return new Promise((resolve, reject) => {
		var last = getLastOrder(coin);
		// console.log("last", last);

		if (!!last && !last.sell && !isOrderSelling[coin]) {
			console.log('-------------------------------------------> vente', coin);
			isOrderSelling[coin] = true;
			bittrex.getmarketsummary({
				Market: coin
			}, (data, err) => {
				if (err) {
					console.log("sell error", err);
					isOrderSelling[coin] = false;
					reject(err);
				}
				else {
					last.sell = data.result[data.result.length - 1];
					last.sell.TimeStamp = moment();
					isOrderSelling[coin] = false;
					logOrder(last)
						.then(() => {
							// console.log("sold", coin);
							resolve(last);
						});
				}
			})
		}
		else {
			resolve();
		}
	});
};

module.exports.getLastOrder = getLastOrder;
function getLastOrder(coin) {
	var orderList = getOrders(coin);
	return orderList[orderList.length - 1] || undefined;
};

function getOrders(coin) {
	if (!coin) {
		return orders;
	}
	else {
		orders[coin] = orders[coin] || [];
		return orders[coin];
	}
}

function logOrder(order) {
	return new Promise((resolve, reject) => {

		if (!order.results) {
			calculate(order);
		}

		console.log(
			order.buy.MarketName,
			"vendu :",
			order.results.sellValue,
			", acheté :",
			order.results.buyValue,
			", gain :", order.results.gain,
			"%, temps :",
			order.results.sellMoment
			.diff(order.results.buyMoment) / 1000,
			'secondes');
		fs.appendFile('orders.csv', order.buy.MarketName +
			";" +
			order.results.buyValue +
			";" +
			order.results.buyMoment.toJSON() +
			";" +
			order.results.sellValue +
			";" +
			order.results.sellMoment.toJSON() +
			";" +
			order.results.gain + "\r\n",
			function (err) {
				if (err) {
					console.log("logOrder fs.appendFile", err);
					reject();
				}
				console.log('Saved!');
				resolve();
			});
	});

}

function calculate(order) {
	order.results = {
		buyValue: order.buy.Ask,
		buyMoment: moment(order.buy.TimeStamp),
		sellValue: order.sell.Bid,
		sellMoment: moment(order.sell.TimeStamp),
		gain: tools.gain(order.buy.Ask, order.sell.Bid)
	};
}
