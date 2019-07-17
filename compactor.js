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

console.log('Connecting bot...');

var token = config.compactortoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/compactor/bot" + token;
var port = 25005;

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

var mergeMessages = [];

bot.on('message', function (message) {
	if (message.chat.id < 0) {
		if (message.text != undefined)		
			if (message.text.startsWith("/"))
				console.log(getNow("it") + " - " + message.from.username + ": " + message.text);
		if ((message.from.is_bot == 0) && (message.text != undefined) && (message.text.indexOf("http") == -1)){
			if ((message.reply_to_message == undefined) && (!message.text.startsWith("/")) && (message.forward_date == undefined)){
				if ((mergeMessages[message.chat.id] != undefined) && (mergeMessages[message.chat.id] != "")){
					if (mergeMessages[message.chat.id].split(";")[0] == message.from.id){
						bot.deleteMessage(message.chat.id, mergeMessages[message.chat.id].split(";")[1]);
						bot.deleteMessage(message.chat.id, message.message_id);
						var newText = mergeMessages[message.chat.id].split(";")[2] + "\n" + message.text;
						bot.sendMessage(message.chat.id, "@" + message.from.username + " <i>scrive</i>:\n" + newText, html).then(function (data) {
							mergeMessages[message.chat.id] = message.from.id + ";" + data.message_id + ";" + newText;
						});
					} else
						mergeMessages[message.chat.id] = message.from.id + ";" + message.message_id + ";" + message.text;
				} else
					mergeMessages[message.chat.id] = message.from.id + ";" + message.message_id + ";" + message.text;
			} else
				mergeMessages[message.chat.id] = "";	// skip replies, commands and forwards
		} else
			mergeMessages[message.chat.id] = "";	// skip bots
	}
});

bot.on('edited_message', function (message) {
	if (message.chat.id < 0) {
		if ((mergeMessages[message.chat.id] != undefined) && (mergeMessages[message.chat.id] != "")){
			if (mergeMessages[message.chat.id].split(";")[0] == message.from.id){
				var lastIdx = mergeMessages[message.chat.id].lastIndexOf(";");
				mergeMessages[message.chat.id] = mergeMessages[message.chat.id].substr(0, lastIdx+1);
				mergeMessages[message.chat.id] += message.text;
			}
		}
	}
});

bot.onText(/^\/start/i, function (message) {	
	bot.sendMessage(message.chat.id, "<b>Welcome to The Compactor!</b>\n\nAdd this bot to groups to compact consequential messages into one to avoid flood.\n\n<b>Important: You must set the bot as admin!</b>", html);
});

bot.onText(/^\/check/i, function (message) {
	if (message.chat.id < 0) {
		bot.sendMessage(message.chat.id, "If you can see the command you have written, The Compactor is not an Admin and will not work in this group.", html);
		bot.deleteMessage(message.chat.id, message.message_id);
	} else
		bot.sendMessage(message.chat.id, "You can use this command only in a group");
});

// Functions

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