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

var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');
var rainbowSixApi = require('rainbowsix-api-node');
var humanizeDuration = require('humanize-duration')

console.log('Connecting bot...');

var token = config.r6token;
var bot = new TelegramBot(token);
var app = express();
var r6 = new rainbowSixApi();

var path = "/rsix/bot" + token;
var port = 25004;

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
	user: config.dbuser_r6stats,
	password: config.dbpassword_r6stats,
	database: config.dbdatabase_r6stats
});
connection.connect();

setInterval(function () {
    connection.query('SELECT 1');
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

var html = {
	parse_mode: "HTML"
};

var validLang = ["en", "it"];
var lang_main = [];
var lang_changed = [];
var lang_invalid_lang = [];
var lang_invalid_user = [];
var lang_default_user_changed = [];
var lang_invalid_user_1 = [];
var lang_invalid_user_2 = [];

var lang_username = [];
var lang_platform = [];
var lang_level = [];
var lang_xp = [];

var lang_ranked_win = [];
var lang_ranked_losses = [];
var lang_ranked_wlr = [];
var lang_ranked_kills = [];
var lang_ranked_deaths = [];
var lang_ranked_kd = [];
var lang_ranked_playtime = [];
var lang_casual_win = [];
var lang_casual_losses = [];
var lang_casual_wlr = [];
var lang_casual_kills = [];
var lang_casual_deaths = [];
var lang_casual_kd = [];
var lang_casual_playtime = [];

var lang_revives = [];
var lang_suicides = [];
var lang_reinforcements = [];
var lang_barricades = [];
var lang_steps = [];
var lang_bullets_fired = [];
var lang_bullets_hit = [];
var lang_headshots = [];
var lang_melee_kills = [];
var lang_penetration_kills = [];
var lang_assists = [];

var lang_op_plays = [];
var lang_op_wins = [];
var lang_op_losses = [];
var lang_op_kills = [];
var lang_op_deaths = [];
var lang_op_playtime = [];

var lang_title_ranked = [];
var lang_title_casual = [];
var lang_title_general = [];
var lang_title_operators = [];

lang_main["it"] = "Benvenuto in <b>Rainbow Six Siege Stats</b>!\nUsa '/stats username' per visualizzare le informazioni del giocatore, '/lang language' per cambiare la lingua e '/setdefault username' per impostare l'username predefinito.\nUsa invece '/compare username1 username2' per confrontare le statistiche di due giocatori.";
lang_main["en"] = "Welcome to <b>Rainbow Six Siege Stats</b>!\nUse '/stats username' to print player infos, '/lang language' to change language and '/setdefault username' to set default username.\nUsa '/compare username1 username2' to compare stats of two players.";
lang_changed["it"] = "Lingua modificata!";
lang_changed["en"] = "Language changed!";
lang_invalid_lang["it"] = "Lingua non valida. Lingue disponibili: ";
lang_invalid_lang["en"] = "Invalid language. Available languages: ";
lang_invalid_user["it"] = "Nome utente non valido";
lang_invalid_user["en"] = "Invalid username";
lang_default_user_changed["it"] = "Nome utente predefinito modificato!";
lang_default_user_changed["en"] = "Default username changed!";
lang_invalid_user_1["it"] = "Username non specificati, esempio: /compare username1 username2";
lang_invalid_user_1["en"] = "Username not specified, example: /compare username1 username2";
lang_invalid_user_2["it"] = "Secondo username non specificato, esempio: /compare username1 username2";
lang_invalid_user_2["en"] = "Second username not specified, example: /compare username1 username2";

lang_username["it"] = "Nome utente";
lang_username["en"] = "Username";
lang_platform["it"] = "Piattaforma";
lang_platform["en"] = "Platform";
lang_level["it"] = "Livello";
lang_level["en"] = "Level";
lang_xp["it"] = "Xp";
lang_xp["en"] = "Xp";

lang_ranked_win["it"] = "Vittorie";
lang_ranked_win["en"] = "Wins";
lang_ranked_losses["it"] = "Sconfitte";
lang_ranked_losses["en"] = "Losses";
lang_ranked_wlr["it"] = "Precisione";
lang_ranked_wlr["en"] = "Accuracy";
lang_ranked_kills["it"] = "Uccisioni";
lang_ranked_kills["en"] = "Kills";
lang_ranked_deaths["it"] = "Morti";
lang_ranked_deaths["en"] = "Deaths";
lang_ranked_kd["it"] = "K/D";
lang_ranked_kd["en"] = "K/D";
lang_ranked_playtime["it"] = "Tempo di gioco";
lang_ranked_playtime["en"] = "Playtime";

lang_casual_win["it"] = "Vittorie";
lang_casual_win["en"] = "Wins";
lang_casual_losses["it"] = "Sconfitte";
lang_casual_losses["en"] = "Losses";
lang_casual_wlr["it"] = "Precisione";
lang_casual_wlr["en"] = "Accuracy";
lang_casual_kills["it"] = "Uccisioni";
lang_casual_kills["en"] = "Kills";
lang_casual_deaths["it"] = "Morti";
lang_casual_deaths["en"] = "Deaths";
lang_casual_kd["it"] = "K/D";
lang_casual_kd["en"] = "K/D";
lang_casual_playtime["it"] = "Tempo di gioco";
lang_casual_playtime["en"] = "Playtime";

lang_revives["it"] = "Rianimazioni";
lang_revives["en"] = "Revives";
lang_suicides["it"] = "Suicidi";
lang_suicides["en"] = "Suicides";
lang_reinforcements["it"] = "Rinforzi";
lang_reinforcements["en"] = "Reinforcements";
lang_barricades["it"] = "Barricate";
lang_barricades["en"] = "Barricades";
lang_steps["it"] = "Passi";
lang_steps["en"] = "Steps";
lang_bullets_fired["it"] = "Colpi sparati";
lang_bullets_fired["en"] = "Bullets fired";
lang_bullets_hit["it"] = "Colpi a segno";
lang_bullets_hit["en"] = "Bullets hit";
lang_headshots["it"] = "Colpi in testa";
lang_headshots["en"] = "Headshots";
lang_melee_kills["it"] = "Corpo a corpo";
lang_melee_kills["en"] = "Melee kills";
lang_penetration_kills["it"] = "Attraverso il muro";
lang_penetration_kills["en"] = "Penetration kills";
lang_assists["it"] = "Assist";
lang_assists["en"] = "Assists";

lang_op_plays["it"] = "Più partite";
lang_op_plays["en"] = "Most plays";
lang_op_wins["it"] = "Più vittorie";
lang_op_wins["en"] = "Most wins";
lang_op_losses["it"] = "Più sconfitte";
lang_op_losses["en"] = "Most losses";
lang_op_kills["it"] = "Più uccisioni";
lang_op_kills["en"] = "Most kills";
lang_op_deaths["it"] = "Più morti";
lang_op_deaths["en"] = "Most deaths";
lang_op_playtime["it"] = "Maggior tempo di gioco";
lang_op_playtime["en"] = "Most playtime";

lang_title_ranked["it"] = "Classificate";
lang_title_ranked["en"] = "Ranked";
lang_title_casual["it"] = "Libere";
lang_title_casual["en"] = "Casual";
lang_title_general["it"] = "Generali";
lang_title_general["en"] = "General";
lang_title_operators["it"] = "Operatori";
lang_title_operators["en"] = "Operators";

bot.onText(/^\/start/i, function (message) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		var lang = "en";
		if (message.from.language_code != undefined){
			if (validLang.indexOf(message.from.language_code) != -1)
				lang = message.from.language_code;
		}
		if (Object.keys(rows).length == 0){
			connection.query("INSERT INTO user (account_id, lang) VALUES (" + message.from.id + ", '" + lang + "')", function (err, rows) {
				if (err) throw err;
				console.log("New user " + message.from.username + " (" + message.from.id + " - " + lang + ")");
			});
		}else{
			lang = rows[0].lang;
		}

		bot.sendMessage(message.chat.id, lang_main[lang], html);
	});
});

