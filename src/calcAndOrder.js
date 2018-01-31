var orderSystem = require('./orderSystem');
var rulesSystem = require('./rules');

module.exports.calculateOrder = testAndTrade;

function testAndTrade(coin, coinHistory, lastOrder) {
	//buy trade
	rulesSystem.isBuyRulesOk(coin, coinHistory, lastOrder)
		.then(result => {
			// console.log("mustBuy", result);
			orderSystem.buy(coin);
		}, error => {});

	// sell trade
	if (lastOrder !== undefined && lastOrder.sell === undefined) {
		rulesSystem.isSellRulesOk(coin, coinHistory, lastOrder)
			.then(result => {
				// console.log("mustSell", result);
				orderSystem.sell(coin);
			}, error => {});
	}
}
