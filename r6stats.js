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
var humanizeDuration = require('humanize-duration')
var request = require("request");
var plotly = require('plotly')('redfenix45','3mcGka93rW2Ex7KJnrPd');
var Schedule = require('node-schedule');
var Parser = require('rss-parser');
var request = require('request');
var striptags = require('striptags');

class RainbowSixApi {
	constructor() {}

	stats(username, platform, operators) {
		return new Promise((resolve, reject) => {
			if(!username || typeof username !== 'string') 
				return reject(new TypeError('Invalid username'));
			operators = operators || false;
			if(typeof operators !== 'boolean') 
				return reject(new TypeError('Operators has to be a boolean'));
			if(typeof platform !== 'string' || !platform) 
				return reject(new TypeError('Invalid platform, platform types can be: uplay, xone, ps4'));
			let endpoint = `https://api.r6stats.com/api/v1/players/${username.toString()}/?platform=${platform}`;
			if(operators)
				endpoint = `https://api.r6stats.com/api/v1/players/${username}/operators/?platform=${platform}`;
			request.get(endpoint, (error, response, body) => {
				if(!error && response.statusCode == '200') {
					return resolve(JSON.parse(body));
				} else {
					return reject(JSON.parse(body));
				}
			})
		})
	}

	profile(username, platform) {
		return new Promise((resolve, reject) => {
			if(!username || typeof username !== 'string') 
				return reject(new TypeError('Invalid username'));
			if(typeof platform !== 'string' || !platform) 
				return reject(new TypeError('Invalid platform, platform types can be: uplay, xone, ps4'));
			let endpoint = `https://api.r6stats.com/api/v1/users/${username}/profile/?platform=${platform}`;
			request.get(endpoint, (error, response, body) => {
				if(!error && response.statusCode == '200') {
					return resolve(JSON.parse(body));
				} else {
					return reject(JSON.parse(body));
				}
			})
		})
	}
};

console.log('Connecting bot...');

var token = config.r6token;
var bot = new TelegramBot(token);
var app = express();
var r6 = new RainbowSixApi();

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

var no_preview = {
	parse_mode: "HTML",
	disable_web_page_preview: true
};

var validLang = ["en", "it"];
var validParam = ["casual_kd", "ranked_kd", "ranked_wlr", "casual_wlr"];
var lang_main = [];
var lang_storebot = [];
var lang_changed = [];
var lang_invalid_lang = [];
var lang_invalid_user = [];
var lang_default_user_changed = [];
var lang_invalid_user_1 = [];
var lang_invalid_user_2 = [];
var lang_invalid_platform = [];
var lang_invalid_platform_2 = [];
var lang_default_platform_changed = [];
var lang_default = [];
var lang_user_not_found = [];
var lang_graph_no_data = [];
var lang_graph_no_param = [];
var lang_no_defaultuser = [];
var lang_no_defaultplatform = [];
var lang_autotrack = [];
var lang_autotrack_invalid = [];
var lang_autotrack_enabled = [];
var lang_autotrack_disabled = [];
var lang_autotrack_disable = [];
var lang_news_readall = [];
var lang_news_date = [];
var lang_operator_no_name = [];
var lang_operator_not_found = [];
var lang_help = [];

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

var lang_inline_total_kills = [];
var lang_inline_total_deaths = [];
var lang_inline_total_wins = [];
var lang_inline_total_losses = [];
var lang_inline_ranked_kd = [];
var lang_inline_casual_kd = [];
var lang_inline_ranked_playtime = [];
var lang_inline_casual_playtime = [];
var lang_inline_userinfo = [];
var lang_inline_userfound = [];
var lang_inline_infos = [];

var lang_operator_title = [];
var lang_operator_plays = [];
var lang_operator_wins = [];
var lang_operator_losses = [];
var lang_operator_kills = [];
var lang_operator_deaths = [];
var lang_operator_playtime = [];
var lang_operator_specials = [];
var lang_operator_extra = [];

var ability_operatorpvp_phoneshacked = [];
var ability_operatorpvp_attackerdrone_diminishedrealitymode = [];
var ability_operatorpvp_caltrop_enemy_affected = [];
var ability_operatorpvp_cazador_assist_kill = [];
var ability_operatorpvp_tagger_tagdevice_spot = [];
var ability_operatorpvp_doc_selfrevive = [];
var ability_operatorpvp_doc_hostagerevive = [];
var ability_operatorpvp_doc_teammaterevive = [];
var ability_operatorpvp_mute_gadgetjammed = [];
var ability_operatorpvp_mute_jammerdeployed = [];
var ability_operatorpvp_ash_bonfirekill = [];
var ability_operatorpvp_ash_bonfirewallbreached = [];
var ability_operatorpvp_blackbeard_gunshieldblockdamage = [];
var ability_operatorpvp_valkyrie_camdeployed = [];
var ability_operatorpvp_dazzler_gadget_detonate = [];
var ability_operatorpvp_concussionmine_detonate = [];
var ability_operatorpvp_black_mirror_gadget_deployed = [];
var ability_operatorpvp_hibana_detonate_projectile = [];
var ability_operatorpvp_echo_enemy_sonicburst_affected = [];
var ability_operatorpvp_smoke_poisongaskill = [];
var ability_operatorpvp_rush_adrenalinerush = [];
var ability_operatorpvp_concussiongrenade_detonate = [];
var ability_operatorpvp_bandit_batterykill = [];
var ability_operatorpvp_caveira_interrogations = [];
var ability_operatorpvp_fuze_clusterchargekill = [];
var ability_operatorpvp_pulse_heartbeatspot = [];
var ability_operatorpvp_pulse_heartbeatassist = [];
var ability_operatorpvp_sledge_hammerhole = [];
var ability_operatorpvp_sledge_hammerkill = [];
var ability_operatorpvp_castle_kevlarbarricadedeployed = [];
var ability_operatorpvp_glaz_sniperkill = [];
var ability_operatorpvp_glaz_sniperpenetrationkill = [];
var ability_operatorpvp_montagne_shieldblockdamage = [];
var ability_operatorpvp_iq_gadgetspotbyef = [];
var ability_operatorpvp_twitch_shockdronekill = [];
var ability_operatorpvp_twitch_gadgetdestroybyshockdrone = [];
var ability_operatorpvp_thermite_chargekill = [];
var ability_operatorpvp_thermite_chargedeployed = [];
var ability_operatorpvp_thermite_reinforcementbreached = [];
var ability_operatorpvp_rook_armorboxdeployed = [];
var ability_operatorpvp_rook_armortakenourself = [];
var ability_operatorpvp_rook_armortakenteammate = [];
var ability_operatorpvp_capitao_lethaldartkills = [];
var ability_operatorpvp_buck_kill = [];
var ability_operatorpvp_frost_dbno = [];
var ability_operatorpvp_jager_gadgetdestroybycatcher = [];
var ability_operatorpvp_thatcher_gadgetdestroywithemp = [];
var ability_operatorpvp_blitz_flashedenemy = [];
var ability_operatorpvp_blitz_flashshieldassist = [];
var ability_operatorpvp_blitz_flashfollowupkills = [];
var ability_operatorpvp_kapkan_boobytrapkill = [];
var ability_operatorpvp_kapkan_boobytrapdeployed = [];

