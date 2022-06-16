import * as express from 'express';

const ally = require('../lighthouse-config.json');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const app = express();
const { PORT = 3080 } = process.env;

function launchChromeAndRunLighthouse(url, opts, config = null) {
	return chromeLauncher
		.launch({ chromeFlags: opts.chromeFlags })
		.then((chrome) => {
			opts.port = chrome.port;
			return lighthouse(url, opts, config).then((results) => {
				// use results.lhr for the JS-consumable output
				// https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
				// use results.report for the HTML/JSON/CSV output as a string
				// use results.artifacts for the trace/screenshots/other specific case you need (rarer)
				return chrome.kill().then(() => results.lhr);
			});
		});
}

const opts = {
	chromeFlags: ['--headless', '--disable-gpu'],
};
// app.use(express.static(__dirname + '/build'))
// 	.use(express.json())
// 	.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.render('../pages/home.ejs', {
		title: 'Home',
	});
}).get('/test/:root/:page?', (req, res, next) => {
	console.log(req.params);
	const url = `${req.params.root}/${req.params.page || ''}`;
	if (url.startsWith('http')) {
		launchChromeAndRunLighthouse(url, opts, ally).then((results) => {
			// fs.readFile(jsonFile, (err, content) => {
			// 	if (err) return console.log(err);
			// 	const contentJSON = JSON.parse(content);
			// 	const dataObject = results.contentJSON.tests.push(results);

			// 	updateData(contentJSON);
			// });

			// app.appendChild(reportHtml);
			res.send(results.lhr);
		});
	} else {
		launchChromeAndRunLighthouse('https://' + url, opts, ally).then(
			(results) => {
				// fs.readFile(jsonFile, (err, content) => {
				// 	if (err) return console.log(err);
				// 	const contentJSON = JSON.parse(content);

				// 	contentJSON.tests.push(results);

				// 	updateData(contentJSON);
				// });
				res.send(results);
			}
		);
	}
});

if (require.main === module) {
	app.listen(PORT, () => {
		console.log('server started at http://localhost:' + PORT);
	});
}

export default app;
