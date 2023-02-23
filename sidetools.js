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
var bodyParser = require('body-parser');
var mysql = require('mysql');
var mysql_sync = require('sync-mysql');
const { exit } = require('process');
const { Configuration, OpenAIApi } = require("openai");

console.log('Connecting bot...');

var connection = mysql.createConnection({
	host: config.dbhost,
	user: config.dbuser_side,
	password: config.dbpassword_side,
	database: config.dbdatabase_side
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_side,
	password: config.dbpassword_side,
	database: config.dbdatabase_side
});

setInterval(function () {
	connection.query('SELECT 1');
	connection_sync.query('SELECT 1');
}, 60000);

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
	bot.sendMessage(message.chat.id, "Bot realizzato per fornire particolari funzionalità nei gruppi, creato da @fenix45.");
	if (message.text != undefined)
		console.log(getNow("it") + " " + message.from.username + " - " + message.text);
});

var originalText1 = "Ci sei per giocare oggi? 👀";
var originalText2 = "Ci sarai all'allenamento di stasera? 🔥";

bot.onText(/^\/presenze/i, function (message) {
	console.log(getNow("it") + " " + message.from.username + " - " + message.text);
	let now = new Date();
	let now_day = now.getFullYear() + "-" + addZero(now.getMonth()+1) + "-" + now.getDate();
	var poll_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM partecipation WHERE add_date LIKE '" + now_day + "%' AND chat_id = '" + message.chat.id + "'")[0].cnt;
	if (poll_cnt > 0) {
		bot.sendMessage(message.chat.id, "Oggi è stato già pubblicato un sondaggio!");
		return;
	}
	var partecipation_id = connection_sync.query("SELECT MAX(id)+1 As new_id FROM partecipation")[0].new_id;
	if (partecipation_id == null)
		partecipation_id = 1;
	if (message.chat.id == "-461536160") {
		var iKeys = [];
		iKeys.push([{
			text: "Sì",
			callback_data: partecipation_id + ":partecipation:yes"
		},{
			text: "No",
			callback_data: partecipation_id + ":partecipation:no"
		},{
			text: "Forse",
			callback_data: partecipation_id + ":partecipation:maybe"
		}],[{
			text: "20:30",
			callback_data: partecipation_id + ":partecipation:2030"
		},{
			text: "21:00",
			callback_data: partecipation_id + ":partecipation:2100"
		},{
			text: "21:30",
			callback_data: partecipation_id + ":partecipation:2130"
		},{
			text: "22:00",
			callback_data: partecipation_id + ":partecipation:2200"
		}]);
		bot.deleteMessage(message.chat.id, message.message_id);
		bot.sendMessage(message.chat.id, originalText1, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: iKeys
			}
		}).then(function (msg) {
			connection.query("INSERT INTO partecipation (chat_id, message_id) VALUES (" + msg.chat.id + ", " + msg.message_id + ")", function (err, rows) {
				if (err) throw err;
			});
			bot.unpinAllChatMessages(msg.chat.id).then(function (data) {
				bot.pinChatMessage(msg.chat.id, msg.message_id, {disable_notification: true});
			});
		});
	} else if (message.chat.id == "-1001865921442") {
		var iKeys = [];
		iKeys.push([{
			text: "Sì",
			callback_data: partecipation_id + ":partecipation:yes"
		},{
			text: "No",
			callback_data: partecipation_id + ":partecipation:no"
		}]);
		bot.deleteMessage(message.chat.id, message.message_id);
		bot.sendMessage(message.chat.id, originalText2, {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: iKeys
			}
		}).then(function (msg) {
			connection.query("INSERT INTO partecipation (chat_id, message_id) VALUES (" + msg.chat.id + ", " + msg.message_id + ")", function (err, rows) {
				if (err) throw err;
			});
			bot.pinChatMessage(msg.chat.id, msg.message_id, {disable_notification: true});
		});
	}
});

