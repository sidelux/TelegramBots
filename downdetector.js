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
var fs = require('fs');
var bodyParser = require('body-parser');
var request = require("request");

console.log('Connecting bot...');

var token = config.downdetectortoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/downdetector/bot" + token;
var port = 25010;

bot.setWebHook('https://fenixweb.net:8443' + path);
app.listen(port);

app.use(bodyParser.json());
app.post(path, function(req, res) {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

console.log('Starting bot...');

process.on('SIGINT', function() {
	console.log("Shutting down bot...");
	process.exit();
});

process.on('SIGTERM', function() {
	console.log("Shutting down bot...");
	process.exit();
});

var validLang = ["en", "it"];
var lang_main = [];
var lang_invalid_service = [];
var lang_error = [];
var lang_result_status = [];
var lang_result_problems = [];
var lang_result_ok = [];
var lang_latest = [];
var lang_visit = [];
var lang_page = [];

lang_main["en"] = "<b>Welcome to Downdetector Bot!</b>\n\nUse this bot to show in realtime services status.";
lang_main["it"] = "<b>Benvenuto nel Downdetector Bot!</b>\n\nUtilizza questo bot per visualizzare in tempo reale lo stato dei servizi specificati.";
lang_invalid_service["en"] = "Missing service, example: '/detect skype'.";
lang_invalid_service["it"] = "Servizio non specificato, esempio: '/detect skype'.";
lang_error["en"] = "Error, please retry.";
lang_error["it"] = "Errore, riprova.";
lang_result_status["en"] = "Status";
lang_result_status["it"] = "Stato";
lang_result_problems["en"] = "Problems";
lang_result_problems["it"] = "Potenziali problemi";
lang_result_ok["en"] = "No problem";
lang_result_ok["it"] = "Nessun problema";
lang_latest["en"] = "Latest two hours reports";
lang_latest["it"] = "Segnalazioni nelle ultime due ore";
lang_visit["en"] = "Visit";
lang_visit["it"] = "Visita la";
lang_page["en"] = "Downdetector page";
lang_page["it"] = "pagina Downdetector";

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
					
	bot.sendMessage(message.chat.id, lang_main[lang], no_preview);
});

bot.onText(/^\/detector (.+)|^\/detector$/i, function (message, match) {
	var options = {parse_mode: "Markdown", reply_to_message_id: message.message_id, disable_web_page_preview: true};
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	if (match[1] == undefined) {
		bot.sendMessage(message.chat.id, lang_invalid_service[lang], options);
		return;
	}
	
	var detect_lang;
	if (lang == "it")
		detect_lang = "it/problemi";
	else
		detect_lang = "com/status";
	var detect_service = match[1].trim().toLowerCase().replaceAll(" ", "-");
	
	var url = "https://downdetector." + detect_lang + "/" + detect_service + "/";
	console.log("Requested status for " + url);
	request({
		uri: url,
	}, function(error, response, body) {
		if (error != undefined) {
			console.log("Request error with " + detect_service);
			bot.sendMessage(message.chat.id, lang_error[lang], options);
			return;
		}
		var baseline = body.match(/baseline: (.+),/);
		if (baseline == undefined) {
			console.log("Undefined baseline with " + detect_service);
			bot.sendMessage(message.chat.id, lang_error[lang], options);
			return;
		}
		baseline = parseInt(baseline[1]);
		var regex = /{ x: '(.+)', y: (.+) }/gm;
		var output_date = [];
		var output_value = [];
		var result;
		while (result = regex.exec(body)) {
			output_date.push(result[1]);
			output_value.push(result[2]);
		}
		
		var reversed_date = output_date.reverse();
		var reversed_value = output_value.reverse();
		
		var haveProblems = 0;
		var list = "";
		for (var i = 0; i < reversed_date.length; i++) {
			if (i < 8) {
				var d = new Date(reversed_date[i]);
				var min_hour = addZero(d.getHours()) + ":" + addZero(d.getMinutes());
				if (parseInt(reversed_value[i]) > baseline) {
					haveProblems = 1;
					reversed_value[i] = "*" + reversed_value[i] + "*";
				}
				list += min_hour + " > " + reversed_value[i] + "\n";
			}
		}
		
		var status = "*" + lang_result_status[lang] + "*: ";
		if (haveProblems == 1)
			status += "_" + lang_result_problems[lang] + "_";
		else
			status += "_" + lang_result_ok[lang] + "_";
		
		var text = status + "\n\n*" + lang_latest[lang] + "*:\n" + list + "\n" + lang_visit[lang] + " [" + lang_page[lang] + "](" + url + ")";
		
		bot.sendMessage(message.chat.id, text, options);
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

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

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
