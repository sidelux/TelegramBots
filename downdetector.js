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
var lang_categories = [];
var lang_update = [];
var lang_updated = [];
var lang_updated_at = [];
var lang_service_status = [];

lang_main["en"] = "<b>Welcome to Downdetector Bot!</b>\n\nUse this bot to show in realtime services status.";
lang_main["it"] = "<b>Benvenuto nel Downdetector Bot!</b>\n\nUtilizza questo bot per visualizzare in tempo reale lo stato dei servizi specificati.";
lang_invalid_service["en"] = "Missing service, example: '/detector skype'.";
lang_invalid_service["it"] = "Servizio non specificato, esempio: '/detector skype'.";
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
lang_categories["en"] = "Categories";
lang_categories["it"] = "Categorie";
lang_update["en"] = "Update";
lang_update["it"] = "Aggiorna";
lang_updated["en"] = "Updated";
lang_updated["it"] = "Aggiornato";
lang_updated_at["en"] = "Updated at ";
lang_updated_at["it"] = "Aggiornato alle ";
lang_service_status["en"] = "service status";
lang_service_status["it"] = "Stato servizi";

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
					
	// bot.sendMessage(message.chat.id, lang_main[lang], no_preview);
	bot.sendMessage(message.chat.id, "This bot has become useless cause downdetector has added a captcha on all pages.", no_preview);
});

bot.onText(/^\/detector (.+)|^\/detector/i, function (message, match) {
	var options = {parse_mode: "Markdown", reply_to_message_id: message.message_id};
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	if (match[1] == undefined) {
		bot.sendMessage(message.chat.id, lang_invalid_service[lang], options);
		return;
	}
	
	var detect_service = match[1].trim().toLowerCase().replaceAll(" ", "-");
	
	detector(message, lang, detect_service, 0, options);
});

bot.on('callback_query', function (message) {
	var detect_service = message.data.trim().toLowerCase().replaceAll(" ", "-");
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	detector(message, lang, detect_service, 1, null);
});

bot.on("inline_query", function (query) {
	if (query.query.length < 3)
		return;
	
	var detect_service = query.query.trim().toLowerCase().replaceAll(" ", "-");
	
	var lang = "en";
	if (query.from.language_code != undefined){
		if (validLang.indexOf(query.from.language_code) != -1)
			lang = query.from.language_code;
	}
	
	detector(query, lang, detect_service, 2, null);
});