lang_main["it"] = "Benvenuto in <b>Rainbow Six Siege Stats</b>! [Available also in english! 🇺🇸]\n\nUsa '/stats username piattaforma' per visualizzare le informazioni del giocatore, per gli altri comandi digita '/' e visualizza i suggerimenti. Funziona anche inline!";
lang_main["en"] = "Welcome to <b>Rainbow Six Siege Stats</b>! [Disponibile anche in italiano! 🇮🇹]\n\nUse '/stats username platform' to print player infos, to other commands write '/' and show hints. It works also inline!";
lang_storebot["it"] = "<a href='https://storebot.me/bot/r6siegestatsbot'>Vota sullo Storebot</a>";
lang_storebot["en"] = "<a href='https://storebot.me/bot/r6siegestatsbot'>Vote on Storebot</a>";
lang_changed["it"] = "Lingua modificata!";
lang_changed["en"] = "Language changed!";
lang_invalid_lang["it"] = "Lingua non valida. Lingue disponibili: ";
lang_invalid_lang["en"] = "Invalid language. Available languages: ";
lang_invalid_user["it"] = "Nome utente non valido.";
lang_invalid_user["en"] = "Invalid username.";
lang_default_user_changed["it"] = "Nome utente predefinito modificato!";
lang_default_user_changed["en"] = "Default username changed!";
lang_invalid_user_1["it"] = "Username non specificati, esempio: /compare username1 username2.";
lang_invalid_user_1["en"] = "Username not specified, example: /compare username1 username2.";
lang_invalid_user_2["it"] = "Secondo username non specificato, esempio: /compare username1 username2.";
lang_invalid_user_2["en"] = "Second username not specified, example: /compare username1 username2.";
lang_invalid_platform["it"] = "Piattaforma non specificata.";
lang_invalid_platform["en"] = "Platform not specified.";
lang_invalid_platform_2["it"] = "Piattaforma non valida. Piattaforme disponibili: uplay, ps4 o xone.";
lang_invalid_platform_2["en"] = "Invalid platform. Available platforms: uplay, ps4 or xone.";
lang_default_platform_changed["it"] = "Piattaforma predefinita modificata!";
lang_default_platform_changed["en"] = "Default platform changed!";
lang_default["it"] = "Impostazioni: ";
lang_default["en"] = "Settings: ";
lang_user_not_found["it"] = "Username non trovato per la piattaforma selezionata.";
lang_user_not_found["en"] = "Username not found for selected platform.";
lang_graph_no_data["it"] = "Non ci sono abbastanza dati salvati per creare un grafico, usa /stats per salvarli.";
lang_graph_no_data["en"] = "Not enough data saved found to create a graph, use /stats to save more.";
lang_graph_no_param["it"] = "Parametro non valido. Parametri disponibili: ";
lang_graph_no_param["en"] = "Invalid parameter. Available parameters: ";
lang_no_defaultuser["it"] = "Usa /setusername prima di usare questo comando.";
lang_no_defaultuser["en"] = "Use /setusername before use this command.";
lang_no_defaultplatform["it"] = "Usa /setplatform prima di usare questo comando.";
lang_no_defaultplatform["en"] = "Use /setplatform before use this command.";
lang_autotrack["it"] = "Usa questa funzione per salvare automaticamente i tuoi dati giocatore ogni 24 ore. Usa '/autotrack enable' o '/autotrack disable'."
lang_autotrack["en"] = "Use this function to automatically save you player data every 24 hours. Use '/autotrack enable' or '/autotrack disable'."
lang_autotrack_invalid["it"] = "Parametro non valido. Parametri disponibili: enable, disable.";
lang_autotrack_invalid["en"] = "Invalid parameter. Available parameters: enable, disable.";
lang_autotrack_enabled["it"] = "Autotrack abilitato con successo.";
lang_autotrack_enabled["en"] = "Autotrack successfully enabled.";
lang_autotrack_disabled["it"] = "Autotrack disabilitato con successo.";
lang_autotrack_disabled["en"] = "Autotrack successfully disabled.";
lang_autotrack_disable["it"] = "Disabilita l'autotrack prima di modificare questa impostazione.";
lang_autotrack_disable["en"] = "Disable autotrack before change this setting.";
lang_news_readall["it"] = "Leggi notizia completa";
lang_news_readall["en"] = "Read full article";
lang_news_date["it"] = "Pubblicato alle ";
lang_news_date["en"] = "Published at ";
lang_operator_no_name["it"] = "Nome operatore non specificato.";
lang_operator_no_name["en"] = "Operator name not specified.";
lang_operator_not_found["it"] = "Operatore non trovato.";
lang_operator_not_found["en"] = "Operator not found.";
lang_help["it"] = 	"*Guida ai comandi:*\n" +
	"> '/stats <username> <piattaforma>' - Permette di visualizzare la lista completa delle statistiche del giocatore specificato nei parametri del comando. E' possibile omettere i parametri se sono stati salvati con /setusername o /setplatform.\n" +
	"> '/operators' - Permette di visualizzare la lista completa degli operatori del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/operator <nome-operatore>' - Permette di visualizzare i dettagli di un solo operatore specificato come parametro utilizzando /setusername e /setplatform.\n" +
	"> '/compare <username1> <username2>' - Permette di confrontare le statistiche di due giocatori utilizzando come piattaforma quella specificata utilizzando /setplatform.\n" +
	"> '/graph <parametro>' - Genera un grafico per il parametro specificato, necessita dell'attivazione dell'/autotrack (vedi sotto).\n" +
	"> '/status <piattaforma>' - Permette di visualizzare lo status ufficiale dei server di gioco.\n" +
	"> '/news' - Permette di visualizzare le ultime 5 news ufficiali del gioco reperite da Steam.\n" +
	"> '/lang <lingua>' - Imposta la lingua del bot.\n" +
	"> '/setusername <username>' - Imposta il nome utente di default necessario per alcune funzioni.\n" +
	"> '/setplatform <piattaforma>' - Imposta la piattaforma di default necessaria per alcune funzioni.\n" +
	"> '/autotrack <enable/disable>' - Attiva il salvataggio automatico dei dati del giocatore per poterne generare i grafici.\n" +
	"\n*Come funziona l'autotrack?*\n" +
	"L'autrack del personaggio sostanzialmente lancia automaticamente il comando /stats a mezzanotte di ogni notte, così da salvare i dati nel nostro database e poterli utilizzare per disegnare i grafici. Per avviare l'operazione è necessario eseguire i seguenti passi:\n1. _/start_ per avviare il bot e creare l'utente\n2. _/setusername_ e _/setplatform_ per salvare i dati necessari\n3. _/autotrack enable_ per avviare il processo.\n\nE' possibile utilizzare il bot anche *inline* inserendo username e piattaforma come per il comando /stats!\n\nPer ulteriori informazioni contatta @fenix45.";