bot.onText(/^\/partecipanti (.+)/i, function (message, match) {
	if ((message.chat.id != "-461536160") || (message.message_id != "-1001865921442"))
		return;

	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status != 'creator') && (data.status != 'administrator')) {
			bot.sendMessage(message.chat.id, "Non hai i permessi per usare questo comando!");
			return;
		}

		var partecipants = parseInt(match[1]);
		if (isNaN(partecipants) || (partecipants < 1)) {
			bot.sendMessage(message.chat.id, "Mi sa che il numero inserito non va bene...");
			return;
		}

		var chat_id = message.chat.id;
		connection.query("SELECT id FROM partecipation_chat WHERE chat_id = " + message.chat.id, function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				connection.query("INSERT INTO partecipation_chat (chat_id, partecipants) VALUES ('" + chat_id + "', " + partecipants + ")", function (err, rows) {
					if (err) throw err;
					bot.sendMessage(message.chat.id, "Partecipanti totali caricati!");
				});
			} else {
				connection.query("UPDATE partecipation_chat SET partecipants = " + partecipants + " WHERE id = " + rows[0].id, function (err, rows) {
					if (err) throw err;
					bot.sendMessage(message.chat.id, "Partecipanti totali aggiornati!");
				});
			}
		});
	});
});

bot.on('callback_query', function (message) {
	let data = message.data;
	if (data.indexOf(":") == -1)
		return;
	let split = data.split(":");
	let id = split[0]
	let fun = split[1];
	let param = split[2];
	var username = "";
	if (message.from.username == undefined)
		username = message.from.first_name;
	else
		username = "@" + message.from.username;
	let user_id = message.from.id;
	if (fun == "partecipation") {
		connection.query("SELECT add_date FROM partecipation WHERE id = " + id, function (err, rows) {
			if (err) throw err;
			let add_date = new Date(Date.parse(rows[0].add_date));
			let now = new Date();
			if (add_date.getFullYear() + "-" + (add_date.getMonth()+1) + "-" + add_date.getDate() != now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate()) {
				bot.answerCallbackQuery(message.id, {text: "Sondaggio scaduto!"});
				return;
			}

			connection.query("SELECT id, user_id, response, time FROM partecipation_user WHERE partecipation_id = " + id + " AND user_id = " + user_id, function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					if (isNaN(param)) {
						connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response) VALUES (" + id + ", " + user_id + ", '" + username + "', '" + param + "')", function (err, rows) {
							if (err) throw err;
							printPartecipations(message, id);
						});
					} else {
						connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response, time) VALUES (" + id + ", " + user_id + ", '" + username + "', 'yes', '" + param + "')", function (err, rows) {
							if (err) throw err;
							printPartecipations(message, id);
						});
					}
					bot.answerCallbackQuery(message.id, {text: "Ok!"});
				} else {
					let partecipation_user_id = rows[0].id;
					let response = rows[0].response;
					let time = rows[0].time;
					if (response == param) {
						bot.answerCallbackQuery(message.id, {text: "Hai già votato questa opzione!"});
					} else if (time == param) {
						connection.query("UPDATE partecipation_user SET time = NULL WHERE id = " + partecipation_user_id, function (err, rows) {
							if (err) throw err;
							printPartecipations(message, id);
						});
						bot.answerCallbackQuery(message.id, {text: "Orario rimosso!"});
					} else {
						if (isNaN(param)) {
							connection.query("UPDATE partecipation_user SET response = '" + param + "' WHERE id = " + partecipation_user_id, function (err, rows) {
								if (err) throw err;
								printPartecipations(message, id);
							});
						} else {
							connection.query("UPDATE partecipation_user SET time = '" + param + "' WHERE id = " + partecipation_user_id, function (err, rows) {
								if (err) throw err;
								printPartecipations(message, id);
							});
						}
						bot.answerCallbackQuery(message.id, {text: "Ok!"});
					}
				}
			});
		});
	}
});

bot.onText(/^\/openai (.+)/i, async function (message, match) {
	if (message.chat.id < 0)
		return;

	const configuration = new Configuration({
		apiKey: "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",
	});
	const openai = new OpenAIApi(configuration);

	var input =  match[1];
	console.log("Input: " + input);
	var output = "";
	var last_output = "";
	var times = 0;
	
	while (1) {
		times++;
		const completion = await openai.createCompletion({
			model: "text-davinci-003",
			prompt: input,
			max_tokens: 512,
			temperature: 0.7
		});
		last_output = completion.data.choices[0].text;
		output = last_output;
		if (input == input+output)
			break;
		input += output;
		if ((input+output).length >= 3500) {
			console.log("Blocco per caratteri tg");
			break;
		}
	}

	if (times == 1)
		bot.sendMessage(message.chat.id, input+output, {parse_mode: "markdown"});
	else
		bot.sendMessage(message.chat.id, input, {parse_mode: "markdown"});
	console.log("Output dopo " + times + " chiamate");
});

