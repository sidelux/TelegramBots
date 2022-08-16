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

var token = config.sidetoolstoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/sidetools/bot" + token;
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

bot.onText(/^\/start/i, function (message) {
	if (message.chat.id < 0)
		return;

	bot.sendMessage(message.chat.id, "Bot realizzato per fornire particolari funzionalità, creato da @fenix45.");
	if (message.text != undefined)
		console.log(getNow("it") + " " + message.from.username + " - " + message.text);
});

var originalText = "Ci sei per giocare oggi? 👀";
var iKeys = [];
iKeys.push([{
	text: "Sì",
	callback_data: "presenze:si"
}]);
iKeys.push([{
	text: "No",
	callback_data: "presenze:no"
}]);

bot.onText(/^\/presenze/i, function (message) {	
	if (message.chat.id > 0)
		return;
	bot.sendMessage(message.chat.id, originalText, {
		parse_mode: 'HTML',
		reply_markup: {
			inline_keyboard: iKeys
		}
	}).then(function (data) {
		// bot.pinChatMessage(data.chat.id, data.message_id);
	});
});

bot.on('callback_query', function (message) {
	var data = message.data;
	if (data.indexOf(":") == -1)
		return;
	var split = data.split(":");
	var fun = split[0];
	var param = split[1];
	if (fun == "presenze") {
		var username = message.from.username;
		if (param == "si") {
			var newText;
			if (message.message.text.indexOf("@") !== -1) {
				if (message.message.text.indexOf(username) !== -1) {
					bot.answerCallbackQuery(message.id, {text: "Ci sei già!"});
					return;
				} else
					newText = message.message.text + "\n@" + username;
			} else
				newText = originalText + "\n\nPresenze:\n@" + username;
			bot.editMessageText(newText, {chat_id: message.message.chat.id, message_id: message.message.message_id, parse_mode: 'HTML', reply_markup: {inline_keyboard: iKeys}});
			bot.answerCallbackQuery(message.id, {text: "Ok!"});
		} else {
			if (message.message.text.indexOf(username) !== -1) {
				var newText = message.message.text.replace("\n@" + username, "");
				if (newText.indexOf("@") == -1)
					newText = originalText;
				bot.editMessageText(newText, {chat_id: message.message.chat.id, message_id: message.message.message_id, parse_mode: 'HTML', reply_markup: {inline_keyboard: iKeys}});
				bot.answerCallbackQuery(message.id, {text: "Peccato :("});
			} else
				bot.answerCallbackQuery(message.id, {text: "Non ci sei!"});
		}
	}
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

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}
