module.exports.gain = function (buy, sell) {
	return ((sell / buy) - 1) * 100
}
