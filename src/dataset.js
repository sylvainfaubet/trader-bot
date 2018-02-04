// libs
var bittrex = require('node.bittrex.api');
var moment = require('moment');

//datas
module.exports.history = {};
module.exports.orders = {};
module.exports.orderBooks = {};

//methods
module.exports.getOrderBook = function (coin) {
	//console.log('getOrderBook', coin, 'call');
	return new Promise((resolve, reject) => {
		if (module.exports.orderBooks[coin] !== undefined) {
			//console.log('getOrderBook', coin, 'allready', module.exports.orderBooks[coin]);
			resolve(module.exports.orderBooks[coin]);
		}
		else {
			//console.log('getOrderBook', coin, 'refreshOrderBook');
			module.exports.refreshOrderBook(coin)
				.then(orderBook => {
					//console.log('getOrderBook', coin, 'got');
					resolve(orderBook);
				}, reject);
		}
	});
}
var orderBooksPromises = {};
module.exports.refreshOrderBook = function (coin) {
	//console.log('request refreshOrderBook', coin);
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
								return parseFloat(rateBuy) * 0.75 < parseFloat(item.Rate);
							})
							.map(item => parseFloat(item.Rate) * parseFloat(item.Quantity))
							.reduce((a, b) => a + b),
						rateSell: rateSell,
						sellVolume: orderBook.sell.filter(item => {
								return parseFloat(rateSell) * 1.25 > parseFloat(item.Rate);
							})
							.map(item => parseFloat(item.Rate) * parseFloat(item.Quantity))
							.reduce((a, b) => a + b),
						TimeStamp: moment()
					}

					// if (history.buyVolume.length > 0) {
					// 	history.buyVolume = history.buyVolume.reduce((a, b) => a + b);
					// }
					// else {
					// 	history.buyVolume = 0;
					// }
					//
					// if (history.sellVolume.length > 0) {
					//
					// 	history.sellVolume = history.sellVolume.reduce((a, b) => a + b);
					// }
					// else {
					// 	history.sellVolume = 0;
					// }

					history.totalVolume = history.buyVolume + history.sellVolume;
					// console.log(history);
					orderBook.calculatedHistory.push(history);
					delete orderBooksPromises[coin];
					//console.log('response refreshOrderBook', coin, orderBook);
					resolve(orderBook);
				}
				else {
					delete orderBooksPromises[coin];
					console.error("ERROR : refreshOrderBook getorderbook", err);
					reject(err);
				}
			});
		});
		return orderBooksPromises[coin];
	}

}
