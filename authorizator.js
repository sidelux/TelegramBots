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
var captchaPng = require('captchapng');
var striptags = require('striptags');

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

	// Debug
	// console.log(message);

	// Configurazione
	if (message.new_chat_members != undefined) {
		if (message.new_chat_member.username == "authorizatorbot"){
			if (message.chat.id > 0){
				bot.sendMessage(message.from.id, "Aggiungi il bot ad un gruppo per avviare l'associazione.");
				return;
			}
			bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
				if ((data.status == "creator") || (data.status == "administrator")) {
					var rows = connection_sync.query('SELECT 1 FROM user WHERE account_id = ' + message.from.id);
					if (Object.keys(rows).length == 0)
						connection_sync.query('INSERT INTO user (account_id) VALUES (' + message.from.id + ')');

					connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
						if (err) throw err;
						if (Object.keys(rows).length == 0){
							console.log("Utente non esistente")
							return;
						}
						var user_id = rows[0].id;
						connection.query('SELECT 1 FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
							if (err) throw err;
							if (Object.keys(rows).length > 0) {
								bot.sendMessage(message.from.id, "Questo gruppo è stato già associato ad un utente.");
								return;
							}

							connection.query('INSERT INTO user_group (user_id, group_chat_id, group_title) VALUES (' + user_id + ', "' + message.chat.id + '", "' + message.chat.title + '")', function (err, rows, fields) {
								if (err) throw err;
								bot.sendMessage(message.from.id, "Hai associato il gruppo <b>" + message.chat.title + "</b>, ora impostalo come amministratore in modo che possa agire sugli utenti.\nDopo di che, usa <b>/config</b> per configurarlo.", html);
								var iKeys = [];
								iKeys.push([{
									text: "Vai in privato 👀",
									url: "https://telegram.me/authorizatorbot"
								}]);
								bot.sendMessage(message.chat.id, "<b>" + message.from.username + "</b> hai completato l'associazione con questo gruppo, ora continua la configurazione in privato.", {
									parse_mode: 'HTML',
									reply_markup: {
										inline_keyboard: iKeys
									}
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
			var rows = connection_sync.query('SELECT id FROM user WHERE account_id = ' + message.from.id);
			if (Object.keys(rows).length == 0) {
				var rows = connection_sync.query('SELECT MAX(id) As mx FROM user');
				var current_id = rows[0].mx+1;
				connection_sync.query('INSERT INTO user (id, account_id) VALUES (' + current_id + ', ' + message.from.id + ')');
			} else {
				var current_id = rows[0].id;
			}

			var rows = connection_sync.query('SELECT 1 FROM user_validated WHERE user_id = ' + current_id);
			if (Object.keys(rows).length == 0)
				connection_sync.query('INSERT INTO user_validated (user_id, group_chat_id) VALUES (' + current_id + ', "' + message.chat.id + '")');

			connection.query('SELECT active, welcome_msg FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0){
					console.log("Gruppo non esistente");
					return;
				}

				var active = rows[0].active;
				var welcome_msg = rows[0].welcome_msg;
				if (active == 1){
					connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
						if (err) throw err;
						var user_id = rows[0].id;
						connection.query('SELECT validated FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
							if (err) throw err;
							if (rows[0].validated == 0){
								var options = {can_send_messages: false, can_send_media_messages: false, can_send_other_messages: false, can_add_web_page_previews: false};
								bot.restrictChatMember(message.chat.id, message.new_chat_member.id, options).then(function (data) {
									if (data == true){
										// mutato
										var iKeys = [];
										iKeys.push([{
											text: "Avvia",
											url: "https://telegram.me/authorizatorbot?start=" + message.chat.id
										}]);
										if (welcome_msg == null)
											welcome_msg = message.from.username + ", avvia il bot in privato cliccando sul pulsante sottostante e segui le istruzioni per validarti ed essere smutato in questo gruppo!";

										welcome_msg = welcome_msg.replace("/{user}/g", message.from.username);

										bot.sendMessage(message.chat.id, welcome_msg, {
											parse_mode: 'HTML',
											reply_markup: {
												inline_keyboard: iKeys
											}
										});
									}
								});
							} else {
								bot.sendMessage(message.chat.id, "Validazione già eseguita in questo gruppo, accesso consentito.");
							}
						});
					});
				} else
					console.log("Controllo non attivo");
			});
		}
	}

	if (message.chat.id > 0){
		connection.query('SELECT id, edit_welcome_group FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0)
				return;
			var user_id = rows[0].id;

			if (rows[0].edit_welcome_group != null){
				connection.query('UPDATE user_group SET welcome_msg = "' + message.text + '" WHERE id = ' + rows[0].edit_welcome_group, function (err, rows, fields) {
					if (err) throw err;
					connection.query("UPDATE user SET edit_welcome_group = NULL WHERE id = " + user_id, function (err, rows, fields) {
						if (err) throw err;
						bot.sendMessage(message.chat.id, "Messaggio di benvenuto impostato!\nPuoi continuare ad impostare il bot tramite i pulsanti del messaggio precedente.");
					});
				});
			}
		});
	}
});

