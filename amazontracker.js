process.env["NTBA_FIX_319"] = 1;
process.env["NTBA_FIX_350"] = 1;

process.on('uncaughtException', function (error) {
	console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");
});

process.on('unhandledRejection', function (error, p) {
	console.log("\x1b[31m","Error: ", error.message, "\x1b[0m");
});

var config = require('./config.js');
var TelegramBot = require('node-telegram-bot-api');
var express = require('express');
var http = require('http');
var https = require('https');
var axios = require('axios');
var fs = require('fs');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var mysql_sync = require('sync-mysql');

console.log('Connecting bot...');

var token = config.amazontoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/amazontracker/bot" + token;
var port = 25013;

bot.setWebHook('https://fenixweb.net:8443' + path);
app.listen(port);

app.use(bodyParser.json());
app.post(path, function(req, res) {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

console.log('Starting bot...');

var connection = mysql.createConnection({
	host: config.dbhost,
	user: config.dbuser_amazon,
	password: config.dbpassword_amazon,
	database: config.dbdatabase_amazon
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_amazon,
	password: config.dbpassword_amazon,
	database: config.dbdatabase_amazon
});

setInterval(function () {
	connection.query('SELECT 1');
	connection_sync.query('SELECT 1');
}, 60000);

checkItems();
callNTimes(300, function () { // 5 min
	checkItems();
});

process.on('SIGINT', function() {
	console.log("Shutting down bot...");
	process.exit();
});

process.on('SIGTERM', function() {
	console.log("Shutting down bot...");
	process.exit();
});

var no_preview = {
	parse_mode: "HTML",
	disable_web_page_preview: true
};

var html = {
	parse_mode: "HTML"
};

var mark = {
	parse_mode: "Markdown"
};

var validLang = ["en", "it"];
var lang_main = [];
var lang_admin = [];
var lang_no_products = [];
var lang_added_at = [];
var lang_no_code = [];
var lang_not_follow = [];
var lang_deleted = [];
var lang_invalid_url = [];
var lang_now_follow = [];
var lang_already_follow = [];
var lang_following = [];
var lang_notification = [];
var lang_open_url = [];

lang_main["en"] = "<b>Welcome to Amazon Stock Tracker Bot!</b>\n\nSend me the Amazon url and i will notify you when will be available!\nNow i support european marketplaces (it, es, de, co.uk, fr).";
lang_main["it"] = "<b>Benvenuto nell'Amazon Stock Tracker Bot!</b>\n\nInviami l'indirizzo web Amazon e ti invierò una notifica quando il prodotto sarà disponibile!\nAl momento supporto i marketplace europei (it, es, de, co.uk, fr).";
lang_admin["en"] = "You must be administrator to use this command";
lang_admin["it"] = "Devi essere amministratore per utilizzare questo comando";
lang_no_products["en"] = "No products followed, send me an amazon url to start following.";
lang_no_products["it"] = "Non segui alcun prodotto, inviami l'indirizzo di amazon per iniziare a seguirlo.";
lang_added_at["en"] = "added at";
lang_added_at["it"] = "aggiunto il";
lang_no_code["en"] = "Specify product id after command, example: '/remove B08KHL21CV'. You can find the list with the /list command.";
lang_no_code["it"] = "Specifica l'id del prodotto dopo il comando, esempio: '/remove B08KHL21CV'. Puoi trovarlo nella lista fornita dal comando /list.";
lang_not_follow["en"] = "You are not following this product.";
lang_not_follow["it"] = "Non stai seguendo questo prodotto.";
lang_deleted["en"] = "Product deleted!";
lang_deleted["it"] = "Prodotto eliminato!";
lang_invalid_url["en"] = "Invalid url, please try again.\nExample url: https://www.amazon.it/dp/B08KHL21CV/";
lang_invalid_url["it"] = "Url non valida, riprova. Esempio: https://www.amazon.it/dp/B08KHL21CV/";
lang_now_follow["en"] = "You are now following product ";
lang_now_follow["it"] = "Ora segui il prodotto ";
lang_already_follow["en"] = "You are already following this product.";
lang_already_follow["it"] = "Stai già seguendo questo prodotto.";
lang_following["en"] = "You are following this products:";
lang_following["it"] = "Prodotti che stai seguendo:";
lang_notification["en"] = "%s you followed is now available at price %p on Amazon %l!";
lang_notification["it"] = "%s che stavi seguendo è ora disponibile al prezzo di %p su Amazon %l!";
lang_open_url["en"] = "Open Amazon";
lang_open_url["it"] = "Apri Amazon";

bot.onText(/^\/start/i, function (message) {
	if (message.chat.id < 0)
		return;

	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	bot.sendMessage(message.chat.id, lang_main[lang], html);
});

bot.onText(/^\/list/i, function (message) {
	if (message.chat.id < 0)
		return;

	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	connection.query('SELECT I.code, I.title, U.add_date FROM user U, item I WHERE I.id = U.item_id AND U.account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length > 0) {
			var result_text = lang_following[lang] + "\n";
			for(i = 0; i < Object.keys(rows).length; i++)
				result_text += "> " + cutText(rows[i].title, 50) + " (<a href='https://www.amazon.it/dp/" + rows[i].code + "/'>" + rows[i].code + "</a>) " + lang_added_at[lang] + " " + toDate(lang, rows[i].add_date) + "\n";
			bot.sendMessage(message.chat.id, result_text, no_preview);
		} else
			bot.sendMessage(message.chat.id, lang_no_products[lang]);
	});
});