function saveData(response){
	connection.query('INSERT INTO player_history VALUES (DEFAULT, "' + response.player.ubisoft_id + '","' + 
					 response.player.username + '",' +
					 response.player.stats.progression.level + ',' +
					 response.player.stats.progression.xp + ',' +
					 response.player.stats.ranked.wins + ',' + 
					 response.player.stats.ranked.losses + ',' + 
					 response.player.stats.ranked.wlr + ',' + 
					 response.player.stats.ranked.kills + ',' +
					 response.player.stats.ranked.deaths + ',' + 
					 response.player.stats.ranked.kd + ',' + 
					 response.player.stats.ranked.playtime + ',' +
					 response.player.stats.casual.wins + ',' + 
					 response.player.stats.casual.losses + ',' +
					 response.player.stats.casual.wlr + ',' +
					 response.player.stats.casual.kills + ',' +
					 response.player.stats.casual.deaths + ',' +
					 response.player.stats.casual.kd + ',' +
					 response.player.stats.casual.playtime + ',' +
					 response.player.stats.overall.revives + ',' +
					 response.player.stats.overall.suicides + ',' +
					 response.player.stats.overall.reinforcements_deployed + ',' +
					 response.player.stats.overall.barricades_built + ',' +
					 response.player.stats.overall.steps_moved + ',' +
					 response.player.stats.overall.bullets_fired + ',' +
					 response.player.stats.overall.bullets_hit + ',' +
					 response.player.stats.overall.headshots + ',' +
					 response.player.stats.overall.melee_kills + ',' +
					 response.player.stats.overall.penetration_kills + ',' +
					 response.player.stats.overall.assists + ', NOW())', function (err, rows) {
		if (err) throw err;
		console.log("Saved user data for " + response.player.username);
	});
}