lang_help["en"] = 	"*Commands tutorial:*\n" +
	"> '/stats <username> <platform>' - Allow to print a complete stats list of user specified in command parameters. Is possibile to omit params if they has been saved with /setusername and /setplatform.\n" +
	"> '/operators' - Allow to print a complete operators list of player specified using /setusername and /setplatform.\n" +
	"> '/operator <operator-name>' - Allow to print operator details specified as parameter using /setusername and /setplatform.\n" +
	"> '/compare <username1> <username2>' - Allow to compare two players stats using platform specified using /setplatform.\n" +
	"> '/graph <parameter>' - Generate a graph using parameter specified, needs /autotrack activation (see below).\n" +
	"> '/status <platform>' - Allow to print official server status of the game.\n" +
	"> '/news' - Allow to print latest 5 official news of the game wrote by Steam.\n" +
	"> '/lang <language>' - Change bot language.\n" +
	"> '/setusername <username>' - Change default username to use some functions.\n" +
	"> '/setplatform <platform>' - Change default platform to use some functions.\n" +
	"> '/autotrack <enable/disable>' - Enable automatic save of user stats to generate graphs.\n" +
	"\n*How autotrack works?*\n" +
	"Simply, user autotrack automatically execute /stats command at midnight, so the datas can be stored in out database and you can use it to write graphs. To start operation you should follow this steps:\n1. _/start_ to start bot and create user\n2. _/setusername_ and _/setplatform_ to save necessary datas\n3. _/autotrack enable_ to start the process.\n\nYou can also use the *inline mode* providing username and platform like /stats command!\n\nFor informations contact @fenix45.";

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
lang_ranked_kd["it"] = "U/M";
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
lang_casual_kd["it"] = "U/M";
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
lang_op_playtime["it"] = "Più tempo di gioco";
lang_op_playtime["en"] = "Most playtime";

lang_title_ranked["it"] = "Classificate";
lang_title_ranked["en"] = "Ranked";
lang_title_casual["it"] = "Libere";
lang_title_casual["en"] = "Casual";
lang_title_general["it"] = "Generali";
lang_title_general["en"] = "General";
lang_title_operators["it"] = "Operatori";
lang_title_operators["en"] = "Operators";

lang_inline_total_kills["it"] = "Uccisioni totali";
lang_inline_total_kills["en"] = "Total kills";
lang_inline_total_deaths["it"] = "Morti totali";
lang_inline_total_deaths["en"] = "Total deaths";
lang_inline_total_wins["it"] = "Vittorie totali";
lang_inline_total_wins["en"] = "Total wins";
lang_inline_total_losses["it"] = "Sconfitte totali";
lang_inline_total_losses["en"] = "Total losses";
lang_inline_userinfo["it"] = "Informazioni giocatore";
lang_inline_userinfo["en"] = "Player info";
lang_inline_userfound["it"] = "Giocatore trovato";
lang_inline_userfound["en"] = "Player found";
lang_inline_ranked_kd["it"] = "U/M Classificate";
lang_inline_ranked_kd["en"] = "K/D Ranked";
lang_inline_casual_kd["it"] = "U/M Libere";
lang_inline_casual_kd["en"] = "K/D Casual";
lang_inline_ranked_playtime["it"] = "Tempo di gioco classificate";
lang_inline_ranked_playtime["en"] = "Ranked playtime";
lang_inline_casual_playtime["it"] = "Tempo di gioco libere";
lang_inline_casual_playtime["en"] = "Casual playtime";
lang_inline_infos["it"] = "Per ulteriori informazioni usa /stats!";
lang_inline_infos["en"] = "To see more informations use /stats!";