bot.onText(/^\/remove (.+)/i, function (message, match) {
	if (message.chat.id < 0)
		return;
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	if (match[1] == undefined) {
		bot.sendMessage(message.chat.id, lang_no_code[lang]);
		return;
	}
	
	const item_code = match[1];
	connection.query('SELECT I.id FROM item I, user U WHERE I.id = U.item_id AND U.account_id = ' + message.from.id + ' AND I.code = ' + connection.escape(item_code), function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length == 0) {
			bot.sendMessage(message.chat.id, lang_not_follow[lang]);
			return;
		}
		const item_id = rows[0].id;
		connection.query('DELETE FROM user WHERE item_id = ' + item_id + ' AND account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_deleted[lang]);
			connection.query('SELECT COUNT(id) As cnt FROM user WHERE item_id = ' + item_id, function (err, rows, fields) {
				if (err) throw err;
				if (rows[0].cnt == 0) {
					connection.query('DELETE FROM item WHERE id = ' + item_id, function (err, rows, fields) {
						if (err) throw err;
					});
				}
			});
		});
	});
});

bot.on('message', function (message, match) {
	if ((message.text == undefined) || (message.text.startsWith("/")))
		return;

	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	const item_match = message.text.match(/\/dp\/(\w+)/);
	if (item_match == null) {
		bot.sendMessage(message.chat.id, lang_invalid_url[lang], no_preview);
		return;
	}

	const item_code = item_match[1];
	var item_id;
	var item_title = null;
	const item_select = connection_sync.query('SELECT id, title FROM item WHERE code = ' + connection.escape(item_code));
	if (Object.keys(item_select).length > 0) {
		console.log(getNow("it") + " - Item code already loaded: " + item_code);
		item_id = item_select[0].id;
		item_title = item_select[0].title;
	} else {
		console.log(getNow("it") + " - Item code added: " + item_code);
		const item_insert = connection_sync.query('INSERT INTO item (code) VALUES (' + connection.escape(item_code) + ')');
		item_id = item_insert.insertId;
	}

	connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id + ' AND item_id = ' + item_id, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length == 0) {
			connection.query('INSERT INTO user (item_id, lang, account_id) VALUES (' + item_id + ', "' + lang + '", ' + message.from.id + ')', function (err, rows, fields) {
				if (err) throw err;
			});
			bot.sendMessage(message.chat.id, lang_now_follow[lang] + " *" + item_code + "*!", mark);
		} else
			bot.sendMessage(message.chat.id, lang_already_follow[lang]);
	});
	
	if (item_title == null) {
		if (lang == "en")
			lang = "co.uk";

		axios({
			method: 'get',
			url: 'https://www.amazon.' + lang + '/dp/' + item_code + '/',
			'headers': {
				'Host': 'www.amazon.' + lang,
				'Accept': '*/*',
				'Accept-Encoding': 'gzip, deflate, br',
				'Connection': 'keep-alive',
				'Cache-Control': 'no-cache',
				'Referer': 'https://www.amazon.' + lang + '/',
				'sec-ch-ua': '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
				'sec-ch-ua-mobile': '?0',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.77 Safari/537.36'
			}
		}).then((response) => {
			const data = response.data;
			const title = data.match(/<title>(.+): Amazon/);
			if (title != null) {
				connection.query('UPDATE item SET title = ' + connection.escape(title[1]) + ' WHERE id = ' + item_id, function (err, rows, fields) {
					if (err) throw err;
				});
				console.log(getNow("it") + " - Title: " + title[1]);
			} else {
				console.log(getNow("it") + " - Title unavailable");
			}
		}, (error) => {
			console.log(error);
		});
	} else {
		console.log(getNow("it") + " - Title already loaded");
	}
});

function checkItems() {
	connection.query('SELECT id, code, title FROM item WHERE check_date < NOW() GROUP BY code', function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length > 0) {
			console.log(getNow("it") + " - Checking " + Object.keys(rows).length + " items...")
			rows.forEach(checkItem);
		}
	});
}