bot.onText(/^\/lang (.+)|^\/lang/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /lang");
			return;
		}

		var errMsg = lang_invalid_lang[rows[0].lang] + validLang.join(", ");
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}
		if (validLang.indexOf(match[1]) == -1){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}

		var lang = match[1].toLowerCase();
		connection.query("UPDATE user SET lang = '" + lang + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_changed[lang]);
		});
	});
});

bot.onText(/^\/setdefault (.+)|^\/setdefault/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /setdefault");
			return;
		}

		var lang = rows[0].lang;
		var errMsg = lang_invalid_user[lang];
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}

		var user = match[1].toLowerCase();
		connection.query("UPDATE user SET default_username = '" + user + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_user_changed[lang]);
		});
	});
});

bot.onText(/^\/stats (.+)|^\/stats/i, function (message, match) {
	connection.query("SELECT lang, default_username FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /stats");
			return;
		}

		var lang = rows[0].lang;
		if (match[1] == undefined){
			if (rows[0].default_username != null)
				match[1] = rows[0].default_username;
			else{
				bot.sendMessage(message.chat.id, lang_invalid_user[lang]);
				return;
			}
		}

		var username = match[1];
		var platform = "uplay";

		console.log("Request user data for " + username + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username, platform, false).then(response => {
				connection.query('SELECT ranked_wins FROM player_history WHERE ubisoft_id = "' + response.player.ubisoft_id + '" ORDER BY id DESC', function (err, rows) {
					if (err) throw err;

					if (Object.keys(rows).length == 0){
						saveData(response);
					}else if (rows[0].ranked_wins < response.player.stats.ranked.wins){
						saveData(response);
					}else{
						// recupera i dati dal db ?
					}

					var text = "<b>" + lang_username[lang] + "</b>: " + response.player.username + "\n" +
						"<b>" + lang_platform[lang] + "</b>: " + response.player.platform + "\n" +
						"<b>" + lang_level[lang] + "</b>: " + response.player.stats.progression.level + "\n" +
						"<b>" + lang_xp[lang] + "</b>: " + formatNumber(response.player.stats.progression.xp) + "\n" +
						"\n<b>" + lang_title_ranked[lang] + "</b>:\n" +
						"<b>" + lang_ranked_win[lang] + "</b>: " + formatNumber(response.player.stats.ranked.wins) + "\n" +
						"<b>" + lang_ranked_losses[lang] + "</b>: " + formatNumber(response.player.stats.ranked.losses) + "\n" +
						"<b>" + lang_ranked_wlr[lang] + "</b>: " + response.player.stats.ranked.wlr + "%\n" +
						"<b>" + lang_ranked_kills[lang] + "</b>: " + formatNumber(response.player.stats.ranked.kills) + "\n" +
						"<b>" + lang_ranked_deaths[lang] + "</b>: " + formatNumber(response.player.stats.ranked.deaths) + "\n" +
						"<b>" + lang_ranked_kd[lang] + "</b>: " + formatNumber(response.player.stats.ranked.kd) + "\n" +
						"<b>" + lang_ranked_playtime[lang] + "</b>: " + toTime(response.player.stats.ranked.playtime, lang) + " (" + toTime(response.player.stats.ranked.playtime, lang, true) + ")\n" +
						"\n<b>" + lang_title_casual[lang] + "</b>:\n" +
						"<b>" + lang_casual_win[lang] + "</b>: " + formatNumber(response.player.stats.casual.wins) + "\n" +
						"<b>" + lang_casual_losses[lang] + "</b>: " + formatNumber(response.player.stats.casual.losses) + "\n" +
						"<b>" + lang_casual_wlr[lang] + "</b>: " + response.player.stats.casual.wlr + "%\n" +
						"<b>" + lang_casual_kills[lang] + "</b>: " + formatNumber(response.player.stats.casual.kills) + "\n" +
						"<b>" + lang_casual_deaths[lang] + "</b>: " + formatNumber(response.player.stats.casual.deaths) + "\n" +
						"<b>" + lang_casual_kd[lang] + "</b>: " + formatNumber(response.player.stats.casual.kd) + "\n" +
						"<b>" + lang_casual_playtime[lang] + "</b>: " + toTime(response.player.stats.casual.playtime, lang) + " (" + toTime(response.player.stats.casual.playtime, lang, true) + ")\n" +
						"\n<b>" + lang_title_general[lang] + "</b>:\n" +
						"<b>" + lang_revives[lang] + "</b>: " + formatNumber(response.player.stats.overall.revives) + "\n" +
						"<b>" + lang_suicides[lang] + "</b>: " + formatNumber(response.player.stats.overall.suicides) + "\n" +
						"<b>" + lang_reinforcements[lang] + "</b>: " + formatNumber(response.player.stats.overall.reinforcements_deployed) + "\n" +
						"<b>" + lang_barricades[lang] + "</b>: " + formatNumber(response.player.stats.overall.barricades_built) + "\n" +
						"<b>" + lang_steps[lang] + "</b>: " + formatNumber(response.player.stats.overall.steps_moved) + "\n" +
						"<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(response.player.stats.overall.bullets_fired) + "\n" +
						"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(response.player.stats.overall.bullets_hit) + "\n" +
						"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(response.player.stats.overall.headshots) + "\n" +
						"<b>" + lang_melee_kills[lang] + "</b>: " + formatNumber(response.player.stats.overall.melee_kills) + "\n" +
						"<b>" + lang_penetration_kills[lang] + "</b>: " + formatNumber(response.player.stats.overall.penetration_kills) + "\n" +
						"<b>" + lang_assists[lang] + "</b>: " + formatNumber(response.player.stats.overall.assists) + "\n";
					bot.sendChatAction(message.chat.id, "typing").then(function () {
						r6.stats(username, platform, true).then(response => {
							var operators_num = Object.keys(response.operator_records).length;
							var most_played = 0;
							var most_played_name = "";
							var most_wins = 0;
							var most_wins_name = "";
							var most_losses = 0;
							var most_losses_name = "";
							var most_kills = 0;
							var most_kills_name = "";
							var most_deaths = 0;
							var most_deaths_name = "";
							var most_playtime = 0;
							var most_playtime_name = "";
							for (i = 0; i < operators_num; i++){
								if (response.operator_records[i].stats.played > most_played){
									most_played = response.operator_records[i].stats.played;
									most_played_name = response.operator_records[i].operator.name;
								}
								if (response.operator_records[i].stats.wins > most_wins){
									most_wins = response.operator_records[i].stats.wins;
									most_wins_name = response.operator_records[i].operator.name;
								}
								if (response.operator_records[i].stats.losses > most_losses){
									most_losses = response.operator_records[i].stats.losses;
									most_losses_name = response.operator_records[i].operator.name;
								}
								if (response.operator_records[i].stats.kills > most_kills){
									most_kills = response.operator_records[i].stats.kills;
									most_kills_name = response.operator_records[i].operator.name;
								}
								if (response.operator_records[i].stats.deaths > most_deaths){
									most_deaths = response.operator_records[i].stats.deaths;
									most_deaths_name = response.operator_records[i].operator.name;
								}
								if (response.operator_records[i].stats.playtime > most_playtime){
									most_playtime = response.operator_records[i].stats.playtime;
									most_playtime_name = response.operator_records[i].operator.name;
								}
							}

							text += "\n<b>" + lang_title_operators[lang] + "</b>:\n" +
								"<b>" + lang_op_plays[lang] + "</b>: " + most_played_name + " (" + formatNumber(most_played) + ")\n" +
								"<b>" + lang_op_wins[lang] + "</b>: " + most_wins_name + " (" + formatNumber(most_wins) + ")\n" +
								"<b>" + lang_op_losses[lang] + "</b>: " + most_losses_name + " (" + formatNumber(most_losses) + ")\n" +
								"<b>" + lang_op_kills[lang] + "</b>: " + most_kills_name + " (" + formatNumber(most_kills) + ")\n" +
								"<b>" + lang_op_deaths[lang] + "</b>: " + most_deaths_name + " (" + formatNumber(most_deaths) + ")\n" +
								"<b>" + lang_op_playtime[lang] + "</b>: " + most_playtime_name + " (" + toTime(most_playtime, lang, true) + ")";

							bot.sendMessage(message.chat.id, text, html);
							console.log("User data served for " + username + " on " + platform);
						}).catch(error => {
							bot.sendMessage(message.chat.id, "<b>" + error.errors[0].title + "</b>\n" +  error.errors[0].detail, html);
							console.log("User data operators not found for " + username + " on " + platform);
						});
					});
				});
			}).catch(error => {
				bot.sendMessage(message.chat.id, "<b>" + error.errors[0].title + "</b>\n" +  error.errors[0].detail, html);
				console.log("User data not found for " + username + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/compare (.+) (.+)|^\/compare/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /compare");
			return;
		}

		var lang = rows[0].lang;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_user_1[lang]);
			return;
		}
		if (match[2] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_user_2[lang]);
			return;
		}

		var username1 = match[1];
		var username2 = match[2];
		var platform = "uplay";

		console.log("Request user compare for " + username1 + " and " + username2 + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username1, platform, false).then(response1 => {

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username2, platform, false).then(response2 => {

						var text = "<i>" + response1.player.username + " vs " + response2.player.username + "</i>\n" +
							"<b>" + lang_platform[lang] + "</b>: " + response1.player.platform + " - " + response2.player.platform + "\n" +
							"<b>" + lang_level[lang] + "</b>: " + compare(response1.player.stats.progression.level, response2.player.stats.progression.level) + "\n" +
							"<b>" + lang_xp[lang] + "</b>: " + compare(response1.player.stats.progression.xp, response2.player.stats.progression.xp, "number") + "\n" +
							"\n<b>" + lang_title_ranked[lang] + "</b>:\n" +
							"<b>" + lang_ranked_win[lang] + "</b>: " + compare(response1.player.stats.ranked.wins, response2.player.stats.ranked.wins, "number") + "\n" +
							"<b>" + lang_ranked_losses[lang] + "</b>: " + compare(response1.player.stats.ranked.losses, response2.player.stats.ranked.losses, "number", lang, 1) + "\n" +
							"<b>" + lang_ranked_wlr[lang] + "</b>: " + compare(response1.player.stats.ranked.wlr, response2.player.stats.ranked.wlr, "perc") + "\n" +
							"<b>" + lang_ranked_kills[lang] + "</b>: " + compare(response1.player.stats.ranked.kills, response2.player.stats.ranked.kills, "number") + "\n" +
							"<b>" + lang_ranked_deaths[lang] + "</b>: " + compare(response1.player.stats.ranked.deaths, response2.player.stats.ranked.deaths, "number", lang, 1) + "\n" +
							"<b>" + lang_ranked_kd[lang] + "</b>: " + compare(response1.player.stats.ranked.kd, response2.player.stats.ranked.kd, "number") + "\n" +
							"<b>" + lang_ranked_playtime[lang] + "</b>: " + compare(response1.player.stats.ranked.playtime, response2.player.stats.ranked.playtime, "time", lang) + "\n" +
							"\n<b>" + lang_title_casual[lang] + "</b>:\n" +
							"<b>" + lang_casual_win[lang] + "</b>: " + compare(response1.player.stats.casual.wins, response2.player.stats.casual.wins, "number") + "\n" +
							"<b>" + lang_casual_losses[lang] + "</b>: " + compare(response1.player.stats.casual.losses, response2.player.stats.casual.losses, "number", lang, 1) + "\n" +
							"<b>" + lang_casual_wlr[lang] + "</b>: " + compare(response1.player.stats.casual.wlr, response2.player.stats.casual.wlr, "perc") + "\n" +
							"<b>" + lang_casual_kills[lang] + "</b>: " + compare(response1.player.stats.casual.kills, response2.player.stats.casual.kills, "number") + "\n" +
							"<b>" + lang_casual_deaths[lang] + "</b>: " + compare(response1.player.stats.casual.deaths, response2.player.stats.casual.deaths, "number", lang, 1) + "\n" +
							"<b>" + lang_casual_kd[lang] + "</b>: " + compare(response1.player.stats.casual.kd, response2.player.stats.casual.kd, "number") + "\n" +
							"<b>" + lang_casual_playtime[lang] + "</b>: " + compare(response1.player.stats.casual.playtime, response2.player.stats.casual.playtime, "time", lang) + "\n" +
							"\n<b>" + lang_title_general[lang] + "</b>:\n" +
							"<b>" + lang_revives[lang] + "</b>: " + compare(response1.player.stats.overall.revives, response2.player.stats.overall.revives, "number") + "\n" +
							"<b>" + lang_suicides[lang] + "</b>: " + compare(response1.player.stats.overall.suicides, response2.player.stats.overall.suicides, "number", lang, 1) + "\n" +
							"<b>" + lang_reinforcements[lang] + "</b>: " + compare(response1.player.stats.overall.reinforcements_deployed, response2.player.stats.overall.reinforcements_deployed, "number") + "\n" +
							"<b>" + lang_barricades[lang] + "</b>: " + compare(response1.player.stats.overall.barricades_built, response2.player.stats.overall.barricades_built, "number") + "\n" +
							"<b>" + lang_steps[lang] + "</b>: " + compare(response1.player.stats.overall.steps_moved, response2.player.stats.overall.steps_moved, "number") + "\n" +
							"<b>" + lang_bullets_fired[lang] + "</b>: " + compare(response1.player.stats.overall.bullets_fired, response2.player.stats.overall.bullets_fired, "number") + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + compare(response1.player.stats.overall.bullets_hit, response2.player.stats.overall.bullets_hit, "number") + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + compare(response1.player.stats.overall.headshots, response2.player.stats.overall.headshots, "number") + "\n" +
							"<b>" + lang_melee_kills[lang] + "</b>: " + compare(response1.player.stats.overall.melee_kills, response2.player.stats.overall.melee_kills, "number") + "\n" +
							"<b>" + lang_penetration_kills[lang] + "</b>: " + compare(response1.player.stats.overall.penetration_kills, response2.player.stats.overall.penetration_kills, "number") + "\n" +
							"<b>" + lang_assists[lang] + "</b>: " + compare(response1.player.stats.overall.assists, response2.player.stats.overall.assists, "number");
						
						bot.sendMessage(message.chat.id, text, html);

					}).catch(error => {
						bot.sendMessage(message.chat.id, "<b>" + error.errors[0].title + "</b>\n" +  error.errors[0].detail, html);
						console.log("User data not found for " + username2 + " on " + platform);
					});
				});
			}).catch(error => {
				bot.sendMessage(message.chat.id, "<b>" + error.errors[0].title + "</b>\n" +  error.errors[0].detail, html);
				console.log("User data not found for " + username1 + " on " + platform);
			});
		});
	});
});