lang_operator_title["it"] = "Operatore";
lang_operator_title["en"] = "Operator";
lang_operator_plays["it"] = "Partite";
lang_operator_plays["en"] = "Plays";
lang_operator_wins["it"] = "Vittore";
lang_operator_wins["en"] = "Wins";
lang_operator_losses["it"] = "Sconfitte";
lang_operator_losses["en"] = "Losses";
lang_operator_kills["it"] = "Uccisioni";
lang_operator_kills["en"] = "Kills";
lang_operator_deaths["it"] = "Morti";
lang_operator_deaths["en"] = "Deaths";
lang_operator_playtime["it"] = "Tempo di gioco";
lang_operator_playtime["en"] = "Playtime";
lang_operator_specials["it"] = "Abilità";
lang_operator_specials["en"] = "Special";
lang_operator_extra["it"] = "\nPuoi visualizzare i dettagli di un operatore e le sue abilità speciali utilizzando '/operator nome_operatore'.";
lang_operator_extra["en"] = "\nYou can show detail of one operator and his abilities using '/operator operator_name'.";

ability_operatorpvp_phoneshacked["it"] = "Telefoni hackerati";
ability_operatorpvp_phoneshacked["en"] = "Phones hacked";
ability_operatorpvp_attackerdrone_diminishedrealitymode["it"] = "Droni disturbati";
ability_operatorpvp_attackerdrone_diminishedrealitymode["en"] = "Confused drones";
ability_operatorpvp_caltrop_enemy_affected["it"] = "Nemici avvelenati";
ability_operatorpvp_caltrop_enemy_affected["en"] = "Poisoned enemies";
ability_operatorpvp_cazador_assist_kill["it"] = "Assist individuazione";
ability_operatorpvp_cazador_assist_kill["en"] = "Spot assits";
ability_operatorpvp_tagger_tagdevice_spot["it"] = "Nemici individuato";
ability_operatorpvp_tagger_tagdevice_spot["en"] = "Enemies spotted";
ability_operatorpvp_doc_selfrevive["it"] = "Auto-rianimazioni";
ability_operatorpvp_doc_selfrevive["en"] = "Self-revives";
ability_operatorpvp_doc_hostagerevive["it"] = "Rianimazioni ostaggio";
ability_operatorpvp_doc_hostagerevive["en"] = "Hostages revive";
ability_operatorpvp_doc_teammaterevive["it"] = "Rianimazioni compagno";
ability_operatorpvp_doc_teammaterevive["en"] = "Teammates revive";
ability_operatorpvp_mute_gadgetjammed["it"] = "Gadget disturbati";
ability_operatorpvp_mute_gadgetjammed["en"] = "Disturbed gadgets";
ability_operatorpvp_mute_jammerdeployed["it"] = "Jammer posizionati";
ability_operatorpvp_mute_jammerdeployed["en"] = "Jammers deployed";
ability_operatorpvp_ash_bonfirekill["it"] = "Uccisioni con munizioni da irruzione";
ability_operatorpvp_ash_bonfirekill["en"] = "Bonfire kills";
ability_operatorpvp_ash_bonfirewallbreached["it"] = "Muri distrutti";
ability_operatorpvp_ash_bonfirewallbreached["en"] = "Bonfire walls breached";
ability_operatorpvp_blackbeard_gunshieldblockdamage["it"] = "Danno bloccato dallo scudo";
ability_operatorpvp_blackbeard_gunshieldblockdamage["en"] = "Shield damage blocked";
ability_operatorpvp_valkyrie_camdeployed["it"] = "Black eye piazzate";
ability_operatorpvp_valkyrie_camdeployed["en"] = "Cams deployed";
ability_operatorpvp_dazzler_gadget_detonate["it"] = "Granate stordenti esplose";
ability_operatorpvp_dazzler_gadget_detonate["en"] = "Dazzlers detonated";
ability_operatorpvp_concussionmine_detonate["it"] = "Mine a concussione esplose";
ability_operatorpvp_concussionmine_detonate["en"] = "Concussion mines detonated";
ability_operatorpvp_black_mirror_gadget_deployed["it"] = "Specchi neri posizionati";
ability_operatorpvp_black_mirror_gadget_deployed["en"] = "Black mirrors deployed";
ability_operatorpvp_hibana_detonate_projectile["it"] = "X-KAIROS esplose";
ability_operatorpvp_hibana_detonate_projectile["en"] = "Projectiles detonated";
ability_operatorpvp_echo_enemy_sonicburst_affected["it"] = "Nemici storditi";
ability_operatorpvp_echo_enemy_sonicburst_affected["en"] = "Enemies stunned";
ability_operatorpvp_smoke_poisongaskill["it"] = "Nemici avvelenati";
ability_operatorpvp_smoke_poisongaskill["en"] = "Poisoned enemies";
ability_operatorpvp_rush_adrenalinerush["it"] = "Iniezioni di adrenalina";
ability_operatorpvp_rush_adrenalinerush["en"] = "Adrenaline rush";
ability_operatorpvp_concussiongrenade_detonate["it"] = "Granate a concussione esplose";
ability_operatorpvp_concussiongrenade_detonate["en"] = "Concussion granade detonated";
ability_operatorpvp_bandit_batterykill["it"] = "Uccisioni con batteria";
ability_operatorpvp_bandit_batterykill["en"] = "Battery kills";
ability_operatorpvp_caveira_interrogations["it"] = "Interrogazioni";
ability_operatorpvp_caveira_interrogations["en"] = "Interrogations";
ability_operatorpvp_fuze_clusterchargekill["it"] = "Uccisioni con carica a grappolo";
ability_operatorpvp_fuze_clusterchargekill["en"] = "Cluster charge kills";
ability_operatorpvp_pulse_heartbeatspot["it"] = "Nemici individuati";
ability_operatorpvp_pulse_heartbeatspot["en"] = "Enemies tagged";
ability_operatorpvp_pulse_heartbeatassist["it"] = "Assist";
ability_operatorpvp_pulse_heartbeatassist["en"] = "Assists";
ability_operatorpvp_sledge_hammerhole["it"] = "Superfici distrutte con martello";
ability_operatorpvp_sledge_hammerhole["en"] = "Hammer holes";
ability_operatorpvp_sledge_hammerkill["it"] = "Uccisioni con martello";
ability_operatorpvp_sledge_hammerkill["en"] = "Hammer kills";
ability_operatorpvp_castle_kevlarbarricadedeployed["it"] = "Barricate piazzate";
ability_operatorpvp_castle_kevlarbarricadedeployed["en"] = "Barricades deployed";
ability_operatorpvp_glaz_sniperkill["it"] = "Uccisione da cecchino";
ability_operatorpvp_glaz_sniperkill["en"] = "Sniper kills";
ability_operatorpvp_glaz_sniperpenetrationkill["it"] = "Uccisioni da cecchino in penetrazione";
ability_operatorpvp_glaz_sniperpenetrationkill["en"] = "Sniper penetration kills";
ability_operatorpvp_montagne_shieldblockdamage["it"] = "Danno bloccato con lo scudo";
ability_operatorpvp_montagne_shieldblockdamage["en"] = "Damage blocket with shield";
ability_operatorpvp_iq_gadgetspotbyef["it"] = "Gadget individuati";
ability_operatorpvp_iq_gadgetspotbyef["en"] = "Gadgets spotted";
ability_operatorpvp_twitch_shockdronekill["it"] = "Uccisioni col drone";
ability_operatorpvp_twitch_shockdronekill["en"] = "Drone kills";
ability_operatorpvp_twitch_gadgetdestroybyshockdrone["it"] = "Gadget distrutti col drone";
ability_operatorpvp_twitch_gadgetdestroybyshockdrone["en"] = "Gadgets destroyed by drone";
ability_operatorpvp_thermite_chargekill["it"] = "Uccisioni con cariche";
ability_operatorpvp_thermite_chargekill["en"] = "Charge kills";
ability_operatorpvp_thermite_chargedeployed["it"] = "Cariche piazzate";
ability_operatorpvp_thermite_chargedeployed["en"] = "Charges deployed";
ability_operatorpvp_thermite_reinforcementbreached["it"] = "Rinforzi distrutti";
ability_operatorpvp_thermite_reinforcementbreached["en"] = "Reinforcements breached";
ability_operatorpvp_rook_armorboxdeployed["it"] = "Armature piazzate";
ability_operatorpvp_rook_armorboxdeployed["en"] = "Armor boxes deployed";
ability_operatorpvp_rook_armortakenourself["it"] = "Armature indossate";
ability_operatorpvp_rook_armortakenourself["en"] = "Armors taken yourself";
ability_operatorpvp_rook_armortakenteammate["it"] = "Armature indossate dai compagni";
ability_operatorpvp_rook_armortakenteammate["en"] = "Armors taken teammate";
ability_operatorpvp_capitao_lethaldartkills["it"] = "Uccisioni con dardi";
ability_operatorpvp_capitao_lethaldartkills["en"] = "Dart kills";
ability_operatorpvp_buck_kill["it"] = "Uccisioni con SK4-12";
ability_operatorpvp_buck_kill["en"] = "SK4-12 kills";
ability_operatorpvp_frost_dbno["it"] = "Uccisioni con trappole";
ability_operatorpvp_frost_dbno["en"] = "Trap kills";
ability_operatorpvp_jager_gadgetdestroybycatcher["it"] = "Gadget distrutti";
ability_operatorpvp_jager_gadgetdestroybycatcher["en"] = "Gadgets destroyed";
ability_operatorpvp_thatcher_gadgetdestroywithemp["it"] = "Gadget distrutti";
ability_operatorpvp_thatcher_gadgetdestroywithemp["en"] = "Gadgets destroyed";
ability_operatorpvp_blitz_flashedenemy["it"] = "Nemici accecati";
ability_operatorpvp_blitz_flashedenemy["en"] = "Flashed enemies";
ability_operatorpvp_blitz_flashshieldassist["it"] = "Assist accecamento";
ability_operatorpvp_blitz_flashshieldassist["en"] = "Flashed enemy assists";
ability_operatorpvp_blitz_flashfollowupkills["it"] = "Nemici uccisi dopo l'accecamento";
ability_operatorpvp_blitz_flashfollowupkills["en"] = "Flashed enemy killed after flashing";
ability_operatorpvp_kapkan_boobytrapkill["it"] = "Uccisioni con trappole";
ability_operatorpvp_kapkan_boobytrapkill["en"] = "Trap kills";
ability_operatorpvp_kapkan_boobytrapdeployed["it"] = "Trappole piazzate";
ability_operatorpvp_kapkan_boobytrapdeployed["en"] = "Traps deployed";