function detector(message, lang, detect_service, mode, options) {
	var detect_lang;
	if (lang == "it")
		detect_lang = "it/problemi";
	else
		detect_lang = "com/status";
	
	var url = "https://downdetector." + detect_lang + "/" + detect_service + "/";
	console.log(getNow("it") + " Requested status for " + url);
	request({
		uri: url,
	}, function(error, response, body) {
		if (error != undefined) {
			console.log(getNow("it") + " Request error with " + detect_service);
			if (mode == 0)
				bot.sendMessage(message.chat.id, lang_error[lang], options);
			else if (mode == 1)
				bot.answerCallbackQuery(message.id, {text: lang_error[lang]});
			return;
		}
		var baseline = body.match(/baseline: (.+),/);
		if (baseline == undefined) {
			console.log(getNow("it") + " Undefined baseline with " + detect_service);
			if (mode == 0)
				bot.sendMessage(message.chat.id, lang_error[lang], options);
			else if (mode == 1)
				bot.answerCallbackQuery(message.id, {text: lang_error[lang]});
			return;
		}
		baseline = parseInt(baseline[1]);
		var regex = /{ x: '(.+)', y: (.+) }/gm;
		var output_date = [];
		var output_value = [];
		var result;
		while (result = regex.exec(body)) {
			output_date.push(result[1].trim());
			output_value.push(result[2].trim());
		}
		
		var title = body.match(/<li class='breadcrumb-item active'>([\w\s]+)<\/li>/)[1].trim();
		
		var reversed_date = output_date.reverse();
		var reversed_value = output_value.reverse();
		
		reversed_date = reversed_date.slice(0, 8);
		reversed_value = reversed_value.slice(0, 8);
		
		// console.log("Baseline", baseline, reversed_value);
		
		var haveProblems = 0;
		var list = "";
		for (var i = 0; i < reversed_date.length; i++) {
			var d = new Date(reversed_date[i]);
			var min_hour = addZero(d.getHours()) + ":" + addZero(d.getMinutes());
			if (baseline == 0) {
				baseline = 5;
				// console.log("Using simulated baseline");
			}
			if (parseInt(reversed_value[i]) > (baseline+baseline*0.1)) {
				haveProblems = 1;
				reversed_value[i] = "*" + reversed_value[i] + "*";
			}
			list += min_hour + " > " + reversed_value[i] + "\n";
		}
		
		var type;
		var list_types = "";
		var output_type = [];
		regex = /<div class='text-center text-muted' style='margin-top: 2\.1rem;'>([\w\d\s]+)<\/div>/gm;
		while (type = regex.exec(body)) {
			var type_text = type[1].replaceAll("\n", "");
			output_type.push(type_text.trim());
		}
		regex = /100-(\d+)]/gm;
		var cnt = 0;
		while (type = regex.exec(body)) {
			if (output_type[cnt] != undefined) {
				list_types += output_type[cnt] + " > " + type[1] + "%\n";
				cnt++;
			}
		}
		
		var status = "*" + lang_result_status[lang] + "*: ";
		var inline_status = lang_result_status[lang] + ": ";
		if (haveProblems == 1) {
			status += "_" + lang_result_problems[lang] + "_";
			inline_status += lang_result_problems[lang];
		} else {
			status += "_" + lang_result_ok[lang] + "_";
			inline_status += lang_result_ok[lang];
		}
		
		var d = new Date();
		var update_time = addZero(d.getHours()) + ":" + addZero(d.getMinutes()) + ":" + addZero(d.getSeconds());
		var text = "*" + title + "*\n\n" + status + "\n\n*" + lang_latest[lang] + "*:\n" + list + "\n*" + lang_categories[lang] + "*:\n" + list_types + "\n" + lang_visit[lang] + " [" + lang_page[lang] + "](" + url + ")\n_" + lang_updated_at[lang] + update_time + "_";
		
		var iKeys = [];
		iKeys.push([{
			text: lang_update[lang],
			callback_data: detect_service
		}]);
		
		var options_send;
		if (mode == 0) {
			options_send = {
				parse_mode: "Markdown",
				disable_web_page_preview: true, 
				reply_to_message_id: message.message_id,
				reply_markup: {
					inline_keyboard: iKeys
				}
			};
			
			bot.sendMessage(message.chat.id, text, options_send);
		} else if (mode == 1) {			
			if (message.message != undefined) {
				options_send = {
					parse_mode: 'Markdown',
					disable_web_page_preview: true, 
					chat_id: message.message.chat.id,
					message_id: message.message.message_id,
					reply_markup: {
						inline_keyboard: iKeys
					}
				};
			} else {
				options_send = {
					parse_mode: 'Markdown',
					disable_web_page_preview: true, 
					inline_message_id: message.inline_message_id,
					reply_markup: {
						inline_keyboard: iKeys
					}
				};
			}
			
			bot.editMessageText(text, options_send);
	
			bot.answerCallbackQuery(message.id, {text: lang_updated[lang]});
		} else if (mode == 2) {
			var title_line = "";
			if (lang == "it")
				title_line = lang_service_status[lang] + ' ' + title;
			else
				title_line = title + ' ' + lang_service_status[lang];
			bot.answerInlineQuery(message.id, [{
				id: '0',
				type: 'article',
				title: title_line,
				description: inline_status,
				message_text: text,
				parse_mode: "Markdown",
				disable_web_page_preview: true,
				reply_markup: {
					inline_keyboard: iKeys
				}
			}], {cache_time: 0});
		}
	});
}

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
