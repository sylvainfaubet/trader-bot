module.exports.gain = function (buy, sell) {
	//console.log('buy', buy, 'sell', sell);
	return ((sell / buy) - 1) * 100
}