var j = Schedule.scheduleJob('00 00 * * *', function () {
	console.log(getNow("it") + " Autotrack called from job");
	autoTrack();
});

bot.onText(/^\/start/i, function (message) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		var lang = "en";
		if (message.from.language_code != undefined){
			if (validLang.indexOf(message.from.language_code) != -1)
				lang = message.from.language_code;
		}
		var extra = "";
		if (Object.keys(rows).length == 0){
			connection.query("INSERT INTO user (account_id, lang) VALUES (" + message.from.id + ", '" + lang + "')", function (err, rows) {
				if (err) throw err;
				console.log(getNow("it") + " New user " + message.from.username + " (" + message.from.id + " - " + lang + ")");
			});
		}else{
			lang = rows[0].lang;
			if ((rows[0].default_username != null) && (rows[0].default_platform != null))
				extra = lang_default[lang] + rows[0].default_username + ", " + rows[0].default_platform + "\n";
			else {
				if (rows[0].default_username != null)
					extra = lang_default[lang] + rows[0].default_username + "\n";
				else if (rows[0].default_platform != null)
					extra = lang_default[lang] + rows[0].default_platform + "\n";
			}
		}

		bot.sendMessage(message.chat.id, lang_main[lang] + "\n\n" + extra + lang_storebot[lang], no_preview);
	});
});