function compare(val1, val2, format = "", lang = "en", inverted = 0){
	var res = "";
	var formattedVal1 = val1;
	var formattedVal2 = val2;

	if (format == "number"){
		formattedVal1 = formatNumber(formattedVal1);
		formattedVal2 = formatNumber(formattedVal2);
	}else if (format == "perc"){
		formattedVal1 = formatNumber(formattedVal1) + "%";
		formattedVal2 = formatNumber(formattedVal2) + "%";
	}else if (format == "time"){
		formattedVal1 = toTime(formattedVal1, lang, true);
		formattedVal2 = toTime(formattedVal2, lang, true);
	}
	
	if (inverted == 0){
		if (val1 > val2)
			res = "<b>" + formattedVal1 + "</b> - " + formattedVal2;
		else if (val1 < val2)
			res = formattedVal1 + " - <b>" + formattedVal2 + "</b>";
		else
			res = formattedVal1 + " - " + formattedVal2;
	}else{
		if (val1 > val2)
			res = formattedVal1 + " - <b>" + formattedVal2 + "</b>";
		else if (val1 < val2)
			res = "<b>" + formattedVal1 + "</b> - " + formattedVal2;
		else
			res = formattedVal1 + " - " + formattedVal2;
	}

	return res;
}

function formatNumber(num) {
	
	if (num < 0)
		num = Math.abs(num)+2147483647;	// fix per il negativo passi
	
	return ("" + num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, function ($1) {
		return $1 + "."
	});
}

function toTime(seconds, lang = "en", onlyHours = false) {
	if (onlyHours == true)
		return humanizeDuration(seconds*1000, { language: lang, units: ['h'], round: true });
	else
		return humanizeDuration(seconds*1000, { language: lang });
}