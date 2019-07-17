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
var math = require('mathjs');
var fs = require('fs');
var bodyParser = require('body-parser');

console.log('Connecting bot...');

var token = config.inlinemathtoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/inlinemath/bot" + token;
var port = 25006;

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

var html = {
	parse_mode: "HTML"
};

bot.onText(/^\/start/i, function (message) {	
	bot.sendMessage(message.chat.id, "<b>Welcome to Inline Math Bot!</b>\n\nUse this bot inline to solve math problems (see <a href='https://mathjs.org/docs/index.html'>documentation</a>)", html);
});

bot.on("inline_query", function (query) {
	var data = query.query;

	if (data == "")
		return;

	if (data.length < 2)
		return;
	
	data = data.replaceAll(/:/, "/");
	var result;
	try {
		result = math.eval(data);
	} catch(error) {
		return;
	}
	
	console.log(getNow("it") + " Math query from " + query.from.username + ": " + data);
	
	bot.answerInlineQuery(query.id, [{
		id: '0',
		type: 'article',
		title: 'Math result',
		description: result.toString(),
		message_text: "Math query: " + data + "\nResult: " + result
	}], {cache_time: 0});
});

// Functions

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;

	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else
		datetime = "Language not specified";
	if (obj == true)
		datetime = new Date(datetime);
	return datetime;
}