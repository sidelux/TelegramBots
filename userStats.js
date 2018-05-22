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
var mysql = require('mysql');
var mysql_sync = require('sync-mysql');

var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');

console.log('Connecting bot...');

var token = config.statstoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/stats/bot" + token;
var port = 25003;

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
	user: config.dbuser_stats,
	password: config.dbpassword_stats,
	database: config.dbdatabase_stats
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_stats,
	password: config.dbpassword_stats,
	database: config.dbdatabase_stats
});

setInterval(function () {
    connection.query('SELECT 1');
	connection_sync.query('SELECT 1');
}, 60000);

process.on('SIGINT', function() {
	console.log("Shutting down bot...");
	connection.end();
	process.exit();
});

process.on('SIGTERM', function() {
	console.log("Shutting down bot...");
	connection.end();
	process.exit();
});

var validLang = ["en", "it"];
var lang_main_1 = [];
var lang_main_2 = [];
var lang_stats_userinfo = [];
var lang_stats_usernotfound = [];
var lang_stats_notfound = [];
var lang_stats_userfound = [];
var lang_stats_username = [];
var lang_stats_msgcount = [];
var lang_stats_creation = [];
var lang_stats_update = [];

lang_main_1["en"] = "<b>Welcome to User Stats Tracker Bot!</b>\n\nAdd this bot to groups to store messages count <b>globally</b>, last message date and last username for each user, then use <i>inline mode</i> with username or account id to view user informations.\n\nMore than ";
lang_main_1["it"] = "<b>Benvenuto nell'User Stats Tracker Bot!</b>\n\nAggiungi questo bot ai tuoi gruppi per contare messaggi in modo <b>globale</b>, la data dell'ultimo messaggio e l'ultimo username utilizzato dall'utente, poi con l'<i>inline mode</i> puoi visualizzare queste informazioni inserendo l'username o l'account id.\n\nPiù di ";
lang_main_2["en"] = " messages counted - <a href='https://storebot.me/bot/userstatstrackerbot'>Vote on Storebot</a>";
lang_main_2["it"] = " messaggi inviati - <a href='https://storebot.me/bot/userstatstrackerbot'>Vota sullo Storebot</a>";
lang_stats_userinfo["en"] = "Send user informations";
lang_stats_userinfo["it"] = "Invia informazioni utente";
lang_stats_usernotfound["en"] = "User not found";
lang_stats_usernotfound["it"] = "Utente non trovato";
lang_stats_notfound["en"] = "not found";
lang_stats_notfound["it"] = "non trovato";
lang_stats_userfound["en"] = "User found";
lang_stats_userfound["it"] = "Utente trovato";
lang_stats_username["en"] = "Username";
lang_stats_username["it"] = "Nome utente";
lang_stats_msgcount["en"] = "Messages count";
lang_stats_msgcount["it"] = "Numero messaggi";
lang_stats_creation["en"] = "Creation date";
lang_stats_creation["it"] = "Data creazione";
lang_stats_update["en"] = "Last update date";
lang_stats_update["it"] = "Ultimo aggiornamento";

bot.on('message', function (message) {
	if (message.text != undefined){
		if (message.chat.id < 0){
			var user = null;
			if (message.from.username != undefined)
				user = '"' + message.from.username + '"';
			var rows = connection_sync.query('UPDATE stats SET message_count = message_count+1, last_username = ' + user + ' WHERE account_id = ' + message.from.id);
			if (rows.affectedRows == 0)
				connection_sync.query('INSERT INTO stats (account_id, message_count, last_username) VALUES (' + message.from.id + ', 1, ' + user + ')');
		}
	}
});

bot.onText(/^\/start/i, function (message) {
	var no_preview = {
		parse_mode: "HTML",
		disable_web_page_preview: true
	};
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	connection.query('SELECT SUM(message_count) As cnt FROM stats', function (err, rows) {
		if (err) throw err;
		bot.sendMessage(message.chat.id, lang_main_1[lang] + String(formatNumber(Math.round(rows[0].cnt/1000)*1000)) + lang_main_2[lang], no_preview);
	});
});

bot.on("inline_query", function (query) {

	var data = query.query.replace("@","");
	var reg = new RegExp("^[a-zA-Z0-9_]{5,256}$");
	
	if ((data == "") || (reg.test(data) == false))
		return;
	
	var lang = "en";
	if (query.from.language_code != undefined){
		if (validLang.indexOf(query.from.language_code) != -1)
			lang = query.from.language_code;
	}
	
	console.log(getNow("it") + " User data request inline for " + data);
	connection.query('SELECT account_id, last_username, message_count, creation_date, update_date FROM stats WHERE last_username = "' + data + '" OR account_id = "' + data + '"', function (err, rows) {
		if (err) throw err;

		if (Object.keys(rows).length == 0) {
			bot.answerInlineQuery(query.id, [{
				id: '0',
				type: 'article',
				title: lang_stats_userinfo[lang],
				description: lang_stats_usernotfound[lang],
				message_text: data + " " + lang_stats_notfound[lang]
			}]);
			return;
		}

		bot.answerInlineQuery(query.id, [{
			id: '0',
			type: 'article',
			title: lang_stats_userinfo[lang],
			description: lang_stats_userfound[lang],
			message_text: 	"<b>" + lang_stats_username[lang] + ":</b> " + rows[0].last_username + " (" + rows[0].account_id + ")\n" +
							"<b>" + lang_stats_msgcount[lang] + ":</b> " + formatNumber(rows[0].message_count) + "\n" +
							"<b>" + lang_stats_creation[lang] + ":</b> " + toDate("en", new Date(rows[0].creation_date)) + "\n" +
							"<b>" + lang_stats_update[lang] + ":</b> " + toDate("en", new Date(rows[0].update_date)),
			parse_mode: "HTML"
		}]);
	});
});

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;
	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else {
		datetime = "Error";
	}
	if (obj == true) {
		datetime = new Date(datetime);
	}
	return datetime;
}

function toDate(lang, date) {
	var d = new Date(date);
	if (typeof date == "object")
		d = date;
	var datetime = "";
	if (lang == "en") {
		datetime = addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "db") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else {
		datetime = "Error";
	}
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
