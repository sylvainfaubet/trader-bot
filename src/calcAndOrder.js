var orderSystem = require('./orderSystem');
var dataset = require('./dataset');
var rulesSystem = require('./rules');

var TI = require('technicalindicators');

var bollinger = {};

module.exports.calculateOrder = function (coin, coinHistory, lastOrder) {
	// console.log('calculateOrder', coin, coinHistory.length, lastOrder);
	dataset.history[coin] = coinHistory;

	bollinger[coin] = TI.BollingerBands.calculate({
		period: 20,
		values: coinHistory.map(item => item.Ask),
		stdDev: 2
	});

	testAndTrade(coin, coinHistory, lastOrder);
}

function testAndTrade(coin, coinHistory, lastOrder) {
	//buy trade
	rulesSystem.isOneRulesOk(rulesSystem.getBuyRules())
		.then(result => {
			if (result) {
				// console.log("mustBuy", result);
				orderSystem.buy(coin);
			}
		});

	// sell trade
	if (lastOrder !== undefined && lastOrder.sell === undefined) {
		rulesSystem.isOneRulesOk(rulesSystem.getSellRules())
			.then(result => {
				if (result) {
					// console.log("mustSell", result);
					orderSystem.sell(coin);
				}
			});
	}
}
