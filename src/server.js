var watcher = require("./watcher");

function main() {
	var coinsToWatch = [
		// 'BTC-BTG',
		// 'BTC-BCC',
		// 'BTC-RDD',
		// 'BTC-LTC',
		// 'BTC-ETH',
		// 'BTC-XRP',
		// 'BTC-XMY',
		'BTC-EMC2'
	];

	console.log('initialisation de l\'analyse...\n');

	watcher.watchAll(coinsToWatch);

	process.on("SIGINT", () => {
		watcher.stopAll(coinsToWatch)
			.then(() => {
				console.log('!!!!!!!!!!!STOP!!!!!!!!!!!!!');
				process.exit(0);
			}, error => {
				console.error("error", error);
			});
	});
}

setTimeout(main, 1000);
