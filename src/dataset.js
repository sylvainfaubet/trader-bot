// libs
var bittrex = require('node-bittrex-api');
var moment = require('moment');

//datas
module.exports.history = {};
module.exports.orders = {};
module.exports.orderBooks = {};

//methods
module.exports.getOrderBook = function (coin) {
	return new Promise((resolve, reject) => {
		if (module.exports.orderBooks[coin] !== undefined) {
			resolve(module.exports.orderBooks[coin]);
		}
		else {
			module.exports.refreshOrderBook(coin)
				.then(orderBook => {
					resolve(orderBook);
				}, reject);
		}
	});
}
var orderBooksPromises = {};
module.exports.refreshOrderBook = function (coin) {
	if (orderBooksPromises[coin] !== undefined) {
		return orderBooksPromises[coin];
	}
	else {
		orderBooksPromises[coin] = new Promise((resolve, reject) => {

			bittrex.getorderbook({
				market: coin,
				type: 'both'
			}, function (data, err) {
				if (!err) {
					var calculatedHistory = module.exports.orderBooks[coin] && module.exports.orderBooks[coin].calculatedHistory ? module.exports.orderBooks[coin].calculatedHistory : [];
					var orderBook = data.result;
					module.exports.orderBooks[coin] = orderBook;
					orderBook.calculatedHistory = calculatedHistory;

					// console.log("getorderbook", coin, orderBook);
					var rateBuy, rateSell;
					if (orderBook.buy.length > 0) {
						rateBuy = orderBook.buy[0].Rate;
					}
					if (orderBook.sell.length > 0) {
						var rateSell = orderBook.sell[0].Rate;
					}

					var history = {
						rateBuy: rateBuy,
						buyVolume: orderBook.buy.filter(item => {
								return parseFloat(rateBuy) * 0.8 < parseFloat(item.Rate);
							})
							.map(item => parseFloat(item.Rate) * parseFloat(item.Quantity))
							.reduce((a, b) => a + b),
						rateSell: rateSell,
						sellVolume: orderBook.sell.filter(item => {
								return parseFloat(rateSell) * 1.2 > parseFloat(item.Rate);
							})
							.map(item => parseFloat(item.Rate) * parseFloat(item.Quantity))
							.reduce((a, b) => a + b),
						TimeStamp: moment()
					}

					history.totalVolume = history.buyVolume + history.sellVolume;
					orderBook.calculatedHistory.push(history);
					delete orderBooksPromises[coin];
					resolve(orderBook);
				}
				else {
					delete orderBooksPromises[coin];
					console.log("refreshOrderBook getorderbook", err);
					reject(err);
				}
			});
		});
		return orderBooksPromises[coin];
	}

}