bot.on("inline_query", function (query) {
	var data = query.query;

	if (data == "")
		return;

	if (data.length < 6)
		return;

	var lang = "en";
	connection.query("SELECT lang, default_platform FROM user WHERE account_id = " + query.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			rows[0].default_platform = "uplay";
			if (query.from.language_code != undefined){
				if (validLang.indexOf(query.from.language_code) != -1)
					lang = query.from.language_code;
			}
		}else{
			lang = rows[0].lang;
		}

		var split = data.split(" ");
		if (split[1] == undefined){
			if (rows[0].default_platform != null)
				split[1] = rows[0].default_platform;
			else {
				split[1] = "uplay";
			}
		}

		var username = split[0];
		var platform = split[1];

		console.log(getNow("it") + " User data request inline for " + username + " on " + platform);
		r6.stats(username, platform, false).then(response => {
			connection.query('SELECT ranked_playtime, casual_playtime FROM player_history WHERE platform = "' + response.player.platform + '" AND ubisoft_id = "' + response.player.ubisoft_id + '" ORDER BY id DESC', function (err, rows) {
				if (err) throw err;

				if (Object.keys(rows).length == 0){
					saveData(response);
				}else if ((rows[0].ranked_playtime < response.player.stats.ranked.playtime) || (rows[0].casual_playtime < response.player.stats.casual.playtime)){
					saveData(response);
				}

				bot.answerInlineQuery(query.id, [{
					id: '0',
					type: 'article',
					title: lang_inline_userinfo[lang],
					description: lang_inline_userfound[lang],
					message_text: 	"<b>" + response.player.username + "</b> (Lv " + response.player.stats.progression.level + " - " + jsUcfirst(response.player.platform) + ")\n" +
					"<b>" + lang_inline_ranked_kd[lang] + "</b>: " + response.player.stats.ranked.kd + "\n" +
					"<b>" + lang_inline_ranked_playtime[lang] + "</b>: " + toTime(response.player.stats.ranked.playtime, lang, true) + "\n" +
					"<b>" + lang_inline_casual_kd[lang] + "</b>: " + response.player.stats.casual.kd + "\n" +
					"<b>" + lang_inline_casual_playtime[lang] + "</b>: " + toTime(response.player.stats.casual.playtime, lang, true) + "\n" +
					"<b>" + lang_inline_total_kills[lang] + "</b>: " + formatNumber(response.player.stats.ranked.kills + response.player.stats.casual.kills) + "\n" +
					"<b>" + lang_inline_total_deaths[lang] + "</b>: " + formatNumber(response.player.stats.ranked.deaths + response.player.stats.casual.deaths) + "\n" +
					"<b>" + lang_inline_total_wins[lang] + "</b>: " + formatNumber(response.player.stats.ranked.wins + response.player.stats.casual.wins) + "\n" +
					"<b>" + lang_inline_total_losses[lang] + "</b>: " + formatNumber(response.player.stats.ranked.losses + response.player.stats.casual.losses) + "\n\n" + lang_inline_infos[lang],
					parse_mode: "HTML"
				}]);
			});
		}).catch(error => {
			bot.answerInlineQuery(query.id, [{
				id: '0',
				type: 'article',
				title: lang_inline_userinfo[lang],
				description: lang_user_not_found[lang],
				message_text: lang_user_not_found[lang],
				parse_mode: "HTML"
			}]);
			//console.log(getNow("it") + " User data not found inline for " + username + " on " + platform);
		});
	});
});

function saveData(response){
	connection.query('INSERT INTO player_history VALUES (DEFAULT, "' + response.player.ubisoft_id + '", "' +
					 response.player.platform + '","' +
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
		console.log(getNow("it") + " Saved user data for " + response.player.username);
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

bot.onText(/^\/setusername (.+)|^\/setusername/i, function (message, match) {
	connection.query("SELECT lang, autotrack FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /setusername");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].autotrack == 1){
			bot.sendMessage(message.chat.id, lang_autotrack_disable[lang]);
			return;
		}

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_user[lang]);
			return;
		}

		var user = match[1].toLowerCase();
		connection.query("UPDATE user SET default_username = '" + user + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_user_changed[lang]);
		});
	});
});

bot.onText(/^\/setplatform (.+)|^\/setplatform/i, function (message, match) {
	connection.query("SELECT lang, autotrack FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /setplatform");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].autotrack == 1){
			bot.sendMessage(message.chat.id, lang_autotrack_disable[lang]);
			return;
		}

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang]);
			return;
		}

		var platform = match[1].toLowerCase();
		if ((platform != "uplay") && (platform != "ps4") && (platform != "xone")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}
		connection.query("UPDATE user SET default_platform = '" + platform + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_platform_changed[lang]);
		});
	});
});

bot.onText(/^\/status (.+)|^\/status/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /stats");
			return;
		}

		var lang = rows[0].lang;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang]);
			return;
		}

		var platform = match[1].toLowerCase();
		if ((platform != "uplay") && (platform != "ps4") && (platform != "xone")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}

		var lang_complex = "";
		if (lang == "it")
			lang_complex = "it-it";
		else if (lang == "en")
			lang_complex = "en-us";

		var platform_complex = 0;
		if (platform == "uplay"){
			platform_complex = 9;
		}else if (platform == "ps4"){
			platform_complex = 47;
		}else if (platform == "xone"){
			platform_complex = 43;
		}

		console.log("Request server status from " + message.from.username);
		var url = "https://support.ubi.com/" + lang_complex + "/Games/2559?platform=" + platform_complex;
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			request({
				uri: url,
			}, function(error, response, body) {
				var regex = /<h2 class="message__title">(.*) <span>(.*)\<\/span><\/h2>/g;
				var matches = [];
				var status = "";
				while (matches = regex.exec(body))
					status = matches[2];
				bot.sendMessage(message.chat.id, jsUcfirst(platform) + " Server Status: " + status);
			});
		});
	});
});

bot.onText(/^\/news/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /news");
			return;
		}

		var lang = rows[0].lang;

		var lang_complex = "";
		var cookie = "";
		if (lang == "it")
			cookie = "italian";
		else if (lang == "en")
			cookie = "english";

		console.log(getNow("it") + " Request news in " + cookie + " from " + message.from.username);
		var url = "https://steamcommunity.com/games/359550/rss/";
		bot.sendChatAction(message.chat.id, "typing").then(function () {

			var parser = new Parser({
				headers: {'Cookie': 'Steam_Language=' + cookie},
			});

			(async () => {
				let feed = await parser.parseURL(url);
				var text = "";
				var d = "";
				var readall = "";
				feed.items.forEach(function(item, index, array) {
					d = new Date(item.pubDate);
					if (item.content.length > 500)
						readall = "- <a href='" + item.link + "'>" + lang_news_readall[lang] + "</a>";
					text += "<b>" + item.title + "</b>\n\n" + stripContent(item.content) + "\n\n<i>" + lang_news_date[lang] + toDate(lang, d) + "</i> " + readall + "\n\n";
					if (index === 4)
						bot.sendMessage(message.chat.id, text, no_preview);
				});
			})();
		});
	});
});

