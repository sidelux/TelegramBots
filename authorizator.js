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

var token = config.authorizatortoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/authorizator/bot" + token;
var port = 25007;

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
	user: config.dbuser_authorizator,
	password: config.dbpassword_authorizator,
	database: config.dbdatabase_authorizator
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_authorizator,
	password: config.dbpassword_authorizator,
	database: config.dbdatabase_authorizator
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

var mark = {
	parse_mode: "Markdown"
};

var html = {
	parse_mode: "HTML"
};

bot.on('message', function (message) {
	if ((message.text != undefined) && (message.text.startsWith("/") && !(message.text.startsWith("//"))))
		console.log(getNow("it") + " - " + (message.from.username == undefined ? message.from.id : message.from.username) + ": " + message.text);
	
	/* troppo pesante?
	if (message.chat.id < 0){
		bot.getChat(message.chat.id).then(function (data) {
			connection.query('UPDATE user_group SET group_title = "' + data.title + '" WHERE group_chat_id = "' + data.id + '"', function (err, rows, fields) {
				if (err) throw err;
			});
		});
	}
	*/
	
	// Configurazione
	if (message.new_chat_members != undefined) {
		if (message.new_chat_member.username = "authorizatorbot"){
			if (message.chat.id > 0){
				bot.sendMessage(message.from.id, "Aggiungi il bot ad un gruppo per avviare l'associazione.");
				return;
			}
			bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
				if ((data.status == "creator") || (data.status == "administrator")) {
					connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
						if (err) throw err;
						if (Object.keys(rows).length == 0)
							return;
						var user_id = rows[0].id;
						connection.query('SELECT 1 FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
							if (err) throw err;
							if (Object.keys(rows).length > 0) {
								bot.sendMessage(message.from.id, "Questo gruppo è stato già associato ad un utente.");
								return;
							}

							bot.getChat(message.chat.id).then(function (data) {
								connection.query('INSERT INTO user_group (user_id, group_chat_id, group_title) VALUES (' + user_id + ', "' + message.chat.id + '", "' + escape(data.title) + '")', function (err, rows, fields) {
									if (err) throw err;
									bot.sendMessage(message.from.id, "Hai associato il gruppo <b>" + message.chat.title + "</b>, ora impostalo come amministratore in modo che possa agire sugli utenti.", html);
									bot.sendMessage(message.chat.id, message.from.username + " hai completato l'associazione con questo gruppo, ora continua la configurazione in privato.");
								});
							});
						});
					});
				} else {
					bot.sendMessage(message.from.id, "Puoi associare il bot ad un gruppo solo se sei amministratore di quest'ultimo.");
					return;
				}
			});
		} else if (message.new_chat_member.is_bot == false){
			connection.query('SELECT active FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) 
					return;
				
				var active = rows[0].active;
				if (active == 1){
					var options = {can_send_messages: false, can_send_media_messages: false, can_send_other_messages: false, can_add_web_page_previews: false};
					bot.restrictChatMember(message.chat.id, message.new_chat_member.id, options).then(function (data) {
						if (data == true){
							// mutato
							var iKeys = [];
							iKeys.push([{
								text: "Avvia",
								url: "https://telegram.me/authorizatorbot?start=" + message.chat.id
							}]);
							bot.sendMessage(message.chat.id, "Avvia il bot in privato cliccando sul pulsante sottostante e segui le istruzioni per essere smutato.", {
								parse_mode: 'Markdown',
								reply_markup: {
									inline_keyboard: iKeys
								}
							});
						}
					});
				}
			});
		}
	}
});

bot.onText(/^\/new/, function (message) {
	var iKeys = [];
	iKeys.push([{
		text: "Aggiungi ad un gruppo",
		url: "https://telegram.me/authorizatorbot?startgroup="
	}]);

	bot.sendMessage(message.chat.id, "Per associare un gruppo usa il pulsante qui sotto", {
		parse_mode: 'Markdown',
		reply_markup: {
			inline_keyboard: iKeys
		}
	});
});

bot.onText(/^\/config/, function (message) {
	connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		connection.query('SELECT group_chat_id, group_title FROM user_group WHERE user_id = ' + user_id, function (err, rows, fields) {
			if (err) throw err;
			
			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, "Nessun gruppo associato al tuo account, utilizza /new per associarne uno nuovo.");
				return;
			}
			
			var iKeys = [];
			for (var i = 0, len = Object.keys(rows).length; i < len; i++) {
				iKeys.push([{
					text: rows[i].group_title,
					callback_data: "manage:" + rows[i].group_chat_id
				}]);
			}
			
			bot.sendMessage(message.chat.id, "Seleziona il gruppo da gestire", {
				parse_mode: 'Markdown',
				reply_markup: {
					inline_keyboard: iKeys
				}
			});
		});
	});
});

