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

var token = config.expellertoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/expeller/bot" + token;
var port = 25009;

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
	user: config.dbuser_expeller,
	password: config.dbpassword_expeller,
	database: config.dbdatabase_expeller
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_expeller,
	password: config.dbpassword_expeller,
	database: config.dbdatabase_expeller
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
var defaultLang = "it";
var validLanguages = ["japanese", "chinese", "arabic"];
var lang_main_1 = [];
var lang_main_2 = [];
var lang_admin = [];
var lang_groups = [];
var lang_param = [];
var lang_disabled = [];
var lang_enabled = [];
var lang_invalid_lang = [];
var lang_config = [];
var lang_whole_enabled = [];
var lang_whole_disabled = [];

lang_main_1["en"] = "<b>Welcome to Expeller Bot!</b>\n\nAdd this bot to groups to automatically expel people based on first name language. <b>Remember to set this bot as administrator.</b>\n\nMore than ";
lang_main_1["it"] = "<b>Benvenuto nell'Expeller Bot!</b>\n\nAggiungi questo bot ai tuoi gruppi per espellere automaticamente persone che nel nome hanno una particolare lingua. <b>Ricorda di impostare questo bot come amministratore.</b>\n\nPiù di ";
lang_main_2["en"] = " groups enabled";
lang_main_2["it"] = " gruppi abilitati";
lang_admin["en"] = "You must be administrator to use this command";
lang_admin["it"] = "Devi essere amministratore per utilizzare questo comando";
lang_groups["en"] = "You must use this command in a group";
lang_groups["it"] = "Devi usare questo comando in un gruppo";
lang_param["en"] = "You must use this command specifying a language";
lang_param["it"] = "Devi utilizzare questo comando specificando una lingua";
lang_disabled["en"] = "Expel for language %s succefully disabled";
lang_disabled["it"] = "Espulsione per la lingua %s disabilitata";
lang_enabled["en"] = "Expel for language %s succefully enabled";
lang_enabled["it"] = "Espulsione per la lingua %s abilitata";
lang_invalid_lang["en"] = "Invalid language, available languages: ";
lang_invalid_lang["it"] = "Lingua non valida, lingue disponibili: ";
lang_config["en"] = "At first set an except language";
lang_config["it"] = "Imposta prima una lingua di espulsione";
lang_whole_enabled["en"] = "Whole word check enabled";
lang_whole_enabled["it"] = "Controllo parola intera abilitato";
lang_whole_disabled["en"] = "Whole word check disabled";
lang_whole_disabled["it"] = "Controllo parola intera disabilitato";

bot.on('message', function (message) {
	var lang = defaultLang;
	
	if (message.new_chat_members != undefined) {
		if (message.new_chat_member.is_bot == false) {
			var first_name = message.new_chat_member.first_name;
			var chat_id = message.chat.id;
			
			connection.query('SELECT * FROM group_config WHERE chat_id = ' + chat_id, function (err, rows) {
				if (err) throw err;
				
				if (Object.keys(rows).length == 0)
					return;
				
				console.log("Checking user " + first_name + " for group " + chat_id);
			
				var toExpel = 0;
				
				var regex_japanese = "/[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/";
				var regex_chinese = /[\u3000\u3400-\u4DBF\u4E00-\u9FFF]/g;
				var regex_arabic = /[\u0600-\u06ff]|[\u0750-\u077f]|[\ufb50-\ufbc1]|[\ufbd3-\ufd3f]|[\ufd50-\ufd8f]|[\ufd92-\ufdc7]|[\ufe70-\ufefc]|[\uFDF0-\uFDFD]/;
				if (rows[0].whole_word == 1) {
					regex_japanese = /^([\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|[\u203B])+$/;
					regex_chinese = /^[\u3000\u3400-\u4DBF\u4E00-\u9FFF]+$/g;
					regex_arabic = /^([\u0600-\u06ff]|[\u0750-\u077f]|[\ufb50-\ufbc1]|[\ufbd3-\ufd3f]|[\ufd50-\ufd8f]|[\ufd92-\ufdc7]|[\ufe70-\ufefc]|[\uFDF0-\uFDFD])+$/;
				}
				
				if (rows[0].expel_japanese == 1) {
					if (regex_japanese.test(first_name) == true)
						toExpel = 1;
				}
				if (rows[0].expel_chinese == 1) {
					if (regex_chinese.test(first_name) == true)
						toExpel = 1;
				}
				if (rows[0].expel_arabic == 1) {
					if (regex_arabic.test(first_name) == true)
						toExpel = 1;
				}
				
				if (toExpel == 1) {
					bot.kickChatMember(message.chat.id, message.from.id).then(function (result) {
						console.log("User banned");
					});
				} else
					console.log("User not banned");
			});
		}
	}
});

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

	connection.query('SELECT COUNT(id) As cnt FROM group_config', function (err, rows) {
		if (err) throw err;
		
		var global_cnt = rows[0].cnt;
					
		bot.sendMessage(message.chat.id, lang_main_1[lang] + formatNumber(global_cnt) + lang_main_2[lang], no_preview);
	});
});

bot.onText(/^\/expel_(\w+)/i, function (message, match) {
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
		
		if (match[1] == undefined) {
			bot.sendMessage(message.chat.id, lang_param[lang], options);
			return;
		}
		
		var language = match[1].toLowerCase();
		
		if (validLanguages.indexOf(language) == -1) {
			bot.sendMessage(message.chat.id, lang_invalid_lang[lang] + validLanguages.join(", "), options);
			return;
		}
		
		var chat_id = message.chat.id;
		
		connection.query('SELECT expel_' + language + ' As status FROM group_config WHERE chat_id = ' + chat_id, function (err, rows) {
			if (err) throw err;
			
			if (Object.keys(rows).length > 0) {
				var update = 0;
				var msg = lang_disabled[lang];
				if (rows[0].status == 0) {
					update = 1;
					msg = lang_enabled[lang];
				}
				connection.query('UPDATE group_config SET expel_' + language + ' = ' + update + ' WHERE chat_id = ' + chat_id, function (err, rows) {
					if (err) throw err;
					bot.sendMessage(message.chat.id, msg.replace("%s", language), options);
				});
			} else {
				connection.query('INSERT INTO group_config (chat_id, expel_' + language + ') VALUES (' + chat_id + ', 1)', function (err, rows) {
					if (err) throw err;
					bot.sendMessage(message.chat.id, lang_enabled[lang].replace("%s", language), options);
				});
			}
			
			console.log(getNow("it") + " Changed " + language + " for chat_id " + chat_id);
		});
	});
});

bot.onText(/^\/whole_word/i, function (message, match) {
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
		
		var chat_id = message.chat.id;
		
		connection.query('SELECT whole_word FROM group_config WHERE chat_id = ' + chat_id, function (err, rows) {
			if (err) throw err;
			
			if (Object.keys(rows).length == 0) {
				bot.sendMessage(message.chat.id, lang_config[lang], options);
				return;
			}
			
			var status = 1;
			var msg = lang_whole_enabled[lang];
			if (rows[0].whole_word == 1) {
				status = 0;
				msg = lang_whole_disabled[lang];
			}
			
			connection.query('UPDATE group_config SET whole_word = ' + status + ' WHERE chat_id = ' + chat_id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, msg, options);
			});
		});
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