bot.onText(/^\/graph (.+)|^\/graph/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /graph");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang]);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang]);
			return;
		}

		var default_platform = rows[0].default_platform;

		var errMsg = lang_graph_no_param[lang] + validParam.join(", ")
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}
		if (validParam.indexOf(match[1]) == -1){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}

		var param = match[1];

		console.log(getNow("it") + " Request graph for " + param + " from " + message.from.username);
		connection.query("SELECT insert_date, " + param + " FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "'", function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length <= 1){
				bot.sendMessage(message.chat.id, lang_graph_no_data[lang]);
				return;
			}

			var arrX = [];
			var arrY = [];
			for (var i = 0, len = Object.keys(rows).length; i < len; i++) {
				arrX.push(rows[i].insert_date);
				arrY.push(eval("rows[i]." + param));
			}

			var trace1 = {
				x: arrX,
				y: arrY,
				type: "scatter"
			};
			var figure = { 'data': [trace1] };
			var imgOpts = {
				format: 'png',
				width: 1280,
				height: 800
			};

			plotly.getImage(figure, imgOpts, function (error, imageStream) {
				if (error) 
					return console.log (error);

				bot.sendPhoto(message.chat.id, imageStream);
			});
		});
	});
});

bot.onText(/^\/autotrack (.+)|^\/autotrack/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /graph");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang]);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang]);
			return;
		}

		var default_platform = rows[0].default_platform;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_autotrack[lang]);
			return;
		}

		if (match[1] == "enable"){
			connection.query("UPDATE user SET autotrack = 1 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_autotrack_enabled[lang]);
			});
		}else if (match[2] == "disable"){
			connection.query("UPDATE user SET autotrack = 0 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_autotrack_disabled[lang]);
			});
		}else{
			bot.sendMessage(message.chat.id, lang_autotrack_invalid[lang]);
		}
	});
});

bot.onText(/^\/stats (.+)|^\/stats/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /stats");
			return;
		}

		var lang = rows[0].lang;
		var split = [];
		if (match[1] == undefined){
			split[0] = undefined;
			split[1] = undefined;
		}else
			split = match[1].split(" ");

		if (split[0] == undefined){
			if (message.reply_to_message != undefined)
				split[0] = message.reply_to_message.from.username;
			else if (rows[0].default_username != null)
				split[0] = rows[0].default_username;
			else{
				bot.sendMessage(message.chat.id, lang_invalid_user[lang]);
				return;
			}
		}

		if (split[1] == undefined){
			if (rows[0].default_platform != null)
				split[1] = rows[0].default_platform;
			else
				split[1] = "uplay";
		}

		var username = split[0];
		var platform = split[1];

		console.log(getNow("it") + " Request user data for " + username + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username, platform, false).then(response => {
				connection.query('SELECT ranked_playtime, casual_playtime FROM player_history WHERE platform = "' + response.player.platform + '" AND ubisoft_id = "' + response.player.ubisoft_id + '" ORDER BY id DESC', function (err, rows) {
					if (err) throw err;

					if (Object.keys(rows).length == 0)
						saveData(response);
					else if ((rows[0].ranked_playtime < response.player.stats.ranked.playtime) || (rows[0].casual_playtime < response.player.stats.casual.playtime))
						saveData(response);

					var text = "<b>" + lang_username[lang] + "</b>: " + response.player.username + "\n" +
						"<b>" + lang_platform[lang] + "</b>: " + jsUcfirst(response.player.platform) + "\n" +
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
							console.log(getNow("it") + " User data served for " + username + " on " + platform);
						}).catch(error => {
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
							console.log(getNow("it") + " User data operators not found for " + username + " on " + platform);
						});
					});
				});
			}).catch(error => {
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
				console.log(getNow("it") + " User data not found for " + username + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/compare (.+) (.+)|^\/compare/i, function (message, match) {
	connection.query("SELECT lang, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
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

		var platform = "uplay";
		if (rows[0].default_platform != null)
			platform = rows[0].default_platform;

		var username1 = match[1];
		var username2 = match[2];

		console.log(getNow("it") + " Request user compare for " + username1 + " and " + username2 + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username1, platform, false).then(response1 => {

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username2, platform, false).then(response2 => {

						var text = "<i>" + response1.player.username + " vs " + response2.player.username + "</i>\n" +
							"<b>" + lang_platform[lang] + "</b>: " + jsUcfirst(response1.player.platform) + " - " + jsUcfirst(response2.player.platform) + "\n" +
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
						console.log(getNow("it") + " User data not found for " + username2 + " on " + platform);
					});
				});
			}).catch(error => {
				bot.sendMessage(message.chat.id, "<b>" + error.errors[0].title + "</b>\n" +  error.errors[0].detail, html);
				console.log(getNow("it") + " User data not found for " + username1 + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/operators (.+)|^\/operators/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /operators");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang]);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang]);
			return;
		}

		var default_platform = rows[0].default_platform;

		console.log(getNow("it") + " Request operators data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, true).then(response => {
				var text = "<b>" + lang_operator_title[lang] + " - " + lang_operator_plays[lang] + " - " + lang_operator_wins[lang] + " - " + lang_operator_losses[lang] + " - " + lang_operator_kills[lang] + " - " + lang_operator_deaths[lang] + " - " + lang_operator_playtime[lang] + " - " + lang_operator_specials[lang] + "</b>\n";
				var operators_num = Object.keys(response.operator_records).length;		
				for (i = 0; i < operators_num; i++){
					text += "<b>" + response.operator_records[i].operator.name + "</b> - " + formatNumber(response.operator_records[i].stats.played) + " - " + formatNumber(response.operator_records[i].stats.wins) + " - " + formatNumber(response.operator_records[i].stats.losses) + " - " + formatNumber(response.operator_records[i].stats.kills) + " - " + formatNumber(response.operator_records[i].stats.deaths) + " - " + toTime(response.operator_records[i].stats.playtime, lang, true);

					if (response.operator_records[i].stats.specials != undefined){
						var specials = Object.keys(response.operator_records[i].stats.specials);
						var sum = 0;
						for (j = 0; j < specials.length; j++)
							sum += parseInt(eval("response.operator_records[" + i + "].stats.specials." + specials[j]));
						text += " - " + formatNumber(sum);
					}
					text += "\n";
				}
				bot.sendMessage(message.chat.id, text + lang_operator_extra[lang], html);
			}).catch(error => {
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + default_platform + ")", html);
				console.log(getNow("it") + " Operators data not found for " + default_username + " on " + default_platform);
			});
		});
	});
});

