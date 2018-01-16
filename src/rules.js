var tools = require('./tools');
var bittrex = require('node-bittrex-api');

// RULES
function isMaxGainDone(coin, coinHistory, lastOrder) {
	if (lastOrder !== undefined && coinHistory.length > 0 && lastOrder.sell === undefined) {
		var gain = tools.gain(lastOrder.buy.Ask, parseFloat(coinHistory[coinHistory.length - 1].Bid));
		var result = gain >= 4;
		if (result) {
			console.log('isMaxGainDone : ', coin);
		}
		return result;
	}
	return false;
}

function isMaxLossDone(coin, coinHistory, lastOrder) {
	if (lastOrder !== undefined && coinHistory.length > 0 && lastOrder.sell === undefined) {
		var gain = tools.gain(lastOrder.buy.Ask, parseFloat(coinHistory[coinHistory.length - 1].Bid));
		var result = gain <= -1;

		if (result) {
			console.log('isMaxLossDone : ', coin);
		}
		return result;
	}
	return false;
}

function isOrderBookForBuy(coin, coinHistory, lastOrder) {
	return new Promise((resolve, reject) => {
		dataset.getOrderBook(coin)
			.then(orderBook => {
				var history = orderBook.calculatedHistory;
				var volumeGrowing = [];
				var lastVolume = Infinity;
				for (var i = 0; i < history.length - 1; i++) {
					var item = history[i];
					volumeGrowing.push(item.totalVolume > lastVolume);
					lastVolume = item.totalVolume;
				}
				var item = history[history.length - 1];
				var result = (item.sellVolume < (1/2) * item.buyVolume) &&
					(volumeGrowing.reduce((b1, b2) => b1 + b2) > volumeGrowing.length * 0.8);

				if (result) {
					console.log('isOrderBookForBuy : ', coin);
				}
				resolve(result);
			});
	});
}

module.exports.getBuyRules = function(){
  var buyRules = [
		isOrderBookForBuy
	];
  return buyRules;
}

module.exports.getSellRules = function(){
  var sellRules = [
    isMaxGainDone,
    isMaxLossDone
	];
  return sellRules;
}

// testing RULES
module.exports.isOneRulesOk = isOneRulesOk;
function isOneRulesOk(rules, coin, coinHistory, lastOrder) {
  var allRules = rules.map(rule => rule(coin, coinHistory, lastOrder))
  return new Promise((resolve, reject) => {
    Promise.all(allRules)
    .then(responses => {
      resolve(responses.reduce((b1, b2) => b1 || b2));
    }, reject);
  });
}

module.exports.isAllRulesOk = isAllRulesOk;
function isAllRulesOk(rules, coin, coinHistory, lastOrder) {
  var allRules = rules.map(rule => rule(coin, coinHistory, lastOrder))
  return new Promise((resolve, reject) => {
    Promise.all(allRules)
    .then(responses => {
      resolve(responses.reduce((b1, b2) => b1 && b2));
    }, reject);
  });
}