function printPartecipations(message, id) {
	connection.query("SELECT partecipants FROM partecipation_chat WHERE chat_id = '" + message.message.chat.id + "'", function (err, rows) {
		if (err) throw err;
		var total_partecipants = -1;
		if (Object.keys(rows).length > 0)
			total_partecipants = rows[0].partecipants;
		connection.query("SELECT username, response, time FROM partecipation_user WHERE partecipation_id = " + id, function (err, rows) {
			if (err) throw err;
			var voted_partecipations = Object.keys(rows).length;
			
			if (message.message.chat.id == "-461536160") {
				var newText = originalText1 + "\n\n";

				var c = 0;
				var partText = "";
				for (var i = 0; i < Object.keys(rows).length; i++) {
					if (rows[i].response == "yes") {
						var time = "";
						if (rows[i].time != null)
							time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
						partText += rows[i].username + time + "\n";
						c++;
					}
				}
				if (c > 0)
					newText += "Sì:\n" + partText + "\n";

				var c = 0;
				var partText = "";
				for (var i = 0; i < Object.keys(rows).length; i++) {
					if (rows[i].response == "maybe") {
						var time = "";
						if (rows[i].time != null)
							time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
						partText += rows[i].username + time + "\n";
						c++;
					}
				}
				if (c > 0)
					newText += "Forse:\n" + partText + "\n";

				var c = 0;
				var partText = "";
				for (var i = 0; i < Object.keys(rows).length; i++) {
					if (rows[i].response == "no") {
						var time = "";
						if (rows[i].time != null)
							time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
						partText += rows[i].username + time + "\n";
						c++;
					}
				}
				if (c > 0)
					newText += "No:\n" + partText + "\n";

				var iKeys = [];
				iKeys.push([{
					text: "Sì",
					callback_data: id + ":partecipation:yes"
				},{
					text: "No",
					callback_data: id + ":partecipation:no"
				},{
					text: "Forse",
					callback_data: id + ":partecipation:maybe"
				}],[{
					text: "20:30",
					callback_data: id + ":partecipation:2030"
				},{
					text: "21:00",
					callback_data: id + ":partecipation:2100"
				},{
					text: "21:30",
					callback_data: id + ":partecipation:2130"
				},{
					text: "22:00",
					callback_data: id + ":partecipation:2200"
				}]);
			} else if (message.message.chat.id == "-1001865921442") {
				var newText = originalText2 + "\n\n";

				var c = 0;
				var partText = "";
				for (var i = 0; i < Object.keys(rows).length; i++) {
					if (rows[i].response == "yes") {
						var time = "";
						if (rows[i].time != null)
							time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
						partText += rows[i].username + time + "\n";
						c++;
					}
				}
				if (c > 0)
					newText += "Sì:\n" + partText + "\n";

				var c = 0;
				var partText = "";
				for (var i = 0; i < Object.keys(rows).length; i++) {
					if (rows[i].response == "no") {
						var time = "";
						if (rows[i].time != null)
							time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
						partText += rows[i].username + time + "\n";
						c++;
					}
				}
				if (c > 0)
					newText += "No:\n" + partText + "\n";

				var iKeys = [];
				iKeys.push([{
					text: "Sì",
					callback_data: id + ":partecipation:yes"
				},{
					text: "No",
					callback_data: id + ":partecipation:no"
				}]);
			}

			if (total_partecipants != -1)
				newText += "Votanti: " + voted_partecipations + "/" + total_partecipants;

			bot.editMessageText(newText, {chat_id: message.message.chat.id, message_id: message.message.message_id, parse_mode: 'HTML', reply_markup: {inline_keyboard: iKeys}});
			bot.answerCallbackQuery(message.id, {text: "Ok!"});
		});
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

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}