bot.onText(/^\/start$|^\/start@authorizatorbot|^\/start (.+)/, function (message, match) {
	var rows = connection_sync.query('SELECT 1 FROM user WHERE account_id = ' + message.from.id);
	if (Object.keys(rows).length == 0)
		connection_sync.query('INSERT INTO user (account_id) VALUES (' + message.from.id + ')');
	
	if (match[1] != undefined){
		var group_chat_id = match[1];
		connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
			var user_id = rows[0].id;
			connection.query('SELECT active, button FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					bot.sendMessage(message.chat.id, "Il gruppo per l'accesso non esiste.");
					return;
				}

				connection.query('SELECT validated, button FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
					if (err) throw err;
					
					if (Object.keys(rows).length == 0) {
						connection.query('INSERT INTO user_validated (user_id, group_chat_id) VALUES (' + user_id + ', "' + group_chat_id + '")', function (err, rows, fields) {
							if (err) throw err;
						});
					}
					
					// validazione
				});
			});
		});
	} else {
		bot.sendMessage(message.chat.id, "Benvenuto...");
	}
});

bot.on('callback_query', function (message) {
	var data = message.data;
	if (data.indexOf(":") == -1)
		return;
	var split = data.split(":");
	var function_name = split[0];
	var group_chat_id = split[1];
	connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		connection.query('SELECT active, button FROM user_group WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				bot.answerCallbackQuery(message.id, {text: 'Non sei autorizzato a gestire questo gruppo.'});
				return;
			}
			
			var active = rows[0].active;
			var button = rows[0].button;
			
			if (function_name == "manage"){
				var iKeys = [];
				if (active == 1){
					iKeys.push([{
						text: "Disattiva mute automatico",
						callback_data: "active:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "Attiva mute automatico",
						callback_data: "active:" + group_chat_id
					}]);
				}
				if (button == 1){
					iKeys.push([{
						text: "Disattiva pulsante",
						callback_data: "button:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "Attiva pulsante",
						callback_data: "button:" + group_chat_id
					}]);
				}

				bot.editMessageText("Gestione del gruppo", {
					chat_id: message.message.chat.id,
					message_id: message.message.message_id,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: iKeys
					}
				});
				
				bot.answerCallbackQuery(message.id, {text: 'Ok'});
			} else if (function_name == "active"){
				var iKeys = [];
				iKeys.push([{
					text: "Indietro",
					callback_data: "manage:" + group_chat_id
				}]);

				bot.editMessageText("Gestione del gruppo", {
					chat_id: message.message.chat.id,
					message_id: message.message.message_id,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: iKeys
					}
				});
				
				if (active == 1){
					connection.query('UPDATE user_group SET active = 0 WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});
					bot.answerCallbackQuery(message.id, {text: 'Mute automatico disattivato!'});
				} else {
					connection.query('UPDATE user_group SET active = 1 WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});
					bot.answerCallbackQuery(message.id, {text: 'Mute automatico attivato!'});
				}
			} else if (function_name == "button"){
				var iKeys = [];
				iKeys.push([{
					text: "Indietro",
					callback_data: "manage:" + group_chat_id
				}]);

				bot.editMessageText("Gestione del gruppo", {
					chat_id: message.message.chat.id,
					message_id: message.message.message_id,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: iKeys
					}
				});
				
				if (active == 1){
					connection.query('UPDATE user_group SET button = 0 WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});
					bot.answerCallbackQuery(message.id, {text: 'Validazione pulsante disattivata!'});
				} else {
					connection.query('UPDATE user_group SET button = 1 WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});
					bot.answerCallbackQuery(message.id, {text: 'Validazione pulsante attivata!'});
				}
			}
		});
	});
});

// Funzioni

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}

function formatNumber(num) {
	return ("" + num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, function ($1) {
		return $1 + "."
	});
}

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;

	if (lang == "it") {
		var datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		var datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else
		var datetime = "Lingua non specificata";
	if (obj == true)
		datetime = new Date(datetime);
	return datetime;
}