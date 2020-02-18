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

var token = config.pinnertoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/pinner/bot" + token;
var port = 25008;

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
	user: config.dbuser_pinner,
	password: config.dbpassword_pinner,
	database: config.dbdatabase_pinner
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_pinner,
	password: config.dbpassword_pinner,
	database: config.dbdatabase_pinner
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
var lang_admin = [];
var lang_reply = [];
var lang_added = [];
var lang_already = [];
var lang_groups = [];
var lang_reply_pin = [];
var lang_cant = [];
var lang_notenabled = [];
var lang_disabled = [];

lang_main_1["en"] = "<b>Welcome to Pinner Bot!</b>\n\nAdd this bot to groups to give a user power to pin messages. <b>Remember to set this bot as administrator (at least with pin powers).</b>\n\nMore than ";
lang_main_1["it"] = "<b>Benvenuto nel Pinner Bot!</b>\n\nAggiungi questo bot ai tuoi gruppi per consentire ad uno o più utenti il potere di fissare i messaggi. <b>Ricorda di impostare questo bot come amministratore (almeno con i permessi per fissare i messaggi).</b>\n\nPiù di ";
lang_main_2["en"] = " users enabled";
lang_main_2["it"] = " utenti abilitati";
lang_admin["en"] = "You must be administrator to use this command";
lang_admin["it"] = "Devi essere amministratore per utilizzare questo comando";
lang_reply["en"] = "This command must be used in reply of a user that you want to allow messages pin";
lang_reply["it"] = "Questo comando deve essere utilizzato in risposta all'utente che vuoi abbia il potere per fissare i messaggi";
lang_added["en"] = "User successfully enabled";
lang_added["it"] = "Utente abilitato con successo";
lang_already["en"] = "User already enabled in this group";
lang_already["it"] = "Utente già abilitato in questo gruppo";
lang_groups["en"] = "You must use this command in a group";
lang_groups["it"] = "Devi usare questo comando in un gruppo";
lang_reply_pin["en"] = "This command must be used in reply of a message you want to pin";
lang_reply_pin["it"] = "Questo comando deve essere utilizzato in risposta al messaggio da fissare";
lang_cant["en"] = "You can't use this command in this group";
lang_cant["it"] = "Non puoi utilizzare questo comando in questo gruppo";
lang_notenabled["en"] = "You can't disable user that is not enabled";
lang_notenabled["it"] = "Non puoi disabilitare un utente che non sia stato abilitato";
lang_disabled["en"] = "User successfully disabled";
lang_disabled["it"] = "Utente disabilitato con successo";

bot.onText(/^\/start/i, function (message) {
	if (message.chat.id < 0)
		return;

	var no_preview = {
		parse_mode: "HTML",
		disable_web_page_preview: true
	};

	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	connection.query('SELECT COUNT(id) As cnt FROM user', function (err, rows) {
		if (err) throw err;
		
		var global_cnt = rows[0].cnt;
					
		bot.sendMessage(message.chat.id, lang_main_1[lang] + formatNumber(global_cnt) + lang_main_2[lang], no_preview);
	});
});

bot.onText(/^\/enable/i, function (message) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	if (message.chat.id > 0) {
		bot.sendMessage(message.chat.id, lang_groups[lang], options);
		return;
	}
	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status != "creator") && (data.status != "administrator")) {
			bot.sendMessage(message.chat.id, lang_admin[lang], options);
			return;
		}
		
		if (message.reply_to_message == undefined) {
			bot.sendMessage(message.chat.id, lang_reply[lang], options);
			return;
		}
		
		var account_id = message.reply_to_message.from.id;
		var chat_id = message.reply_to_message.chat.id;
		
		connection.query('SELECT 1 FROM user WHERE account_id = ' + account_id + ' AND chat_id = ' + chat_id, function (err, rows) {
			if (err) throw err;
			
			if (Object.keys(rows).length > 0) {
				bot.sendMessage(message.chat.id, lang_already[lang], options);
				return;
			}
		
			connection.query('INSERT INTO user (account_id, chat_id) VALUES (' + account_id + ', ' + chat_id + ')', function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_added[lang], options);
			});
		});
	});
});

bot.onText(/^\/disable/i, function (message) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	if (message.chat.id > 0) {
		bot.sendMessage(message.chat.id, lang_groups[lang], options);
		return;
	}
	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status != "creator") && (data.status != "administrator")) {
			bot.sendMessage(message.chat.id, lang_admin[lang], options);
			return;
		}
		
		if (message.reply_to_message == undefined) {
			bot.sendMessage(message.chat.id, lang_reply[lang], options);
			return;
		}
		
		var account_id = message.reply_to_message.from.id;
		var chat_id = message.reply_to_message.chat.id;
		
		connection.query('SELECT 1 FROM user WHERE account_id = ' + account_id + ' AND chat_id = ' + chat_id, function (err, rows) {
			if (err) throw err;
			
			if (Object.keys(rows).length > 0) {
				bot.sendMessage(message.chat.id, lang_notenabled[lang], options);
				return;
			}
		
			connection.query('DELETE FROM user WHERE account_id = ' + account_id + ' AND chat_id = ' + chat_id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_disabled[lang], options);
			});
		});
	});
});

bot.onText(/^\/manpin/i, function (message) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	if (message.chat.id > 0) {
		bot.sendMessage(message.chat.id, lang_groups[lang], options);
		return;
	}
		
	if (message.reply_to_message == undefined) {
		bot.sendMessage(message.chat.id, lang_reply_pin[lang], options);
		return;
	}

	var account_id = message.from.id;
	var chat_id = message.chat.id;

	connection.query('SELECT 1 FROM user WHERE account_id = ' + account_id + ' AND chat_id = ' + chat_id, function (err, rows) {
		if (err) throw err;

		if (Object.keys(rows).length == 0) {
			bot.sendMessage(message.chat.id, lang_cant[lang], options);
			return;
		}
		
		bot.pinChatMessage(chat_id, message.reply_to_message.message_id, false);
	});
});

// Functions

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;
	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else
		datetime = "Error";
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
	if (lang == "it") {
		datetime = addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else
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