bot.onText(/^\/new/, function (message) {
	if (message.chat.id < 0){
		bot.sendMessage(message.chat.id, "La configurazione può essere effettuata solamente in chat privata.");
		return;
	}
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

bot.onText(/^\/config$/, function (message) {
	if (message.chat.id < 0){
		bot.sendMessage(message.chat.id, "La configurazione può essere effettuata solamente in chat privata.");
		return;
	}
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

			bot.sendMessage(message.chat.id, "Seleziona il gruppo da gestire.\nPotrai attivare o disattivare il bot, aggiungerne validazioni ed altro.", {
				parse_mode: 'Markdown',
				reply_markup: {
					inline_keyboard: iKeys
				}
			});
		});
	});
});

bot.onText(/^\/start$|^\/start@authorizatorbot|^\/start (.+)/, function (message, match) {
	if (message.chat.id < 0){
		bot.sendMessage(message.chat.id, "Il bot può essere effettuata solamente in chat privata.");
		return;
	}

	if (match[1] != undefined){
		var group_chat_id = match[1];
		connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			var user_id = rows[0].id;
			connection.query('SELECT button, propic, username, captcha, lang FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					bot.sendMessage(message.chat.id, "Il gruppo per l'accesso non esiste.");
					return;
				}

				var button_req = rows[0].button;
				var propic_req = rows[0].propic;
				var username_req = rows[0].username;
				var captcha_req = rows[0].captcha;
				var lang_req = rows[0].lang;

				var reqN = 0;
				if (button_req == 1)
					reqN++;
				if (propic_req == 1)
					reqN++;
				if (username_req == 1)
					reqN++;
				if (captcha_req == 1)
					reqN++;
				if (lang_req != null)
					reqN++;

				connection.query('SELECT button, propic, username, captcha, lang FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
					if (err) throw err;

					if (Object.keys(rows).length == 0) {
						console.log("Errore user_validated non trovato");
						return;
					}

					// Validazione utente

					var button = rows[0].button;
					var propic = rows[0].propic;
					var username = rows[0].username;
					var captcha = rows[0].captcha;
					var lang = rows[0].lang;

					bot.sendMessage(message.chat.id, "Il gruppo al quale hai effettuato l'accesso richiede <b>" + reqN + "</b> diverse azioni da essere completate prima di poter scrivere al suo interno.\nUna volta completate sarai automaticamente smutato dal gruppo.", html);

					if ((button == 0) && (button_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: "🔐 Completa",
							callback_data: "button_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, "Clicca il pulsante sottostante per completare questa azione.", {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}

					if ((propic == 0) && (propic_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: "🔐 Completa",
							callback_data: "propic_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, "Se hai impostato l'immagine del profilo, clicca il pulsante sottostante per completare questa azione.", {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}

					if ((username == 0) && (username_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: "🔐 Completa",
							callback_data: "username_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, "Se hai impostato l'username, clicca il pulsante sottostante per completare questa azione.", {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}

					if ((captcha == 0) && (captcha_req == 1)){
						var num = parseInt(Math.random()*900000+100000);
						var img = new captchaPng(300, 100, num);
						img.color(0, 0, 0, 0);
						img.color(80, 80, 80, 255);

						var iKeys = [];
						iKeys.push([{
							text: num,
							callback_data: "captcha_val:" + group_chat_id + ":1"
						}]);
						var val = parseInt(Math.random()*900000+100000);
						iKeys.push([{
							text: val,
							callback_data: "captcha_val:" + group_chat_id + ":0"
						}]);
						val = parseInt(Math.random()*900000+100000);
						iKeys.push([{
							text: val,
							callback_data: "captcha_val:" + group_chat_id + ":0"
						}]);
						val = parseInt(Math.random()*900000+100000);
						iKeys.push([{
							text: val,
							callback_data: "captcha_val:" + group_chat_id + ":0"
						}]);
						val = parseInt(Math.random()*900000+100000);
						iKeys.push([{
							text: val,
							callback_data: "captcha_val:" + group_chat_id + ":0"
						}]);

						iKeys = shuffle(iKeys);

						var fileOpts = {
							filename: 'image',
							contentType: 'image/png',
							caption: 'Clicca il pulsante corrispondente al captcha per poter continuare e completare questa azione.',
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						};

						bot.sendPhoto(message.chat.id, Buffer.from(img.getBase64(), 'base64'), fileOpts);
					}
					
					console.log(lang, lang_req);

					if ((lang == 0) && (lang_req != null)){
						var iKeys = [];
						iKeys.push([{
							text: "🔐 Completa",
							callback_data: "lang_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, "Verrà controllata la tua lingua impostata, clicca il pulsante sottostante per completare questa azione.", {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}
				});
			});
		});
	} else {
		connection.query('SELECT COUNT(id) As cnt FROM user_group', function (err, rows, fields) {
			if (err) throw err;
			var group_cnt = rows[0].cnt;

			connection.query('SELECT COUNT(id) As cnt FROM user_validated', function (err, rows, fields) {
				if (err) throw err;
				var user_cnt = rows[0].cnt;

				fs.stat("authorizator.js", function(err, stats){
					var time = new Date(stats.mtime);

					bot.sendMessage(message.chat.id, "Benvenuto in *Authorizator*!\n\nPuoi collegare un nuovo gruppo con il comando /new ed entrare nella gestione con il comando /config.\n\n" + formatNumber(group_cnt) + " gruppi collegati, " + formatNumber(user_cnt) + " utenti autorizzati\n_Ultimo aggiornamento: " + toDate("it", time) + "_", mark);
				});
			});
		});
	}
});

bot.on('callback_query', function (message) {
	var data = message.data;
	if (data.indexOf(":") == -1)
		return;
	var split = data.split(":");
	var function_name = split[0];
	var group_chat_id = split[1];
	if (split.length > 2)
		var extra_param = split[2];
	connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		connection.query('SELECT id, user_id, group_title, welcome_msg, active, button, propic, username, captcha, lang FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				bot.answerCallbackQuery(message.id, {text: 'Errore info gruppo.'});
				return;
			}
			if ((rows[0].user_id != user_id) && (function_name == "manage")) {
				bot.answerCallbackQuery(message.id, {text: 'Non sei autorizzato a gestire questo gruppo.'});
				return;
			}

			var group_id = rows[0].id;
			var group_title = rows[0].group_title;
			var welcome_msg = rows[0].welcome_msg;
			var active = rows[0].active;
			var button = rows[0].button;
			var propic = rows[0].propic;
			var username = rows[0].username;
			var captcha = rows[0].captcha;
			var lang = rows[0].lang;

			if (function_name == "button_val") {
				connection.query('UPDATE user_validated SET button = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
					if (err) throw err;
					bot.editMessageText("Azione completata ✅", {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML'
					});
					checkComplete(message, user_id, group_chat_id);
					bot.answerCallbackQuery(message.id);
				});
			} else if (function_name == "propic_val") {
				bot.getUserProfilePhotos(message.from.id).then(function (data) {
					if (data.total_count > 0){
						connection.query('UPDATE user_validated SET propic = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
							if (err) throw err;
							bot.editMessageText("Azione completata ✅", {
								chat_id: message.message.chat.id,
								message_id: message.message.message_id,
								parse_mode: 'HTML'
							});
							checkComplete(message, user_id, group_chat_id);
							bot.answerCallbackQuery(message.id);
						});
					} else {
						bot.answerCallbackQuery(message.id, "Imposta l'immagine del profilo!");
					}
				});
			} else if (function_name == "username_val") {
				if (message.from.username != undefined){
					connection.query('UPDATE user_validated SET username = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageText("Azione completata ✅", {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, "Imposta l'username!");
				}
			} else if (function_name == "captcha_val") {
				if (extra_param == "1"){
					connection.query('UPDATE user_validated SET captcha = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageCaption("Azione completata ✅", {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, "Captcha non corrispondente!");
				}
			} else if (function_name == "lang_val") {
				if (message.from.language_code == lang){
					connection.query('UPDATE user_validated SET lang = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageText("Azione completata ✅", {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, "Lingua non corrispondente!");
				}
			} else {
				if (function_name == "welcome") {
					var iKeys = [];
					iKeys.push([{
						text: "🔙 Menu",
						callback_data: "clean:" + group_chat_id
					}]);
					if (welcome_msg != null) {
						iKeys.push([{
							text: "🚫 Cancella",
							callback_data: "welcomedel:" + group_chat_id
						}]);
					}

					connection.query('UPDATE user SET edit_welcome_group = ' + group_id + ' WHERE id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});

					if (welcome_msg == null)
						welcome_msg = "<i>Non impostato</i>";

					if (welcome_msg.length > 500)
						welcome_msg = striptags(welcome_msg).substr(0, 500) + "...";

					bot.editMessageText("Invia il testo che vorresti utilizzare all'ingresso degli utenti nel tuo gruppo.\nPuoi usare anche {user}, che verrà sostituito dal nome in caso mancasse.\nPuoi usare anche l'html.\n\nMessaggio di benvenuto attuale:\n" + welcome_msg, {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: iKeys
						}
					});

					bot.answerCallbackQuery(message.id);
					return;
				} else if (function_name == "welcomedel") {
					var iKeys = [];
					iKeys.push([{
						text: "🔙 Menu",
						callback_data: "clean:" + group_chat_id
					}]);

					connection.query('UPDATE user_group SET welcome_msg = NULL WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
					});

					bot.editMessageText("Messaggio di benvenuto cancellato!", {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: iKeys
						}
					});

					bot.answerCallbackQuery(message.id);
					return;
				} else if (function_name == "unlink") {
					var iKeys = [];
					iKeys.push([{
						text: "Conferma cancellazione",
						callback_data: "unlinkconf:" + group_chat_id
					}]);
					iKeys.push([{
						text: "🔙 Menu",
						callback_data: "manage:" + group_chat_id
					}]);

					bot.editMessageText("Se sei veramente sicuro di scollegare il gruppo, premi il pulsante sotto, ricorda che anche tutti gli utenti che hanno effettuato la validazione dovranno rifarlo.", {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: iKeys
						}
					});

					bot.answerCallbackQuery(message.id);
					return;
				} else if (function_name == "unlinkconf") {					
					bot.editMessageText("Gruppo scollegato!", {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML'
					});

					bot.answerCallbackQuery(message.id);
					return;
				} else if (function_name != "manage") {
					var param_value;
					if (function_name == "active"){
						if ((button == 0) && (propic == 0) && (username == 0) && (captcha == 0) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: 'Attiva prima almeno un metodo di validazione!'});
							return;
						}
						if (active == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: 'Mute automatico disattivato!'});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: 'Mute automatico attivato!'});
						}
						active = !active;
					} else if (function_name == "button"){
						if ((active == 1) && (button == 1) && (propic == 0) && (username == 0) && (captcha == 0) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: 'Disattiva prima il mute automatico!'});
							return;
						}
						if (button == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: 'Pulsante disattivato!'});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: 'Pulsante attivato!'});
						}
						button = !button;
					} else if (function_name == "propic"){
						if ((active == 1) && (button == 0) && (propic == 1) && (username == 0) && (captcha == 0) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: 'Disattiva prima il mute automatico!'});
							return;
						}
						if (propic == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: 'Immagine profilo obbligatoria disattivata!'});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: 'Immagine profilo obbligatoria attivata!'});
						}
						propic = !propic;
					} else if (function_name == "username"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 1) && (captcha == 0) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: 'Disattiva prima il mute automatico!'});
							return;
						}
						if (username == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: 'Username obbligatorio disattivato!'});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: 'Username obbligatorio attivato!'});
						}
						username = !username;
					} else if (function_name == "captcha"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 0) && (captcha == 1) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: 'Disattiva prima il mute automatico!'});
							return;
						}
						if (captcha == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: 'Captcha disattivato!'});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: 'Captcha attivato!'});
						}
						captcha = !captcha;
					} else if (function_name == "lang"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 0) && (captcha == 0) && (lang != null)){
							bot.answerCallbackQuery(message.id, {text: 'Disattiva prima il mute automatico!'});
							return;
						}
						if (message.from.language_code == undefined){
							bot.answerCallbackQuery(message.id, {text: 'Imposta la lingua del tuo client!'});
							return;
						}
						var langcode = message.from.language_code;
						if (lang != null){
							param_value = "NULL";
							lang = null;
							bot.answerCallbackQuery(message.id, {text: 'Controllo lingua disattivato!'});
						} else {
							param_value = "'" + langcode + "'";
							lang = langcode;
							bot.answerCallbackQuery(message.id, {text: 'Controllo lingua attivato (' + langcode + ')!'});
						}
					}

					if (function_name != "clean"){
						connection.query('UPDATE user_group SET ' + function_name + ' = ' + param_value + ' WHERE group_chat_id = "' + group_chat_id + '" AND user_id = ' + user_id, function (err, rows, fields) {
							if (err) throw err;
						});
					} else {
						connection.query('UPDATE user SET edit_welcome_group = NULL WHERE id = ' + user_id, function (err, rows, fields) {
							if (err) throw err;
						});
					}
				}

				var iKeys = [];
				iKeys.push([{
					text: "💬 Messaggio di benvenuto",
					callback_data: "welcome:" + group_chat_id
				}]);
				if (active == 1){
					iKeys.push([{
						text: "✅ Mute automatico",
						callback_data: "active:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Mute automatico",
						callback_data: "active:" + group_chat_id
					}]);
				}
				if (button == 1){
					iKeys.push([{
						text: "✅ Pulsante",
						callback_data: "button:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Pulsante",
						callback_data: "button:" + group_chat_id
					}]);
				}
				if (propic == 1){
					iKeys.push([{
						text: "✅ Immagine profilo obbligatoria",
						callback_data: "propic:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Immagine profilo obbligatoria",
						callback_data: "propic:" + group_chat_id
					}]);
				}
				if (username == 1){
					iKeys.push([{
						text: "✅ Username obbligatorio",
						callback_data: "username:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Username obbligatorio",
						callback_data: "username:" + group_chat_id
					}]);
				}
				if (captcha == 1){
					iKeys.push([{
						text: "✅ Captcha",
						callback_data: "captcha:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Captcha",
						callback_data: "captcha:" + group_chat_id
					}]);
				}
				if (lang != null){
					iKeys.push([{
						text: "✅ Lingua",
						callback_data: "lang:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 Lingua",
						callback_data: "lang:" + group_chat_id
					}]);
				}

				iKeys.push([{
					text: "🗑 Scollega gruppo",
					callback_data: "unlink:" + group_chat_id
				}]);

				// solo per test
				/*
				iKeys.push([{
					text: "♻️ Aggiorna",
					callback_data: "manage:" + group_chat_id
				}]);
				*/

				bot.editMessageText("Gestione del gruppo <b>" + group_title + "</b>\nSeleziona le funzionalità di verifica di attivare o disattivare quando un utente accede al gruppo.\nRicorda al termine della configurazione di attivare il <i>Mute automatico</i> per permettere al bot di funzionare correttamente.", {
					chat_id: message.message.chat.id,
					message_id: message.message.message_id,
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: iKeys
					}
				});

				bot.answerCallbackQuery(message.id);
			}
		});
	});
});

