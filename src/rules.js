var tools = require('./tools');
var dataset = require('./dataset');
var bittrex = require('node.bittrex.api');
var moment = require('moment');

var coinsLocks = {};

var buyRules = [
	ruleNotLocked,
	isOrderBookForBuy
];

var sellRules = [
	isMaxGainDone,
	isMaxLossDone
];

// RULES
function isMaxGainDone(coin, coinHistory, lastOrder) {
	if (lastOrder !== undefined && coinHistory.length > 0 && lastOrder.sell === undefined) {
		var gain = tools.gain(parseFloat(lastOrder.buy.Ask), parseFloat(coinHistory[coinHistory.length - 1].Bid));
		var result = gain >= 4;
		if (result) {
			console.log('isMaxGainDone : ', coin);
			if (!!coinsLocks[coin]) {
				delete coinsLocks[coin];
			}
		}
		return result;
	}
	return false;
}

function isMaxLossDone(coin, coinHistory, lastOrder) {
	//console.log('isMaxLossDone', coin, coinHistory, lastOrder);
	if (lastOrder !== undefined && coinHistory.length > 0 && lastOrder.sell === undefined) {
		var gain = tools.gain(parseFloat(lastOrder.buy.Ask), parseFloat(coinHistory[coinHistory.length - 1].Bid));
		var result = gain <= -1;

		if (result) {
			console.log('isMaxLossDone : ', coin);
			coinsLocks[coin] = moment();
		}
		return result;
	}
	return false;
}

function isOrderBookForBuy(coin, coinHistory, lastOrder) {
	return new Promise((resolve, reject) => {
		// console.log('isOrderBookForBuy', coin, 'call');
		dataset.getOrderBook(coin)
			.then(orderBook => {
				// console.log('isOrderBookForBuy : ', coin, 'pass');
				var history = orderBook.calculatedHistory;
				var volumeGrowing = [];
				var lastVolume = Infinity;

				for (var i = history.length - 4 > 0 ? history.length - 4 : 0; i < history.length - 1; i++) {
					var item = history[i];
					volumeGrowing.push(item.totalVolume > lastVolume);
					lastVolume = item.totalVolume;
				}

				var volumeGrowingBool = volumeGrowing.length > 0 &&
					(volumeGrowing.reduce((b1, b2) => b1 + b2) > volumeGrowing.length * 0.7);

				if (volumeGrowing.length > 0) {
					console.log(volumeGrowing, volumeGrowing.reduce((b1, b2) => b1 + b2) > volumeGrowing.length * 0.5);
				}
				var item = history[history.length - 1];
				//	console.log('isOrderBookForBuy : item', item, 'volumeGrowing', volumeGrowingBool);
				var result = (item.sellVolume < (1 / 2) * item.buyVolume) && volumeGrowingBool;

				if (result) {
					console.log('isOrderBookForBuy : ', coin);
				}
				resolve(result);
			});
	});
}

function ruleNotLocked(coin, coinHistory, lastOrder) {
	return (!!coinsLocks[coin] && moment()
		.diff(coinsLocks[coin]) > 3600000) || !coinsLocks[coin];
}

// testing RULES
module.exports.isBuyRulesOk = function (coin, coinHistory, lastOrder) {
	return isAllRulesOk(buyRules, coin, coinHistory, lastOrder);
}

module.exports.isSellRulesOk = function (coin, coinHistory, lastOrder) {
	return isOneRulesOk(sellRules, coin, coinHistory, lastOrder);
}

function isOneRulesOk(rules, coin, coinHistory, lastOrder) {
	var allRules = rules.map(rule => rule(coin, coinHistory, lastOrder))
	return new Promise((resolve, reject) => {
		Promise.all(allRules)
			.then(responses => {
				if (responses.reduce((b1, b2) => b1 || b2)) {
					resolve();
				}
				else {
					reject();
				}
			}, reject);
	});
}

function isAllRulesOk(rules, coin, coinHistory, lastOrder) {
	var allRules = rules.map(rule => rule(coin, coinHistory, lastOrder))
	return new Promise((resolve, reject) => {
		Promise.all(allRules)
			.then(responses => {
				if (responses.reduce((b1, b2) => b1 && b2)) {
					resolve();
				}
				else {
					reject();
				}
			}, reject);
	});
}
