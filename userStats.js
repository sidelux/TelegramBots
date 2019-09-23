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

var token = config.statstoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/stats/bot" + token;
var port = 25003;

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
	user: config.dbuser_stats,
	password: config.dbpassword_stats,
	database: config.dbdatabase_stats
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_stats,
	password: config.dbpassword_stats,
	database: config.dbdatabase_stats
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
var lang_main_3 = [];
var lang_stats_userinfo = [];
var lang_stats_usernotfound = [];
var lang_stats_notfound = [];
var lang_stats_userfound = [];
var lang_stats_username = [];
var lang_stats_msgcount = [];
var lang_stats_creation = [];
var lang_stats_update = [];
var lang_rank = [];
var lang_rank_group = [];
var lang_only_groups = [];
var lang_export_nodata = [];
var lang_export_sent = [];
var lang_only_admin = [];

lang_main_1["en"] = "<b>Welcome to User Stats Tracker Bot!</b>\n\nAdd this bot to groups to store messages count <b>globally</b>, last message date and last username for each user, then use <i>inline mode</i> with username or account id to view user informations.\n\nMore than ";
lang_main_1["it"] = "<b>Benvenuto nell'User Stats Tracker Bot!</b>\n\nAggiungi questo bot ai tuoi gruppi per contare messaggi in modo <b>globale</b>, la data dell'ultimo messaggio e l'ultimo username utilizzato dall'utente, poi con l'<i>inline mode</i> puoi visualizzare queste informazioni inserendo l'username o l'account id.\n\nPiù di ";
lang_main_2["en"] = " messages counted";
lang_main_2["it"] = " messaggi inviati";
lang_main_3["en"] = " in this group";
lang_main_3["it"] = " in questo gruppo";
lang_stats_userinfo["en"] = "Send user informations";
lang_stats_userinfo["it"] = "Invia informazioni utente";
lang_stats_usernotfound["en"] = "User not found";
lang_stats_usernotfound["it"] = "Utente non trovato";
lang_stats_notfound["en"] = "not found";
lang_stats_notfound["it"] = "non trovato";
lang_stats_userfound["en"] = "User found";
lang_stats_userfound["it"] = "Utente trovato";
lang_stats_username["en"] = "Username";
lang_stats_username["it"] = "Nome utente";
lang_stats_msgcount["en"] = "Messages count";
lang_stats_msgcount["it"] = "Numero messaggi";
lang_stats_creation["en"] = "Creation date";
lang_stats_creation["it"] = "Data creazione";
lang_stats_update["en"] = "Last update date";
lang_stats_update["it"] = "Ultimo aggiornamento";
lang_rank["it"] = "Classifica Globale";
lang_rank["en"] = "Global Leaderboard";
lang_rank_group["it"] = "Classifica Gruppo";
lang_rank_group["en"] = "Group Leaderboard";
lang_only_groups["it"] = "Questo comando funziona solo nei gruppi";
lang_only_groups["en"] = "This command works only in groups";
lang_export_nodata["it"] = "Non ci sono dati relativi agli utenti legati a questo gruppo";
lang_export_nodata["en"] = "Not enough users data for this group";
lang_export_sent["it"] = "File inviato in privato";
lang_export_sent["en"] = "File sent in private chat";
lang_only_admin["it"] = "Questo comando può essere usato solo da un amministratore del gruppo";
lang_only_admin["en"] = "This command can be only used by a group administrator";

bot.on('message', function (message) {
	if (message.text != undefined){
		if (message.chat.id < 0){
			var user = null;
			if (message.from.username != undefined)
				user = '"' + message.from.username + '"';
			var rows = connection_sync.query('UPDATE stats SET message_count = message_count+1, last_username = ' + user + ' WHERE account_id = ' + message.from.id);
			if (rows.affectedRows == 0)
				connection_sync.query('INSERT INTO stats (account_id, message_count, last_username) VALUES (' + message.from.id + ', 1, ' + user + ')');
			
			connection.query('SELECT 1 FROM user_group WHERE chat_id = ' + message.chat.id + ' AND account_id = ' + message.from.id, function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					connection.query('INSERT INTO user_group (account_id, chat_id) VALUES (' + message.from.id + ',' + message.chat.id + ')', function (err, rows) {
						if (err) throw err;
					});
				}
			});
		}
	}
});

bot.onText(/^\/start/i, function (message) {
	if ((message.chat.id < 0) && (message.text.indexOf("@") != -1) && (message.text.indexOf("userstatstrackerbot") == -1))
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

	connection.query('SELECT SUM(message_count) As cnt FROM stats', function (err, rows) {
		if (err) throw err;
		
		var global_cnt = rows[0].cnt;
		
		var chat_id = 0;
		if (message.chat.id < 0)
			chat_id = message.chat.id;
		
		connection.query('SELECT SUM(S.message_count) As cnt FROM user_group U, stats S WHERE U.account_id = S.account_id AND U.chat_id = ' + chat_id, function (err, rows) {
			if (err) throw err;
			
			var chat_cnt = rows[0].cnt;
			var extra = "";
			if (chat_cnt > 0)
				extra = ", " + String(formatNumber(chat_cnt)) + lang_main_3[lang];
					
			bot.sendMessage(message.chat.id, lang_main_1[lang] + String(formatNumber(Math.round(global_cnt/1000)*1000)) + lang_main_2[lang] + extra, no_preview);
		});
	});
});