function checkComplete(message, user_id, group_chat_id){
	connection.query('SELECT active, button, propic, username, captcha, lang FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
		if (err) throw err;
		var button_req = rows[0].button;
		var propic_req = rows[0].propic;
		var username_req = rows[0].username;
		var captcha_req = rows[0].captcha;
		var lang_req = rows[0].lang;
		
		connection.query('SELECT button, propic, username, captcha, lang FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
			if (err) throw err;
			var button = rows[0].button;
			var propic = rows[0].propic;
			var username = rows[0].username;
			var captcha = rows[0].captcha;
			var lang = rows[0].lang;

			var validated = 1;

			if ((button_req == 1) && (button == 0))
				validated = 0;
			if ((propic_req == 1) && (propic == 0))
				validated = 0;
			if ((username_req == 1) && (username == 0))
				validated = 0;
			if ((captcha_req == 1) && (captcha == 0))
				validated = 0;
			if ((lang_req != null) && (lang == 0))
				validated = 0;

			// Smuta l'utente
			if (validated == 1){
				var options = {can_send_messages: true, can_send_media_messages: true, can_send_other_messages: true, can_add_web_page_previews: true};
				bot.restrictChatMember(group_chat_id, message.from.id, options).then(function (data) {
					if (data == true){
						connection.query('UPDATE user_validated SET validated = 1 WHERE user_id = ' + user_id, function (err, rows, fields) {
							if (err) throw err;
							bot.sendMessage(message.message.chat.id, "Hai <b>completato</b> correttamente tutte le azioni richieste!\nSei stato smutato dal gruppo.", html);
							bot.sendMessage(group_chat_id, "L'utente <b>" + message.from.username + "</b> ha completato correttamente tutte le azioni richieste!\nDi conseguenza è stato smutato dal gruppo.", html);
						});
					}
				});
			}
		});
	});
}

// Funzioni

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}

function shuffle(a) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
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

function toDate(lang, d) {
	if (lang == "it") {
		var datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		var datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else
		var datetime = "Lingua non specificata";
	return datetime;
}