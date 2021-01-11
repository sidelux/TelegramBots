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
var mysql = require('mysql');
var mysql_sync = require('sync-mysql');

console.log('Connecting bot...');

var token = config.dxdiagtoken;
var bot = new TelegramBot(token);
var app = express();

var path = "/dxdiag/bot" + token;
var port = 25012;

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
	user: config.dbuser_dxdiag,
	password: config.dbpassword_dxdiag,
	database: config.dbdatabase_dxdiag
});
connection.connect();

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_dxdiag,
	password: config.dbpassword_dxdiag,
	database: config.dbdatabase_dxdiag
});

setInterval(function () {
	connection.query('SELECT 1');
	connection_sync.query('SELECT 1');
}, 60000);

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
var lang_admin = [];
var lang_too_large = [];
var lang_not_txt = [];
var lang_uploaded = [];
var lang_share = [];
var lang_publish = [];
var lang_uploaded_at = [];
var lang_by = [];
var lang_show_count = [];
var lang_show_count_2 = [];

lang_main["en"] = "<b>Welcome to Dxdiag Reader Bot!</b>\n\nSend me the dxdiag.txt file and share with others with inline functions!";
lang_main["it"] = "<b>Benvenuto nel Dxdiag Reader Bot!</b>\n\nInviami il file dxdiag.txt e condividilo con altri con le funzioni inline!";
lang_admin["en"] = "You must be administrator to use this command";
lang_admin["it"] = "Devi essere amministratore per utilizzare questo comando";
lang_too_large["en"] = "Your file is too big, max size: 200kb";
lang_too_large["it"] = "Il file che stai caricando supera la dimensione massima pari a: 200kb";
lang_not_txt["en"] = "Your file extension is not valid, should be .txt";
lang_not_txt["it"] = "L'estensione del file non è valida, dovrebbe essere .txt";
lang_uploaded["en"] = "File successfully uploaded! You can see it by using this code: ";
lang_uploaded["it"] = "File caricato con successo! Puoi visualizzarlo utilizzando questo codice: ";
lang_share["en"] = "Show & Share";
lang_share["it"] = "Visualizza & Condividi";
lang_publish["en"] = "Publish configuration";
lang_publish["it"] = "Pubblica configurazione";
lang_uploaded_at["en"] = "Uploaded at ";
lang_uploaded_at["it"] = "Caricato il ";
lang_by["en"] = " by ";
lang_by["it"] = " da ";
lang_show_count["en"] = "showed ";
lang_show_count["it"] = "visualizzato ";
lang_show_count_2["en"] = " times";
lang_show_count_2["it"] = " volte";

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

bot.on('message', function (message, match) {
	// console.log(message);
	if (message.document == undefined)
		return;
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	const document = message.document;
	const fname = "tmp.txt";
	if (document.file_size > 200000) { // 200 kb
		bot.sendMessage(message.chat.id, lang_too_large[lang]);
		return;
	}
	if (document.file_name.substr(document.file_name.length-4, document.file_name.length) != ".txt") {
		bot.sendMessage(message.chat.id, lang_not_txt[lang]);
		return;
	}
	if (document.mime_type != "text/plain") {
		bot.sendMessage(message.chat.id, lang_not_txt[lang]);
		return;
	}
	
	bot.getFileLink(document.file_id).then(function (tgurl) {
		const file = fs.createWriteStream(fname);
		const request = https.get(tgurl, function(response) {
			response.pipe(file);
			fs.readFile(fname, "utf8", function (err, data) {
				if (err) return console.log(err);
				
				const file_data = Buffer.from(data).toString('base64');
				const query_id = generateQueryId();
			  	
				connection.query("INSERT INTO files (account_id, file_content, upload_time, query_id) VALUES (" + message.from.id + ", '" + file_data + "', NOW(), '" + query_id + "')", function (err, rows) {
					if (err) throw err;
					
					var iKeys = [];
					iKeys.push([{
						text: lang_share[lang],
						switch_inline_query: query_id
					}]);
					
					bot.sendMessage(message.chat.id, lang_uploaded[lang] + query_id, {
						parse_mode: 'Markdown',
						reply_markup: {
							inline_keyboard: iKeys
						}
					});
				
					fs.unlink(fname,function(err) {
						if (err) return console.log(err);
					});
				});
			});
		});
	});
});

bot.on("inline_query", function (message) {
	const query = message.query;
	if (query.length == 8) {
		var lang = "en";
		if (message.from.language_code != undefined){
			if (validLang.indexOf(message.from.language_code) != -1)
				lang = message.from.language_code;
		}
		
		connection.query("SELECT * FROM files WHERE query_id = '" + connection.escape(query) + "'", function (err, rows) {
			if (err) throw err;
			
			const file_id = rows[0].id;
			const account_id = rows[0].account_id;
			const file_content = Buffer.from(rows[0].file_content, 'base64').toString('utf8');
			const upload_time = rows[0].upload_time;
			const show_count = rows[0].show_count;
			const message_text = extractInfo(file_content);
		
			bot.answerInlineQuery(message.id, [{
				id: '0',
				type: 'article',
				title: lang_publish[lang],
				description: lang_uploaded_at[lang] + toDate(lang, upload_time) + lang_by[lang] + account_id + ", " + lang_show_count[lang] + formatNumber(show_count) + lang_show_count_2[lang],
				message_text: message_text,
				parse_mode: "HTML"
			}], {cache_time: 0}).then(function (tgurl) {
				connection.query("UPDATE files SET show_count = show_count+1 WHERE id = " + file_id, function (err, rows) {
					if (err) throw err;
				});
			});
		});
	}
});

// Functions

function extractInfo(content) {
	const lines = content.split("\r\n");
	// console.log(lines);
	
	const system_line = lines.indexOf("System Information");
	const operating_system = lines[system_line+5].match(/: (.+)\(/)[1];
	const cpu = lines[system_line+10].match(/: (.+)/)[1].replace(/ +/g, " ");
	const ram = Math.round(lines[system_line+11].match(/: (\d+)/)[1]/1024) + " GB";
	
	const display_line = lines.indexOf("Display Devices");
	const gpu = lines[display_line+2].match(/: (.+)/)[1] + " (" + Math.round(lines[display_line+12].match(/: (\d+)/)[1]/1024) + " GB)";
	const resolution = lines[display_line+14].match(/: (.+)/)[1];
	
	const result = "<b>OS</b>: " + operating_system + "\n<b>CPU</b>: " + cpu + "\n<b>RAM</b>: " + ram + "\n<b>GPU</b>: " + gpu + "\n<b>Resolution</b>: " + resolution;
	
	return result;
}

function generateQueryId() {
	var str;
	while (1) {
		str = Math.random().toString(36).slice(-8);
		var rows = connection_sync.query("SELECT query_id FROM files WHERE query_id = '" + str + "'");
		if (Object.keys(rows).length == 0)
			break;
	}
	return str;
}

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;
	var datetime;
	if (lang == "it")
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else if (lang == "en")
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else
		datetime = "Error";
	if (obj == true)
		datetime = new Date(datetime);
	return datetime;
}

function toDate(lang, date) {
	var d = new Date(date);
	if (typeof date == "object")
		d = date;
	var datetime = "";
	if (lang == "it")
		datetime = addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else if (lang == "en")
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	else
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