bot.onText(/^\/leaderboard(?:@\w+)?/i, function (message, match) {

	var html = {
		parse_mode: "HTML"
	};
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	var text = "<b>" + lang_rank[lang] + "</b>\n";
	var c = 1;
	var size = 25;

	connection.query('SELECT account_id, last_username, message_count FROM stats ORDER BY message_count DESC', function (err, rows, fields) {
		if (err) throw err;
		for (var i = 0; i < size; i++){
			if (rows[i].last_username == undefined)
				rows[i].last_username = rows[i].account_id;
			text += c + "° <b>" + rows[i].last_username + "</b>: " + formatNumber(rows[i].message_count) + "\n";
			c++;
		}
		
		c = 1;
		
		var chat_id = 0;
		if (message.chat.id < 0)
			chat_id = message.chat.id;
		
		connection.query('SELECT S.account_id, S.last_username, S.message_count FROM user_group U, stats S WHERE U.account_id = S.account_id AND U.chat_id = ' + chat_id + ' ORDER BY S.message_count DESC', function (err, rows, fields) {
			if (err) throw err;
			
			if (Object.keys(rows).length > 0) {
				text += "\n<b>" + lang_rank_group[lang] + "</b>\n"; 
				if (size > Object.keys(rows).length)
					size = Object.keys(rows).length;
				for (var i = 0; i < size; i++){
					if (rows[i].last_username == undefined)
						rows[i].last_username = rows[i].account_id;
					text += c + "° <b>" + rows[i].last_username + "</b>: " + formatNumber(rows[i].message_count) + "\n";
					c++;
				}
			}

			bot.sendMessage(message.chat.id, text, html);
		});
	});
});

bot.onText(/^\/export(?:@\w+)?/i, function (message, match) {
	
	var html = {
		parse_mode: "HTML"
	};
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	if (message.chat.id > 0){
		bot.sendMessage(message.chat.id, lang_only_groups[lang]);
		return;
	}
	
	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status == "creator") || (data.status == "administrator")) {	
			connection.query('SELECT S.account_id, S.last_username, S.message_count FROM user_group U, stats S WHERE U.account_id = S.account_id AND U.chat_id = ' + message.chat.id + ' ORDER BY S.message_count DESC', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					bot.sendMessage(message.chat.id, lang_export_nodata[lang], html);
					return;
				}

				var content = "Account ID;Username;Messages\r\n";
				for (var i = 0; i < Object.keys(rows).length; i++){
					if (rows[i].last_username == undefined)
						rows[i].last_username = "";
					content += rows[i].account_id + ";" + rows[i].last_username  + ";" + rows[i].message_count + "\r\n";
				}

				var fname = "/tmp/export" + message.chat.id + ".csv";
				fs.writeFile(fname, content, function(err) {
					if(err)
						return console.log(err);

					bot.sendMessage(message.chat.id, lang_export_sent[lang]);
					bot.sendDocument(message.from.id, fname);
				});
			});
		}else
			bot.sendMessage(message.chat.id, lang_only_admin[lang]);
	});
});

bot.on("inline_query", function (query) {

	var data = query.query.replace("@","");
	var reg = new RegExp("^[a-zA-Z0-9_]{5,256}$");

	if ((data == "") || (reg.test(data) == false))
		return;

	var lang = "en";
	if (query.from.language_code != undefined){
		if (validLang.indexOf(query.from.language_code) != -1)
			lang = query.from.language_code;
	}

	console.log(getNow("it") + " User data request inline for " + data);
	connection.query('SELECT account_id, last_username, message_count, creation_date, update_date FROM stats WHERE last_username = "' + data + '" OR account_id = "' + data + '"', function (err, rows) {
		if (err) throw err;

		if (Object.keys(rows).length == 0) {
			bot.answerInlineQuery(query.id, [{
				id: '0',
				type: 'article',
				title: lang_stats_userinfo[lang],
				description: lang_stats_usernotfound[lang],
				message_text: data + " " + lang_stats_notfound[lang]
			}]);
			return;
		}

		bot.answerInlineQuery(query.id, [{
			id: '0',
			type: 'article',
			title: lang_stats_userinfo[lang],
			description: lang_stats_userfound[lang],
			message_text: 	"<b>" + lang_stats_username[lang] + ":</b> " + rows[0].last_username + " (" + rows[0].account_id + ")\n" +
			"<b>" + lang_stats_msgcount[lang] + ":</b> " + formatNumber(rows[0].message_count) + "\n" +
			"<b>" + lang_stats_creation[lang] + ":</b> " + toDate(lang, new Date(rows[0].creation_date)) + "\n" +
			"<b>" + lang_stats_update[lang] + ":</b> " + toDate(lang, new Date(rows[0].update_date)),
			parse_mode: "HTML"
		}]);
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