bot.onText(/^\/operator (.+)|^\/operator$/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /operator");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang]);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang]);
			return;
		}

		var default_platform = rows[0].default_platform;

		var operator_name;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_operator_no_name[lang]);
			return;
		}
		operator_name = match[1];

		console.log(getNow("it") + " Request operator data for " + operator_name + " from " + message.from.username);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, true).then(response => {
				var name = "";
				var played = 0;
				var wins = 0;
				var losses = 0;
				var kills = 0;
				var deaths = 0;
				var playtime = 0;
				var special_names = [];
				var special_values = [];
				var operators_num = Object.keys(response.operator_records).length;		
				for (i = 0; i < operators_num; i++){
					if (response.operator_records[i].operator.name.toLowerCase() == operator_name.toLowerCase()){
						name = response.operator_records[i].operator.name;
						played = response.operator_records[i].stats.played;
						wins = response.operator_records[i].stats.wins;
						losses = response.operator_records[i].stats.losses;
						kills = response.operator_records[i].stats.kills;
						deaths = response.operator_records[i].stats.deaths;
						playtime = response.operator_records[i].stats.playtime;

						if (response.operator_records[i].stats.specials != undefined){
							var specials = Object.keys(response.operator_records[i].stats.specials);
							for (j = 0; j < specials.length; j++){
								special_names.push(eval("ability_" + specials[j] + "['" + lang + "']"));
								special_values.push(parseInt(eval("response.operator_records[" + i + "].stats.specials." + specials[j])));
							}
						}
					}
				}

				if (name == ""){
					bot.sendMessage(message.chat.id, lang_operator_not_found[lang]);
					return;
				}

				var text = 	"<b>" + lang_operator_title[lang] + "</b>: " + name + "\n" +
					"<b>" + lang_operator_plays[lang] + "</b>: " + formatNumber(played) + "\n" +
					"<b>" + lang_operator_wins[lang] + "</b>: " + formatNumber(wins) + "\n" +
					"<b>" + lang_operator_losses[lang] + "</b>: " + formatNumber(losses) + "\n" +
					"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(kills) + "\n" +
					"<b>" + lang_operator_deaths[lang] + "</b>: " + formatNumber(deaths) + "\n" +
					"<b>" + lang_operator_playtime[lang] + "</b>: " + toTime(playtime, lang, true) + "\n";
				for (j = 0; j < specials.length; j++){
					text += "<b>" + special_names[j] + "</b>: " + formatNumber(special_values[j]) + "\n";
				}

				bot.sendMessage(message.chat.id, text, html);
			}).catch(error => {
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang] + " (" + default_platform + ")", html);
				console.log(getNow("it") + " Operators data not found for " + operator_name + " from " + message.from.username);
			});
		});
	});
});

bot.onText(/^\/help/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			bot.sendMessage(message.chat.id, "Use /start before use /help");
			return;
		}

		var mark = {
			parse_mode: "Markdown"
		};

		bot.sendMessage(message.chat.id, lang_help[rows[0].lang], mark);
	});
});

bot.onText(/^\/execute_autotrack/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Autotrack called manually");
		autoTrack();
	}
});

function autoTrack(){
	connection.query('SELECT default_username, default_platform FROM user WHERE autotrack = 1', function (err, rows, fields) {
		if (err) throw err;

		if (Object.keys(rows).length > 0)
			rows.forEach(setAutoTrack);
	});
}

function setAutoTrack(element, index, array) {
	var username = element.default_username;
	var platform = element.default_platform;

	r6.stats(username, platform, false).then(response => {
		connection.query('SELECT ranked_wins FROM player_history WHERE platform = "' + response.player.platform + '" AND username = "' + response.player.username + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				saveData(response);
				console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " saved (new)");
			}else if ((rows[0].ranked_playtime < response.player.stats.ranked.playtime) || (rows[0].casual_playtime < response.player.stats.casual.playtime)){
				saveData(response);
				console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " saved (update)");
			}else{
				console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " skipped");
			}
		});
	}).catch(error => {
		console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " not found");
	});
};

function stripContent(text){
	text = striptags(text, ["b","i","br","li"]);
	text = text.replaceAll("(<br>)","\n");
	text = text.replaceAll("(<li>)","\n- ");
	text = text.replaceAll("(</li>)","");

	// sempre per ultima
	text = text.replaceAll("((\\n\\n\\n))","\n\n");
	if (text.length > 500)
		text = text.substr(0, 500) + "...";
	return text.trim();
}

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

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

function getNow(lang, obj) {
	var d = new Date();
	obj = typeof obj !== 'undefined' ? obj : false;
	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else {
		datetime = "Error";
	}
	if (obj == true) {
		datetime = new Date(datetime);
	}
	return datetime;
}

function toDate(lang, date) {
	var d = new Date(date);
	if (typeof date == "object")
		d = date;
	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " alle " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + ':' + addZero(d.getSeconds());
	} else {
		datetime = "Error";
	}
	return datetime;
}

function jsUcfirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}