function checkItem(element, index, array) {
	const item_id = element.id;
	const item_code = element.code;
	const item_title = element.title;
	
	checkShop("it", item_id, item_code, item_title);
	checkShop("es", item_id, item_code, item_title);
	checkShop("fr", item_id, item_code, item_title);
	checkShop("co.uk", item_id, item_code, item_title);
	checkShop("de", item_id, item_code, item_title);
	
	connection.query('UPDATE item SET check_date = NOW() WHERE id = "' + item_id + '"', function (err, rows, fields) {
		if (err) throw err;
	});
}

function checkShop(amz_lang, item_id, item_code, item_title) {
	const amz_url = 'https://www.amazon.' + amz_lang + '/dp/' + item_code + '/';
	axios({
		method: 'get',
		url: amz_url,
		'headers': {
			'Host': 'www.amazon.' + amz_lang,
			'Accept': '*/*',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache',
			'Referer': 'https://www.amazon.' + amz_lang + '/',
			'sec-ch-ua': '"Chromium";v="88", "Google Chrome";v="88", ";Not A Brand";v="99"',
			'sec-ch-ua-mobile': '?0',
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.77 Safari/537.36'
		}
	}).then((response) => {
		const data = response.data;
		const avabilable_price = data.match(/a-size-base a-color-price">(\d+),(\d+)/);
		if (avabilable_price != null) {
			const price = avabilable_price[1] + "," + avabilable_price[2] + " €";
			console.log(getNow("it") + " - " + item_code + " available with price " + price + " (" + amz_lang + ")");
			
			// send notifications
			connection.query('SELECT id, account_id, lang FROM user WHERE item_id = ' + item_id, function (err, rows, fields) {
				if (err) throw err;
				for(i = 0; i < Object.keys(rows).length; i++) {
					// check if notification sent for specific market
					var user_id = rows[i].id;
					var account_id = rows[i].account_id;
					var lang = rows[i].lang;
					var marketplace = connection_sync.query('SELECT 1 FROM marketplace WHERE user_id = ' + user_id + ' AND location = "' + amz_lang + '"');
					if (err) throw err;
					if (Object.keys(marketplace).length > 0) {
						console.log(getNow("it") + " - " + item_code + " skipped for user " + account_id + " (" + amz_lang + ")");
						return;
					}
					console.log(getNow("it") + " - " + item_code + " sent for user " + account_id + " (" + amz_lang + ")");
					connection.query('INSERT INTO marketplace (user_id, location) VALUES (' + user_id + ', "' + amz_lang + '")', function (err, rows, fields) {
						if (err) throw err;
					});

					var iKeys = [];
					iKeys.push([{
						text: lang_open_url[lang],
						url: amz_url
					}]);
					bot.sendMessage(account_id, lang_notification[lang].replace("%s", "<b>" + item_title + "</b>").replace("%p", "<b>" + price + "</b>").replace("%l", "<b>" + amz_lang.toUpperCase() + "</b>"), {
						parse_mode: 'HTML',
						disable_web_page_preview: true,
						reply_markup: {
							inline_keyboard: iKeys
						}
					});
				}
			});
		} else {
			console.log(getNow("it") + " - " + item_code + " unavailable (" + amz_lang + ")");
			
			// prepare for next availability check
			connection.query('SELECT id FROM user WHERE item_id = ' + item_id, function (err, rows, fields) {
				if (err) throw err;
				for(i = 0; i < Object.keys(rows).length; i++) {
					connection.query('DELETE FROM marketplace WHERE user_id = ' + rows[i].id + ' AND location = "' + amz_lang + '"', function (err, rows, fields) {
						if (err) throw err;
					});
				}
			});
		}
	}, (error) => {
		console.log(error);
	});
}

// Functions

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;
	var datetime;
	if (lang == "it")
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else if (lang == "en")
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else
		datetime = "Error";
	if (obj == true)
		datetime = new Date(datetime);
	return datetime;
}

function toDate(lang, date) {
	var d = new Date(date);
	if (typeof date == "object")
		d = date;
	var datetime = "";
	if (lang == "it")
		datetime = addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else if (lang == "en")
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else
		datetime = "Error";
	return datetime;
}

function formatNumber(num) {
	return ("" + num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, function ($1) {
		return $1 + "."
	});
}

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}

function callNTimes(time, fn) {
	time = time*1000;
	function callFn() {
		if (1 < 0) return;
		fn();
		setTimeout(callFn, time);
	}
	setTimeout(callFn, time);
}

function cutText(text, len) {
	if (text.length > len)
		return text.substr(0, len) + "...";
	return text
}
