process.env["NTBA_FIX_319"] = 1;
process.env["NTBA_FIX_350"] = 1;

process.on('uncaughtException', function (error) {
	console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");
});

process.on('unhandledRejection', function (error, p) {
	console.log("\x1b[31m","Error: ", error.message, "\x1b[0m");
});

const appcode = "r6apitelegram";

var config = require('./config.js');
var TelegramBot = require('node-telegram-bot-api');
var mysql = require('mysql');
var mysql_sync = require('sync-mysql');
var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require('body-parser');
var humanizeDuration = require('humanize-duration')
var request = require("request");
var plotly = require('plotly')('redfenix45', config.plotlytoken);
var Schedule = require('node-schedule');
var Parser = require('rss-parser');
var request = require('request');
var striptags = require('striptags');
var stringSimilarity = require('string-similarity');

class RainbowSixApi {
	constructor() {}

	stats(username, platform, season, extra) {
		return new Promise((resolve, reject) => {

			var endpoint;

			if (extra == 1){
				endpoint = "http://fenixweb.net/r6api/getOperators.php?name=" + username + "&platform=" + platform + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {
					if(!error && response.statusCode == '200') {
						var objResp = JSON.parse(body);

						var keys = Object.keys(objResp.players);
						var ubi_id = keys[0];

						if (objResp.players[ubi_id] == undefined)
							return reject("User not found (1) - " + username);

						var objOps = objResp.players[ubi_id];
						return resolve(objOps);
					}
				});
			}else if (extra == 2){
				endpoint = "http://fenixweb.net/r6api/getOperators.php?name=" + username + "&platform=" + platform + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {
					if(!error && response.statusCode == '200') {
						var objResp = JSON.parse(body);
						var objOps = objResp.operators;
						return resolve(objOps);
					}
				});
			}else{
				var objStats = {};

				endpoint = "http://fenixweb.net/r6api/getUser.php?name=" + username + "&platform=" + platform + "&season=" + season + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {
					if(!error && response.statusCode == '200') {
						var objResp = JSON.parse(body);

						var keys = Object.keys(objResp.players);
						var ubi_id = keys[0];

						if (objResp.error != undefined)
							return reject(objResp.error.message);

						if (objResp.players[ubi_id] == undefined)
							return reject("User not found (0) - " + username);

						objStats.profile_id = objResp.players[ubi_id].profile_id;
						objStats.username = objResp.players[ubi_id].nickname;
						objStats.platform = objResp.players[ubi_id].platform;
						objStats.level = objResp.players[ubi_id].level;
						objStats.xp = objResp.players[ubi_id].xp;									
						objStats.season_id = objResp.players[ubi_id].season;
						objStats.season_rank = objResp.players[ubi_id].rank;
						
						/*
						var d = new Date();
						if ((d.getDay() == 1) && (d.getMonth() == 3))
							objStats.season_rank = 20;
						*/
						
						objStats.season_mmr = objResp.players[ubi_id].mmr;
						objStats.season_max_mmr = objResp.players[ubi_id].max_mmr;

						if (objStats.season_rank == undefined) objStats.season_rank = 0;
						if (objStats.season_mmr == undefined) objStats.season_mmr = 0;
						if (objStats.season_max_mmr == undefined) objStats.season_max_mmr = 0;

						endpoint = "http://fenixweb.net/r6api/getStats.php?name=" + username + "&platform=" + platform + "&appcode=r6apitelegram";
						request.get(endpoint, (error, response, body) => {
							if(!error && response.statusCode == '200') {
								var objResp = JSON.parse(body);
								
								if (objResp.players[ubi_id] == undefined)
									return reject("User stats empty - " + username);

								objStats.ranked_plays = objResp.players[ubi_id].rankedpvp_matchplayed;
								objStats.ranked_wins = objResp.players[ubi_id].rankedpvp_matchwon;
								objStats.ranked_losses = objResp.players[ubi_id].rankedpvp_matchlost;
								objStats.ranked_kills = objResp.players[ubi_id].rankedpvp_kills;
								objStats.ranked_deaths = objResp.players[ubi_id].rankedpvp_death;
								objStats.ranked_playtime = objResp.players[ubi_id].rankedpvp_timeplayed;
								objStats.casual_plays = objResp.players[ubi_id].casualpvp_matchplayed;
								objStats.casual_wins = objResp.players[ubi_id].casualpvp_matchwon;
								objStats.casual_losses = objResp.players[ubi_id].casualpvp_matchlost;
								objStats.casual_kills = objResp.players[ubi_id].casualpvp_kills;
								objStats.casual_deaths = objResp.players[ubi_id].casualpvp_death;
								objStats.casual_playtime = objResp.players[ubi_id].casualpvp_timeplayed;
								objStats.revives = objResp.players[ubi_id].generalpvp_revive;
								objStats.suicides = objResp.players[ubi_id].generalpvp_suicide;
								objStats.reinforcements_deployed = objResp.players[ubi_id].generalpvp_reinforcementdeploy;
								objStats.barricades_built = objResp.players[ubi_id].generalpvp_barricadedeployed;
								objStats.bullets_hit = objResp.players[ubi_id].generalpvp_bullethit;
								objStats.headshots = objResp.players[ubi_id].generalpvp_headshot;
								objStats.melee_kills = objResp.players[ubi_id].generalpvp_meleekills;
								objStats.penetration_kills = objResp.players[ubi_id].generalpvp_penetrationkills;
								objStats.assists = objResp.players[ubi_id].generalpvp_killassists;
								objStats.mode_secure = objResp.players[ubi_id].secureareapvp_bestscore;
								objStats.mode_hostage = objResp.players[ubi_id].rescuehostagepvp_bestscore;
								objStats.mode_bomb = objResp.players[ubi_id].plantbombpvp_bestscore;

								if (objStats.ranked_plays == undefined) objStats.ranked_plays = 0;
								if (objStats.ranked_wins == undefined) objStats.ranked_wins = 0;
								if (objStats.ranked_losses == undefined) objStats.ranked_losses = 0;
								if (objStats.ranked_kills == undefined) objStats.ranked_kills = 0;
								if (objStats.ranked_deaths == undefined) objStats.ranked_deaths = 0;
								if (objStats.ranked_playtime == undefined) objStats.ranked_playtime = 0;
								if (objStats.casual_plays == undefined) objStats.casual_plays = 0;
								if (objStats.casual_wins == undefined) objStats.casual_wins = 0;
								if (objStats.casual_losses == undefined) objStats.casual_losses = 0;
								if (objStats.casual_kills == undefined) objStats.casual_kills = 0;
								if (objStats.casual_deaths == undefined) objStats.casual_deaths = 0;
								if (objStats.casual_playtime == undefined) objStats.casual_playtime = 0;
								if (objStats.revives == undefined) objStats.revives = 0;
								if (objStats.suicides == undefined) objStats.suicides = 0;
								if (objStats.reinforcements_deployed == undefined) objStats.reinforcements_deployed = 0
								if (objStats.barricades_built == undefined) objStats.barricades_built = 0;
								if (objStats.bullets_hit == undefined) objStats.bullets_hit = 0;
								if (objStats.headshots == undefined) objStats.headshots = 0;
								if (objStats.melee_kills == undefined) objStats.melee_kills = 0;
								if (objStats.penetration_kills == undefined) objStats.penetration_kills = 0;
								if (objStats.assists == undefined) objStats.assists = 0;	
								if (objStats.mode_secure == undefined) objStats.mode_secure = 0;
								if (objStats.mode_hostage == undefined) objStats.mode_hostage = 0;
								if (objStats.mode_bomb == undefined) objStats.mode_bomb = 0;

								objStats.ranked_wl = (objStats.ranked_wins/objStats.ranked_losses).toFixed(3);
								if (!isFinite(objStats.ranked_wl)) objStats.ranked_wl = objStats.ranked_wins;
								objStats.ranked_kd = (objStats.ranked_kills/objStats.ranked_deaths).toFixed(3);
								if (!isFinite(objStats.ranked_kd)) objStats.ranked_kd = objStats.ranked_kills;
								objStats.casual_wl = (objStats.casual_wins/objStats.casual_losses).toFixed(3);
								if (!isFinite(objStats.casual_wl)) objStats.casual_wl = objStats.casual_wins;
								objStats.casual_kd = (objStats.casual_kills/objStats.casual_deaths).toFixed(3);
								if (!isFinite(objStats.casual_kd)) objStats.casual_kd = objStats.casual_kills;

								return resolve(objStats);
							}else
								console.log(error);
						});
					}else
						console.log(error);
				});
			}
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

var connection_sync = new mysql_sync({
	host: config.dbhost,
	user: config.dbuser_r6stats,
	password: config.dbpassword_r6stats,
	database: config.dbdatabase_r6stats
});

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
var defaultLang = "it";
var validParam = ["casual_kd", "ranked_kd", "season_mmr", "season_max_mmr", "casual_wl", "ranked_wl"];
var operatorList = ["Alibi","Maestro","Finka","Lion","Vigil","Dokkaebi","Zofia","Ela","Ying","Lesion","Mira","Jackal","Hibana","Echo","Caveira","Capitao","Blackbeard","Valkyrie","Buck","Frost","Mute","Sledge","Smoke","Thatcher","Ash","Castle","Pulse","Thermite","Montagne","Twitch","Doc","Rook","Jager","Bandit","Blitz","IQ","Fuze","Glaz","Tachanka","Kapkan","Maverick","Clash","Nomad","Kaid","Mozzie","Gridlock"];
var seasonList = ["Black Ice", "Dust Line", "Skull Rain", "Red Crow", "Velvet Shell", "Health", "Blood Orchid", "White Noise", "Chimera", "Para Bellum", "Grim Sky", "Wind Bastion", "Burnt Horizon"];
var lang_main = [];
var lang_stats = [];
var lang_startme = [];
var lang_changed = [];
var lang_invalid_lang = [];
var lang_invalid_user = [];
var lang_invalid_user_1 = [];
var lang_default_user_changed = [];
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
var lang_news_readall = [];
var lang_news_date = [];
var lang_operator_no_name = [];
var lang_operator_not_found = [];
var lang_help = [];
var lang_last_news = [];
var lang_groups = [];
var lang_rank = [];
var lang_time = [];
var lang_update_ok = [];
var lang_update_err = [];
var lang_update_err_2 = [];
var lang_update_err_3 = [];

var lang_username = [];
var lang_platform = [];
var lang_level = [];
var lang_xp = [];

var lang_ranked_plays = [];
var lang_ranked_win = [];
var lang_ranked_losses = [];
var lang_ranked_wl = [];
var lang_ranked_kills = [];
var lang_ranked_deaths = [];
var lang_ranked_kd = [];
var lang_ranked_playtime = [];
var lang_casual_plays = [];
var lang_casual_win = [];
var lang_casual_losses = [];
var lang_casual_wl = [];
var lang_casual_kills = [];
var lang_casual_deaths = [];
var lang_casual_kd = [];
var lang_casual_playtime = [];

var lang_revives = [];
var lang_suicides = [];
var lang_reinforcements = [];
var lang_barricades = [];
var lang_bullets_hit = [];
var lang_headshots = [];
var lang_melee_kills = [];
var lang_penetration_kills = [];
var lang_assists = [];

var lang_op_kd = [];
var lang_op_wl = [];
var lang_op_plays = [];
var lang_op_wins = [];
var lang_op_losses = [];
var lang_op_kills = [];
var lang_op_deaths = [];
var lang_op_playtime = [];

var lang_title_ranked = [];
var lang_title_casual = [];
var lang_title_general = [];
var lang_title_season = [];
var lang_title_operators = [];

var lang_insert_date = [];

var lang_inline_total_kills = [];
var lang_inline_total_deaths = [];
var lang_inline_total_wins = [];
var lang_inline_total_losses = [];
var lang_inline_best_operator = [];
var lang_inline_ranked_kd = [];
var lang_inline_casual_kd = [];
var lang_inline_ranked_playtime = [];
var lang_inline_casual_playtime = [];
var lang_inline_userinfo = [];
var lang_user_not_ready = [];
var lang_inline_userfound = [];
var lang_inline_infos = [];
var lang_inline_season = [];

var lang_operator_title = [];
var lang_operator_role_atk = [];
var lang_operator_role_def = [];
var lang_operator_plays = [];
var lang_operator_wins = [];
var lang_operator_losses = [];
var lang_operator_wlratio = [];
var lang_operator_kills = [];
var lang_operator_deaths = [];
var lang_operator_kdratio = [];
var lang_operator_playtime = [];
var lang_operator_specials = [];
var lang_operator_extra = [];

var lang_season_rank = [];
var lang_season_mmr = [];
var lang_season_max_mmr = [];
var lang_season_not_ranked = [];
var lang_season_prevision = [];

var lang_title_mode = [];
var lang_mode_secure = [];
var lang_mode_hostage = [];
var lang_mode_bomb = [];
var lang_points = [];

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
var ability_operatorpvp_tachanka_turretkill = [];
var ability_operatorpvp_deceiver_revealedattackers = [];
var ability_operatorpvp_maverick_wallbreached = [];
var ability_operatorpvp_clash_sloweddown = [];
var ability_operatorpvp_Kaid_Electroclaw_Hatches = [];
var ability_operatorpvp_Nomad_Assist = [];
var ability_operatorpvp_mozzie_droneshacked = [];
var ability_operatorpvp_gridlock_traxdeployed = [];

var lang_loadout_intro = [];
var lang_loadout_primary = [];
var lang_loadout_weapon = [];
var lang_loadout_grip = [];
var lang_loadout_sight = [];
var lang_loadout_attachment  = [];
var lang_loadout_laser = [];
var lang_loadout_secondary = [];
var lang_loadout_utility = [];

var lang_loadout_map_verticalgrip = [];
var lang_loadout_map_holographic = [];
var lang_loadout_map_compensator = [];
var lang_loadout_map_impact = [];
var lang_loadout_map_shield = [];
var lang_loadout_map_flashider = [];
var lang_loadout_map_breach = [];
var lang_loadout_map_reddot = [];
var lang_loadout_map_muzzle = [];
var lang_loadout_map_nitro = [];
var lang_loadout_map_smoke = [];
var lang_loadout_map_barbed = [];
var lang_loadout_map_frag = [];
var lang_loadout_map_bulletproof = [];
var lang_loadout_map_stun = [];
var lang_loadout_map_suppressor = [];
var lang_loadout_map_lasertrue = [];

var lang_challenges_preview = [];
var lang_challenges_rewards = [];
var lang_challenges_refresh = [];

var lang_team_invalid_syntax = [];
var lang_team_invalid_name = [];
var lang_team_invalid_at = [];
var lang_team_invalid_count = [];
var lang_team_created = [];
var lang_team_users_added = [];
var lang_team_only_leader = [];
var lang_team_not_exists = [];
var lang_team_not_leader_del = [];
var lang_team_remove_yourself = [];
var lang_team_deleted = [];
var lang_team_user_removed = [];
var lang_team_call = [];
var lang_team_intro = [];
var lang_team_no_team = [];
var lang_team_only_groups = [];

var lang_search_noplayers = [];
var lang_search_found = [];
var lang_private = [];
var lang_extra_info = [];
var lang_invalid_multiple = [];
var lang_multiple_limit = [];

var lang_rank_copper4 = [];
var lang_rank_copper3 = [];
var lang_rank_copper2 = [];
var lang_rank_copper1 = [];
var lang_rank_bronze4 = [];
var lang_rank_bronze3 = [];
var lang_rank_bronze2 = [];
var lang_rank_bronze1 = [];
var lang_rank_silver4 = [];
var lang_rank_silver3 = [];
var lang_rank_silver2 = [];
var lang_rank_silver1 = [];
var lang_rank_gold4 = [];
var lang_rank_gold3 = [];
var lang_rank_gold2 = [];
var lang_rank_gold1 = [];
var lang_rank_platinum3 = [];
var lang_rank_platinum2 = [];
var lang_rank_platinum1 = [];
var lang_rank_diamond = [];

var lang_no_validgraph = [];
var lang_report_deactivated = [];
var lang_report_activated = [];
var lang_report_header_week = [];
var lang_report_header_month = [];

var lang_info_notfound = [];
var lang_info_notfound2 = [];
var lang_info_result = [];

var lang_seasons_intro = [];
var lang_rank_data = [];
var lang_search_mates = [];
var lang_search_join = [];
var lang_search_mates_lbl = [];
var lang_search_already = [];
var lang_search_ok = [];
var lang_invalid_find = [];

var lang_on = [];
var lang_daily_report_header = [];
var lang_daily_report_activated = [];
var lang_daily_report_deactivated = [];

var lang_inline_invite_join = [];
var lang_inline_invite_title = [];
var lang_inline_invite_desc = [];
var lang_inline_invite_text = [];

lang_main["it"] = "Benvenuto in <b>Rainbow Six Siege Stats</b>! [Available also in english! 🇺🇸]\n\nUsa '/stats username,piattaforma' per visualizzare le informazioni del giocatore, per gli altri comandi digita '/' e visualizza i suggerimenti. Funziona anche inline!";
lang_main["en"] = "Welcome to <b>Rainbow Six Siege Stats</b>! [Disponibile anche in italiano! 🇮🇹]\n\nUse '/stats username,platform' to print player infos, to other commands write '/' and show hints. It works also inline!";
lang_stats["it"] = "%n operatori registrati, %s statistiche memorizzate";
lang_stats["en"] = "%n operators registered, %s stats saved";
lang_startme["it"] = "Avviami in privato prima di usare il comando";
lang_startme["en"] = "Start me in private mode before use";
lang_changed["it"] = "Lingua modificata!";
lang_changed["en"] = "Language changed!";
lang_invalid_lang["it"] = "Lingua non valida. Lingue disponibili: ";
lang_invalid_lang["en"] = "Invalid language. Available languages: ";
lang_invalid_user["it"] = "Nome utente non valido, esempio: /stats username,piattaforma.";
lang_invalid_user["en"] = "Invalid username, example: /stats username,platform.";
lang_invalid_user_1["it"] = "Nome utente non valido.";
lang_invalid_user_1["en"] = "Invalid username.";
lang_default_user_changed["it"] = "Nome utente predefinito modificato!";
lang_default_user_changed["en"] = "Default username changed!";
lang_invalid_user_2["it"] = "Username non specificati, esempio: /compare username1,username2.";
lang_invalid_user_2["en"] = "Username not specified, example: /compare username1,username2.";
lang_invalid_platform["it"] = "Piattaforma non specificata.";
lang_invalid_platform["en"] = "Platform not specified.";
lang_invalid_platform_2["it"] = "Piattaforma non valida. Piattaforme disponibili: uplay (pc), psn (ps4) o xbl (xbox one).";
lang_invalid_platform_2["en"] = "Invalid platform. Available platforms: uplay (pc), psn (ps4) or xbl (xbox one).";
lang_default_platform_changed["it"] = "Piattaforma predefinita modificata!";
lang_default_platform_changed["en"] = "Default platform changed!";
lang_default["it"] = "Impostazioni attuali: ";
lang_default["en"] = "Actual settings: ";
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
lang_news_readall["it"] = "Leggi notizia completa";
lang_news_readall["en"] = "Read full article";
lang_news_date["it"] = "Pubblicato alle ";
lang_news_date["en"] = "Published at ";
lang_operator_no_name["it"] = "Nome operatore non specificato.";
lang_operator_no_name["en"] = "Operator name not specified.";
lang_operator_not_found["it"] = "Operatore non trovato.";
lang_operator_not_found["en"] = "Operator not found.";
lang_help["it"] = 	"*Guida ai comandi:*\n" +
	"> '/stats <username>,<piattaforma>' - Permette di visualizzare la lista completa delle statistiche del giocatore specificato nei parametri del comando. E' possibile omettere i parametri se sono stati salvati con /setusername o /setplatform.\n" +
	"> '/mstats <username1>,<username2>,ecc. - Permette di visualizzare statistiche brevi per la lista di utenti specificata.\n" +
	"> '/update' - Forza l'aggiornamento delle statistiche del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/operators' - Permette di visualizzare la lista completa degli operatori del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/operator <nome-operatore>' - Permette di visualizzare i dettagli di un solo operatore specificato come parametro utilizzando /setusername e /setplatform.\n" +
	"> '/seasons' - Permette di visualizzare la lista completa del rango ottenuto in tutte le stagioni del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/rank' - Permette di visualizzare il rango attuale del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/compare <username1>,<username2>' - Permette di confrontare le statistiche di due giocatori utilizzando come piattaforma quella specificata utilizzando /setplatform.\n" +
	"> '/graph <parametro>' - Genera un grafico per il parametro specificato.\n" +
	"> '/lastgraph' - Genera un grafico utilizzando l'ultimo parametro usato.\n" +
	"> '/loadout <nome-operatore>' - Suggerisce un equipaggiamento per l'operatore specificato.\n" +
	"> '/status <piattaforma>' - Permette di visualizzare lo status ufficiale dei server di gioco.\n" +
	"> '/news <numero>' - Permette di visualizzare le ultime news ufficiali del gioco reperite da Steam.\n" +
	"> '/challenges' - Permette di visualizzare le sfide settimanali in corso.\n" +
	"> '/lang <lingua>' - Imposta la lingua del bot.\n" +
	"> '/setusername <username>' - Imposta il nome utente di default necessario per alcune funzioni.\n" +
	"> '/setplatform <piattaforma>' - Imposta la piattaforma di default necessaria per alcune funzioni.\n" +
	"> '/r6info' - (in risposta) Consente di visualizzare le informazioni salvate dell'utente come username e piattaforma.\n" +
	"> '/find <piattaforma>' - Crea un messaggio dove gli altri giocatori possono partecipare rendendosi disponibili.\n" +
	"> '/team <nome-team> <utenti>' - Crea un team e fornisce la possibilità di taggarne tutti i membri.\n" +
	"> '/search <piattaforma>' - Invia in privato un messaggio con tutti i nomi in game degli utenti relativi alla lingua ed alla piattaforma inserita.\n" +
	"> '/setreport' - Attiva o disattiva il report statistiche del gruppo in cui si è usato /stats l'ultima volta.\n" +
	"> '/setdailyreport' - Attiva o disattiva il report statistiche giornaliero del giocatore.\n" +
	"\nE' possibile utilizzare il bot anche *inline* inserendo username e piattaforma come per il comando /stats oppure invitare qualcuno nel gruppo italiano!\n\nPer ulteriori informazioni contatta @fenix45.";
lang_help["en"] = 	"*Commands tutorial:*\n" +
	"> '/stats <username>,<platform>' - Allow to print a complete stats list of user specified in command parameters. Is possibile to omit params if they has been saved with /setusername and /setplatform.\n" +
	"> '/mstats <username1>,<username2>,etc. - Allow to print a short stats for multiple specified users.\n" +
	"> '/update' - Force update of user stats of player specified using /setusername and /setplatform.\n" +
	"> '/operators' - Allow to print a complete operators list of player specified using /setusername and /setplatform.\n" +
	"> '/operator <operator-name>' - Allow to print operator details specified as parameter using /setusername and /setplatform.\n" +
	"> '/seasons' - Allow to print seasons ranks details specified as parameter using /setusername and /setplatform.\n" +
	"> '/rank' - Allow to print rank specified as parameter using /setusername and /setplatform.\n" +
	"> '/compare <username1>,<username2>' - Allow to compare two players stats using platform specified using /setplatform.\n" +
	"> '/graph <parameter>' - Generate a graph using parameter specified.\n" +
	"> '/lastgraph' - Generate a graph using last parameter used.\n" +
	"> '/loadout <operator-name>' - Suggest a full loadout for specified operator.\n" +
	"> '/status <platform>' - Allow to print official server status of the game.\n" +
	"> '/news <number>' - Allow to print latest official news of the game wrote by Steam.\n" +
	"> '/challenges' - Allow to print current weekly challenges.\n" +
	"> '/lang <language>' - Change bot language.\n" +
	"> '/setusername <username>' - Change default username to use some functions.\n" +
	"> '/setplatform <platform>' - Change default platform to use some functions.\n" +
	"> '/r6info' - (in reply) Allow to show infos about saved user like username and platform.\n" +
	"> '/find <platform>' - Make a message where other player can join.\n" +
	"> '/team <team-name> <users>' - Create a team and offer the possibility to tag all members.\n" +
	"> '/search <platform>' - Send in private a message with name of users found with selected language and platform.\n" +
	"> '/setreport' - Active or deactive stats report in group where you have used /stats last time.\n" +
	"> '/setdailyreport' - Active or deactive user daily stats report.\n" +
	"\nYou can also use the *inline mode* providing username and platform like /stats command!\n\nFor informations contact @fenix45.";
lang_last_news["it"] = 	"<b>Ultimi aggiornamenti:</b>\n" +
						"23/04/19 - Aggiunta la possibilità di invitare qualcuno nel gruppo scrivendo 'invite' in inline\n" +
						"21/04/19 - Aggiunto il comando /setdailyreport con la relativa funzione automatica\n" +
						"09/04/19 - Aggiunto il comando /find\n" +
						"01/04/19 - Aggiunto il comando /rank\n" +
						"26/03/19 - Aggiunto il comando /seasons\n" +
						"11/03/19 - Completata l'integrazione di Gridlock e Mozzie e aggiunto il comando /r6info\n" +
						"22/02/19 - Aggiunto il supporto a Gridlock e Mozzie\n" +
						"08/02/19 - Aggiunta la generazione settimanale/mensile delle statistiche operatori per gruppo, per disattivare la funzione usa /setreport";
lang_last_news["en"] = 	"<b>Latest updates:</b>\n" +
						"04/21/19 - Added /setdailyreport command with relative automatic function\n" +
						"04/09/19 - Added /find command\n" +
						"04/01/19 - Added /rank command\n" +
						"03/26/19 - Added /seasons command\n" +
						"03/11/19 - Finished Gridlock and Mozzie integration and added /r6info command\n" +
						"02/22/19 - Added support for Gridlock and Mozzie\n" +
						"02/08/19 - Added weekly and monthly report generation for operator stats, you can disable by using /setreport";
lang_groups["it"] = "<b>Gruppi affiliati</b>\n\nGruppo italiano: <a href='https://t.me/Rainbow6SItaly'>Rainbow Six Siege Italy</a>\nGruppo inglese: non disponibile";
lang_groups["en"] = "<b>Affiliates groups</b>\n\nItalian group: <a href='https://t.me/Rainbow6SItaly'>Rainbow Six Siege Italy</a>\nEnglish group: not available";
lang_rank["it"] = "Classifica per rapporto U/M in Classificata:";
lang_rank["en"] = "Leaderboard for ranked K/D:";
lang_time["it"] = "Ultimo aggiornamento:";
lang_time["en"] = "Last update:";
lang_update_ok["it"] = "Al prossimo /stats il tuo profilo verrà aggiornato!";
lang_update_ok["en"] = "At next /stats your profile will be updated!";
lang_update_err["it"] = "Puoi aggiornare il profilo manualmente solo ogni 3 ore";
lang_update_err["en"] = "You can update your profile only every 3 hours";
lang_update_err_2["it"] = "Il tuo profilo è già pronto per l'aggiornamento";
lang_update_err_2["en"] = "Your profile is already prepared for update";
lang_update_err_3["it"] = "Puoi aggiornare il profilo manualmente solo ogni 3 ore dalle ultime stats salvate";
lang_update_err_3["en"] = "You can update your profile only every 3 hours after last saved stats";

lang_username["it"] = "Nome utente";
lang_username["en"] = "Username";
lang_platform["it"] = "Piattaforma";
lang_platform["en"] = "Platform";
lang_level["it"] = "Livello";
lang_level["en"] = "Level";
lang_xp["it"] = "Xp";
lang_xp["en"] = "Xp";

lang_ranked_plays["it"] = "Partite";
lang_ranked_plays["en"] = "Plays";
lang_ranked_win["it"] = "Vittorie";
lang_ranked_win["en"] = "Wins";
lang_ranked_losses["it"] = "Sconfitte";
lang_ranked_losses["en"] = "Losses";
lang_ranked_wl["it"] = "V/S";
lang_ranked_wl["en"] = "W/L";
lang_ranked_kills["it"] = "Uccisioni";
lang_ranked_kills["en"] = "Kills";
lang_ranked_deaths["it"] = "Morti";
lang_ranked_deaths["en"] = "Deaths";
lang_ranked_kd["it"] = "U/M";
lang_ranked_kd["en"] = "K/D";
lang_ranked_playtime["it"] = "Tempo di gioco";
lang_ranked_playtime["en"] = "Playtime";

lang_casual_plays["it"] = "Partite";
lang_casual_plays["en"] = "Plays";
lang_casual_win["it"] = "Vittorie";
lang_casual_win["en"] = "Wins";
lang_casual_losses["it"] = "Sconfitte";
lang_casual_losses["en"] = "Losses";
lang_casual_wl["it"] = "V/S";
lang_casual_wl["en"] = "W/L";
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

lang_op_kd["it"] = "Miglior rapporto U/M";
lang_op_kd["en"] = "Best K/D ratio";
lang_op_wl["it"] = "Miglior rapporto V/S";
lang_op_wl["en"] = "Best W/L ratio";
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
lang_title_season["it"] = "Stagione";
lang_title_season["en"] = "Season";
lang_title_operators["it"] = "Operatori";
lang_title_operators["en"] = "Operators";

lang_insert_date["it"] = "Ultimo aggiornamento: ";
lang_insert_date["en"] = "Last update: ";

lang_inline_total_kills["it"] = "Uccisioni totali";
lang_inline_total_kills["en"] = "Total kills";
lang_inline_total_deaths["it"] = "Morti totali";
lang_inline_total_deaths["en"] = "Total deaths";
lang_inline_total_wins["it"] = "Vittorie totali";
lang_inline_total_wins["en"] = "Total wins";
lang_inline_total_losses["it"] = "Sconfitte totali";
lang_inline_total_losses["en"] = "Total losses";
lang_inline_best_operator["it"] = "Miglior operatore (V/S)";
lang_inline_best_operator["en"] = "Best operator (W/L)";
lang_inline_userinfo["it"] = "Informazioni giocatore";
lang_inline_userinfo["en"] = "Player info";
lang_user_not_ready["it"] = "Utente non memorizzato, usa /stats";
lang_user_not_ready["en"] = "User not stored, use /stats";
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
lang_inline_season["it"] = "Stagione";
lang_inline_season["en"] = "Season";

lang_operator_title["it"] = "Operatore";
lang_operator_title["en"] = "Operator";
lang_operator_role_atk["it"] = "ATT";
lang_operator_role_atk["en"] = "ATK";
lang_operator_role_def["it"] = "DIF";
lang_operator_role_def["en"] = "DEF";
lang_operator_plays["it"] = "Partite";
lang_operator_plays["en"] = "Plays";
lang_operator_wins["it"] = "Vittore";
lang_operator_wins["en"] = "Wins";
lang_operator_losses["it"] = "Sconfitte";
lang_operator_losses["en"] = "Losses";
lang_operator_wlratio["it"] = "Rapporto V/S";
lang_operator_wlratio["en"] = "W/L Ratio";
lang_operator_kills["it"] = "Uccisioni";
lang_operator_kills["en"] = "Kills";
lang_operator_deaths["it"] = "Morti";
lang_operator_deaths["en"] = "Deaths";
lang_operator_kdratio["it"] = "Rapporto U/M";
lang_operator_kdratio["en"] = "K/D Ratio";
lang_operator_playtime["it"] = "Tempo di gioco";
lang_operator_playtime["en"] = "Playtime";
lang_operator_specials["it"] = "Abilità";
lang_operator_specials["en"] = "Special";
lang_operator_extra["it"] = "\nPuoi visualizzare i dettagli di un operatore e le sue abilità speciali utilizzando '/operator nome_operatore'.";
lang_operator_extra["en"] = "\nYou can show detail of one operator and his abilities using '/operator operator_name'.";

lang_season_rank["it"] = "Rango";
lang_season_rank["en"] = "Rank";
lang_season_mmr["it"] = "MMR";
lang_season_mmr["en"] = "MMR";
lang_season_max_mmr["it"] = "MMR massimo";
lang_season_max_mmr["en"] = "Max MMR";
lang_season_not_ranked["it"] = "Non classificato";
lang_season_not_ranked["en"] = "Not ranked";
lang_season_prevision["it"] = "Previsione";
lang_season_prevision["en"] = "Prevision";

lang_title_mode["it"] = "Modalità";
lang_title_mode["en"] = "Mode";
lang_mode_secure["it"] = "Presidio";
lang_mode_secure["en"] = "Secure area";
lang_mode_hostage["it"] = "Ostaggio";
lang_mode_hostage["en"] = "Hostage";
lang_mode_bomb["it"] = "Bombe";
lang_mode_bomb["en"] = "Bomb";
lang_points["it"] = "punti";
lang_points["en"] = "points";

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
ability_operatorpvp_tachanka_turretkill["it"] = "Uccisioni con torretta";
ability_operatorpvp_tachanka_turretkill["en"] = "Kills with turret";
ability_operatorpvp_deceiver_revealedattackers["it"] = "Attaccanti individuati";
ability_operatorpvp_deceiver_revealedattackers["en"] = "Attackers revealed";
ability_operatorpvp_maverick_wallbreached["it"] = "Muri bucati";
ability_operatorpvp_maverick_wallbreached["en"] = "Walls breached";
ability_operatorpvp_clash_sloweddown["it"] = "Nemici rallentati";
ability_operatorpvp_clash_sloweddown["en"] = "Enemies slowed down";
ability_operatorpvp_Kaid_Electroclaw_Hatches["it"] = "Elettroartigli lanciati su botole";
ability_operatorpvp_Kaid_Electroclaw_Hatches["en"] = "Electroclaw throwed to hatches";
ability_operatorpvp_Nomad_Assist["it"] = "Assist con abilità";
ability_operatorpvp_Nomad_Assist["en"] = "Ability assists";
ability_operatorpvp_mozzie_droneshacked["it"] = "Droni hackerati";
ability_operatorpvp_mozzie_droneshacked["en"] = "Drones hacked";
ability_operatorpvp_gridlock_traxdeployed["it"] = "Trax piazzati";
ability_operatorpvp_gridlock_traxdeployed["en"] = "Trax deployed";

lang_loadout_intro["it"] = "Equipaggiamento consigliato per";
lang_loadout_intro["en"] = "Recommended loadout for";
lang_loadout_primary["it"] = "Arma primaria";
lang_loadout_primary["en"] = "Primary weapon";
lang_loadout_weapon["it"] = "Nome";
lang_loadout_weapon["en"] = "Name";
lang_loadout_grip["it"] = "Impugnatura";
lang_loadout_grip["en"] = "Grip";
lang_loadout_sight["it"] = "Mirino";
lang_loadout_sight["en"] = "Sight";
lang_loadout_attachment["it"] = "Accessorio";
lang_loadout_attachment["en"] = "Attachment";
lang_loadout_laser["it"] = "Laser";
lang_loadout_laser["en"] = "Laser";
lang_loadout_secondary["it"] = "Arma secondaria";
lang_loadout_secondary["en"] = "Secondary weapon";
lang_loadout_utility["it"] = "Gadget";
lang_loadout_utility["en"] = "Utility";

lang_loadout_map_verticalgrip["it"] = "Verticale";
lang_loadout_map_holographic["it"] = "Olografico";
lang_loadout_map_compensator["it"] = "Compensatore";
lang_loadout_map_impact["it"] = "Granata a Impatto";
lang_loadout_map_shield["it"] = "Scudo";
lang_loadout_map_flashider["it"] = "Rompifiamma";
lang_loadout_map_breach["it"] = "Carica da Irruzione";
lang_loadout_map_reddot["it"] = "Punto Rosso";
lang_loadout_map_muzzle["it"] = "Freno di Bocca";
lang_loadout_map_nitro["it"] = "C4";
lang_loadout_map_smoke["it"] = "Granata Fumogena";
lang_loadout_map_barbed["it"] = "Filo Spinato";
lang_loadout_map_frag["it"] = "Granata a Frammentazione";
lang_loadout_map_bulletproof["it"] = "Telecamera Antiproiettile";
lang_loadout_map_stun["it"] = "Granata Stordente";
lang_loadout_map_suppressor["it"] = "Soppressore";
lang_loadout_map_lasertrue["it"] = "Si";

lang_challenges_rewards["it"] = "Ricompense";
lang_challenges_rewards["en"] = "Rewards";
lang_challenges_preview["it"] = "Anteprima";
lang_challenges_preview["en"] = "Reward";
lang_challenges_refresh["it"] = "Aggiornamento il";
lang_challenges_refresh["en"] = "Refresh on";

lang_team_invalid_syntax["it"] = "Sintassi non valida, riprova";
lang_team_invalid_syntax["en"] = "Invalid syntax, retry.";
lang_team_invalid_name["it"] = "Nome team non valido, massimo 64 caratteri solo lettere, numeri e trattini";
lang_team_invalid_name["en"] = "Invalid team name, only 64 chars only words, numbers and dashes";
lang_team_invalid_at["it"] = "Non inserire la @ per i nickname!";
lang_team_invalid_at["en"] = "Don't use @ for nicknames!";
lang_team_invalid_count["it"] = "Massimo 10 membri per un team!";
lang_team_invalid_count["en"] = "Max 10 members for a team!";
lang_team_created["it"] = "Team creato";
lang_team_created["en"] = "Team created";
lang_team_users_added["it"] = "utenti aggiunti";
lang_team_users_added["en"] = "users added";
lang_team_only_leader["it"] = "Solo il leader può aggiungere membri al team!";
lang_team_only_leader["en"] = "Only the leader can add users to team!";
lang_team_not_exists["it"] = "Il team selezionato non esiste";
lang_team_not_exists["en"] = "Selected team does not exists";
lang_team_not_leader_del["it"] = "Solo il leader può eliminare membri dal team!";
lang_team_not_leader_del["en"] = "Only the leader can delete members from team!";
lang_team_remove_yourself["it"] = "Non puoi rimuovere te stesso, per cancellare il team elimina tutti gli altri membri!";
lang_team_remove_yourself["en"] = "You can't remove yourself, to delete team before delete all other members!";
lang_team_deleted["it"] = "e team cancellato";
lang_team_deleted["en"] = "and team deleted";
lang_team_user_removed["it"] = "utenti rimossi";
lang_team_user_removed["en"] = "users removed";
lang_team_call["it"] = "chiama i suoi compagni di team";
lang_team_call["en"] = "call his teammates";
lang_team_intro["it"] = "Benvenuto nella gestione dei <b>Team</b>.\nI team sono legati al gruppo in cui si creano.\n\nPuoi crearlo ed aggiungere utenti con:\n/addteam <i>nome_team</i> <i>nickname,nickname,nickname</i>\nCreandolo ne sarai il leader\n\nPuoi rimuovere gli utenti con:\n/delteam <i>nome_team</i> <i>nickname,nickname,nickname</i>\nQuando un team non ha più utenti viene cancellato\n\nPer taggare tutti i compagni di team:\n/tagteam <i>nome_team</i>\nDopo 15 giorni che non viene taggato, il team viene cancellato\n\n<b>Team creati:</b>";
lang_team_intro["en"] = "Welcome to <b>Team</b> manage.\nTeams are linked with groups where they are created.\n\nYou can create it and add users with:\n/addteam <i>team_name</i> <i>nickname,nickname,nickname</i>\nCreating it you will be the leader\n\nYou can remove users with:\n/delteam <i>team_name</i> <i>nickname,nickname,nickname</i>\nWhen a team have no more users it will be deleted\n\nYou can tag all your teammates with:\n/tagteam <i>team_name</i>\nAfter 15 days that a team has not been tagged, it will be automatically deleted\n\nCreated teams:";
lang_team_no_team["it"] = "Non hai creato nessun team";
lang_team_no_team["en"] = "No teams created";
lang_team_only_groups["it"] = "Questo comando può essere usato solo nei gruppi";
lang_team_only_groups["en"] = "This command can be used only in groups";

lang_search_noplayers["it"] = "Non ci sono giocatori per la piattaforma e la lingua selezionata";
lang_search_noplayers["en"] = "No players for selected platform and language";
lang_search_found["it"] = "Giocatori registrati trovati per la piattaforma";
lang_search_found["en"] = "Players found for platform";
lang_private["it"] = "Messaggio inviato in privato";
lang_private["en"] = "Message sent in private";
lang_extra_info["it"] = "";
lang_extra_info["en"] = "";
lang_invalid_multiple["it"] = "Username non specificati, esempio: /mstats username1,username2,ecc.";
lang_invalid_multiple["en"] = "Username not specified, example: /mstats username1,username2,etc.";
lang_multiple_limit["it"] = "Puoi specificare massimo 5 giocatori";
lang_multiple_limit["en"] = "You can define at least 5 players";

lang_rank_copper4["it"] = "Rame IV";
lang_rank_copper4["en"] = "Copper IV";
lang_rank_copper3["it"] = "Rame III";
lang_rank_copper3["en"] = "Copper III";
lang_rank_copper2["it"] = "Rame II";
lang_rank_copper2["en"] = "Copper II";
lang_rank_copper1["it"] = "Rame I";
lang_rank_copper1["en"] = "Copper I";
lang_rank_bronze4["it"] = "Bronzo IV";
lang_rank_bronze4["en"] = "Bronze IV";
lang_rank_bronze3["it"] = "Bronzo III";
lang_rank_bronze3["en"] = "Bronze III";
lang_rank_bronze2["it"] = "Bronzo II";
lang_rank_bronze2["en"] = "Bronze II";
lang_rank_bronze1["it"] = "Bronzo I";
lang_rank_bronze1["en"] = "Bronze I";
lang_rank_silver4["it"] = "Argento IV";
lang_rank_silver4["en"] = "Silver IV";
lang_rank_silver3["it"] = "Argento III";
lang_rank_silver3["en"] = "Silver III";
lang_rank_silver2["it"] = "Argento II";
lang_rank_silver2["en"] = "Silver II";
lang_rank_silver1["it"] = "Argento I";
lang_rank_silver1["en"] = "Silver I";
lang_rank_gold4["it"] = "Oro IV";
lang_rank_gold4["en"] = "Gold IV";
lang_rank_gold3["it"] = "Oro III";
lang_rank_gold3["en"] = "Gold III";
lang_rank_gold2["it"] = "Oro II";
lang_rank_gold2["en"] = "Gold II";
lang_rank_gold1["it"] = "Oro I";
lang_rank_gold1["en"] = "Gold I";
lang_rank_platinum3["it"] = "Platino III";
lang_rank_platinum3["en"] = "Platinum III";
lang_rank_platinum2["it"] = "Platino II";
lang_rank_platinum2["en"] = "Platinum II";
lang_rank_platinum1["it"] = "Platino I";
lang_rank_platinum1["en"] = "Platinum I";
lang_rank_diamond["it"] = "Diamante";
lang_rank_diamond["en"] = "Diamond";

lang_no_validgraph["it"] = "Utilizza almeno una volta il comando /graph prima di utilizzare /lastgraph";
lang_no_validgraph["en"] = "Use at least once the command /graph before using /lastgraph";
lang_report_activated["it"] = "Report gruppo attivato";
lang_report_activated["en"] = "Group report activated";
lang_report_deactivated["it"] = "Report gruppo disattivato";
lang_report_deactivated["en"] = "Group report deactivated";
lang_report_header_month["it"] = "Report mensile progressi di questo gruppo";
lang_report_header_month["en"] = "Monthly report for this group";
lang_report_header_week["it"] = "Report settimanale progressi di questo gruppo";
lang_report_header_week["en"] = "Progress weekly report for this group";

lang_info_notfound["it"] = "Utente non trovato";
lang_info_notfound["en"] = "User not found";
lang_info_notfound2["it"] = "Il nome utente e la piattaforma per l'utente selezionato non sono state memorizzate";
lang_info_notfound2["en"] = "Default username and platform for selected user are not memorized";
lang_info_result["it"] = "Informazioni R6 per";
lang_info_result["en"] = "R6 infos for";

lang_seasons_intro["it"] = "<b>Classificazioni stagioni:</b>\n\n";
lang_seasons_intro["en"] = "<b>Seasons ranking:</b>\n\n";

lang_rank_data["it"] = "<b>Il tuo rango:</b>";
lang_rank_data["en"] = "<b>Your rank:</b>";

lang_search_mates["it"] = "sta cercando compagni su";
lang_search_mates["en"] = "is looking for mates on";
lang_search_join["it"] = "Partecipa!";
lang_search_join["en"] = "Join!";
lang_search_mates_lbl["it"] = "Partecipanti";
lang_search_mates_lbl["en"] = "Mates";
lang_search_already["it"] = "Stai già partecipando!";
lang_search_already["en"] = "You are already joined!";
lang_search_ok["it"] = "Partecipazione aggiunta!";
lang_search_ok["en"] = "Join confirmed!";
lang_invalid_find["it"] = "Specifica la piattaforma con /find <piattaforma>";
lang_invalid_find["en"] = "Specify the platform with /find <platform>";

lang_on["it"] = "su";
lang_on["en"] = "on";
lang_daily_report_header["it"] = "Report giornaliero progressi";
lang_daily_report_header["en"] = "Progress daily report";
lang_daily_report_activated["it"] = "Report giornaliero attivato";
lang_daily_report_activated["en"] = "Daily report activated";
lang_daily_report_deactivated["it"] = "Report giornaliero disattivato";
lang_daily_report_deactivated["en"] = "Daily report deactivated";

lang_inline_invite_join["it"] = "Entra nel Gruppo!";
lang_inline_invite_join["en"] = "Join the Group!";
lang_inline_invite_title["it"] = "Pubblica invito";
lang_inline_invite_title["en"] = "Publish invite";
lang_inline_invite_desc["it"] = "Pubblica l'invito al gruppo di R6";
lang_inline_invite_desc["en"] = "Publish invite for R6 group";
//lang_inline_invite_text["it"] = "Entra nel gruppo *Rainbow Six Siege Italy* e partecipa al contest per vincere una copia di Rainbow Six Siege per PC!\nIl contest terminerà a breve, affrettati!";
lang_inline_invite_text["it"] = "🇮🇹 Entra nel gruppo *Rainbow Six Siege Italy*! 🇮🇹\n\nConfronta le tue statistiche con altri giocatori provenienti da tutte le piattaforme 🎮, forma team 👥, discuti aggiornamenti 💬, partecipa a contest 💰 e tanto altro!\n\n🔥 Ti aspettiamo 🔥";
lang_inline_invite_text["en"] = "English version not available";

var j = Schedule.scheduleJob('0 * * * *', function () {
	console.log(getNow("it") + " Hourly autotrack called from job");
	autoTrack();
	checkTeam();
});

var reportType = 0;

var j0 = Schedule.scheduleJob('0 10 * * *', function () {
	console.log(getNow("it") + " Daily report generation called from job");
	reportDailyProgress();
});

var j1 = Schedule.scheduleJob('0 10 * * 1', function () {
	console.log(getNow("it") + " Weekly report generation called from job");
	reportType = 1;
	reportProgress(-1);
});

var j2 = Schedule.scheduleJob('0 12 1 * *', function () {
	console.log(getNow("it") + " Monthly report generation called from job");
	reportType = 2;
	reportProgress(-1);
});

bot.onText(/^\/start/i, function (message) {

	if ((message.chat.id < 0) && (message.text.indexOf("@") != -1) && (message.text.indexOf("r6siegestatsbot") == -1))
		return;

	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		var lang = defaultLang;
		if (message.from.language_code != undefined){
			if (validLang.indexOf(message.from.language_code) != -1)
				lang = message.from.language_code;
		}
		var default_text = "";
		if (Object.keys(rows).length == 0){
			connection.query("INSERT INTO user (account_id, lang) VALUES (" + message.from.id + ", '" + lang + "')", function (err, rows) {
				if (err) throw err;
				console.log(getNow("it") + " New user " + message.from.username + " (" + message.from.id + " - " + lang + ")");
			});
		}else{
			lang = rows[0].lang;
			if ((rows[0].default_username != null) && (rows[0].default_platform != null))
				default_text = "\n" + lang_default[lang] + rows[0].default_username + ", " + rows[0].default_platform + "\n";
			else {
				if (rows[0].default_username != null)
					default_text = "\n" + lang_default[lang] + rows[0].default_username + "\n";
				else if (rows[0].default_platform != null)
					default_text = "\n" + lang_default[lang] + rows[0].default_platform + "\n";
			}
		}

		var last_news = "";
		if (lang_last_news[lang] != "")
			last_news = "\n" + lang_last_news[lang] + "\n";

		connection.query("SELECT COUNT(1) As cnt FROM user UNION SELECT COUNT(1) As cnt FROM player_history", function (err, rows) {
			if (err) throw err;

			var stats_text = "\n" + lang_stats[lang];
			stats_text = stats_text.replace("%n", formatNumber(rows[0].cnt));
			stats_text = stats_text.replace("%s", formatNumber(rows[1].cnt));

			fs.stat("r6stats.js", function(err, stats){
				var time = new Date(stats.mtime);
				var time_text = "\n<i>" + lang_time[lang] + " " + toDate(lang, time) + "</i>";

				bot.sendMessage(message.chat.id, lang_main[lang] + "\n" + default_text + last_news + stats_text + time_text, no_preview);
			});
		});
	});
});

bot.on("inline_query", function (query) {
	var data = query.query;

	if (data == "")
		return;

	if (data.length < 6)
		return;

	var lang = defaultLang;
	connection.query("SELECT lang, default_platform FROM user WHERE account_id = " + query.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			rows[0].default_platform = "uplay";
			if (query.from.language_code != undefined){
				if (validLang.indexOf(query.from.language_code) != -1)
					lang = query.from.language_code;
			}
		}else
			lang = rows[0].lang;
		
		if (data == "invite"){
			var account_id = query.from.id;
			var username = query.from.username;
			
			var iKeys = [];
			iKeys.push([{text: lang_inline_invite_join["it"], url: "https://t.me/Rainbow6SItaly"}]);
			
			// force it language cause of groups
			bot.answerInlineQuery(query.id, [{
				id: '0',
				type: 'article',
				title: lang_inline_invite_title["it"],
				description: lang_inline_invite_desc["it"],
				message_text: lang_inline_invite_text["it"],
				parse_mode: "Markdown",
				reply_markup: {
					inline_keyboard: iKeys
				}
			}], {cache_time: 0}).then(function (result) {
				if (result == true){
					var username_insert = (username == undefined ? 'NULL' : '"' + username + '"');
					connection.query('INSERT INTO invite_history (account_id, username) VALUES (' + account_id + ', ' + username_insert + ')', function (err, rows) {
						if (err) throw err;
					});
				}
			});
			return;
		}

		var split = data.split(",");
		if (split[1] == undefined){
			if (rows[0].default_platform != null)
				split[1] = rows[0].default_platform;
			else
				split[1] = "uplay";
		}

		var username = split[0];
		var platform = split[1];

		console.log(getNow("it") + " User data request inline for " + username + " on " + platform);

		connection.query('SELECT username, level, platform, ranked_kd, ranked_playtime, casual_kd, casual_playtime, ranked_kills, ranked_deaths, casual_kills, casual_deaths, ranked_wins, ranked_losses, casual_wins, casual_losses, season_id, season_rank, season_mmr, season_max_mmr, operator_max_wl_name, operator_max_wl FROM player_history WHERE platform = "' + platform + '" AND username = "' + username + '" ORDER BY id DESC LIMIT 1', function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length > 0){
				var response = {};
				response.player = {};
				response.player.stats = {};
				response.player.stats.progression = {};
				response.player.stats.ranked = {};
				response.player.stats.casual = {};

				response.username = rows[0].username;
				response.level = rows[0].level;
				response.platform = rows[0].platform;
				response.ranked_kd = rows[0].ranked_kd;
				response.ranked_playtime = rows[0].ranked_playtime;
				response.casual_kd = rows[0].casual_kd;
				response.casual_playtime = rows[0].casual_playtime;
				response.ranked_kills = rows[0].ranked_kills;
				response.ranked_deaths = rows[0].ranked_deaths;
				response.casual_kills = rows[0].casual_kills;
				response.casual_deaths = rows[0].casual_deaths;
				response.ranked_wins = rows[0].ranked_wins;
				response.ranked_losses = rows[0].ranked_losses;
				response.casual_wins = rows[0].casual_wins;
				response.casual_losses = rows[0].casual_losses;

				response.season_id = rows[0].season_id;
				response.season_rank = rows[0].season_rank;
				response.season_mmr = rows[0].season_mmr;
				response.season_max_mmr = rows[0].season_max_mmr;

				response.operator_max_wl = rows[0].operator_max_wl;
				response.operator_max_wl_name = rows[0].operator_max_wl_name;

				printInline(query.id, response, lang);
				return;
			}

			bot.answerInlineQuery(query.id, [{
				id: '0',
				type: 'article',
				title: lang_inline_userinfo[lang],
				description: lang_user_not_ready[lang],
				message_text: lang_user_not_ready[lang],
				parse_mode: "HTML"
			}]);
		});
	});
});

function printInline(query_id, response, lang){
	bot.answerInlineQuery(query_id, [{
		id: '0',
		type: 'article',
		title: lang_inline_userinfo[lang],
		description: lang_inline_userfound[lang],
		message_text: 	"<b>" + response.username + "</b> (Lv " + response.level + " - " + decodePlatform(response.platform) + ")\n" +
		"<b>" + lang_inline_season[lang] + "</b>: " + numToRank(response.season_rank, lang) + " (" + Math.round(response.season_mmr) + ")\n" + 
		"<b>" + lang_inline_ranked_kd[lang] + "</b>: " + response.ranked_kd + "\n" +
		"<b>" + lang_inline_ranked_playtime[lang] + "</b>: " + toTime(response.ranked_playtime, lang, true) + "\n" +
		"<b>" + lang_inline_casual_kd[lang] + "</b>: " + response.casual_kd + "\n" +
		"<b>" + lang_inline_casual_playtime[lang] + "</b>: " + toTime(response.casual_playtime, lang, true) + "\n" +
		"<b>" + lang_inline_total_kills[lang] + "</b>: " + formatNumber(response.ranked_kills + response.casual_kills) + "\n" +
		"<b>" + lang_inline_total_deaths[lang] + "</b>: " + formatNumber(response.ranked_deaths + response.casual_deaths) + "\n" +
		"<b>" + lang_inline_total_wins[lang] + "</b>: " + formatNumber(response.ranked_wins + response.casual_wins) + "\n" +
		"<b>" + lang_inline_total_losses[lang] + "</b>: " + formatNumber(response.ranked_losses + response.casual_losses) + "\n" +
		"<b>" + lang_inline_best_operator[lang] + "</b>: " + response.operator_max_wl_name + " (" + (response.operator_max_wl).toFixed(3) + ")\n\n" + lang_inline_infos[lang],
		parse_mode: "HTML"
	}]);
}

function saveData(responseStats, responseOps){
	var ops = getOperators(responseOps);

	if (responseStats.profile_id == undefined){
		console.log(getNow("it") + " Data undefined for " + responseStats.username + ", flagged with undefined_track (user not exists)");
		console.log(responseStats);
		connection.query('UPDATE user SET undefined_track = 1 WHERE default_username = "' + responseStats.username + '"', function (err, rows) {
			if (err) throw err;
		});
	} else {
		connection.query('INSERT INTO player_history VALUES (DEFAULT, "' + responseStats.profile_id + '", "' +
						 responseStats.platform + '","' +
						 responseStats.username + '",' +
						 responseStats.level + ',' +
						 responseStats.xp + ',' +
						 responseStats.ranked_plays + ',' + 
						 responseStats.ranked_wins + ',' + 
						 responseStats.ranked_losses + ',' + 
						 responseStats.ranked_wl + ',' + 
						 responseStats.ranked_kills + ',' +
						 responseStats.ranked_deaths + ',' + 
						 responseStats.ranked_kd + ',' + 
						 responseStats.ranked_playtime + ',' +
						 responseStats.casual_plays + ',' +
						 responseStats.casual_wins + ',' + 
						 responseStats.casual_losses + ',' +
						 responseStats.casual_wl + ',' + 
						 responseStats.casual_kills + ',' +
						 responseStats.casual_deaths + ',' +
						 responseStats.casual_kd + ',' +
						 responseStats.casual_playtime + ',' +
						 responseStats.revives + ',' +
						 responseStats.suicides + ',' +
						 responseStats.reinforcements_deployed + ',' +
						 responseStats.barricades_built + ',' +
						 responseStats.bullets_hit + ',' +
						 responseStats.headshots + ',' +
						 responseStats.melee_kills + ',' +
						 responseStats.penetration_kills + ',' +
						 responseStats.assists + ',' +
						 responseStats.season_id + ',' + 
						 responseStats.season_rank + ',' + 
						 responseStats.season_mmr + ',' +
						 responseStats.season_max_mmr + ',' +
						 responseStats.mode_secure + ',' + 
						 responseStats.mode_hostage + ',' +
						 responseStats.mode_bomb + ',"' +
						 ops[13] + '",' +
						 ops[12] + ',"' +
						 ops[15] + '",' +
						 ops[14] + ',"' +
						 ops[1] + '",' +
						 ops[0] + ',"' +
						 ops[3] + '",' +
						 ops[2] + ',"' +
						 ops[5] + '",' +
						 ops[4] + ',"' +
						 ops[7] + '",' +
						 ops[6] + ',"' +
						 ops[9] + '",' +
						 ops[8] + ',"' +
						 ops[11] + '",' +
						 ops[10] + ',' +
						 'NOW())', function (err, rows) {
			if (err) throw err;
			// console.log(getNow("it") + " Saved user data for " + responseStats.username);
		});
	}
}

function numToRank(num, lang, mmr = -1){
	var rankIt = [
		"Rame IV", "Rame III", "Rame II", "Rame I",
		"Bronzo IV", "Bronzo III", "Bronzo II", "Bronzo I",
		"Argento IV", "Argento III", "Argento II", "Argento I",
		"Oro IV", "Oro III", "Oro II", "Oro I",
		"Platino III", "Platino II", "Platino I", "Diamante"
	];
	var rankEn = [
		"Copper IV", "Copper III", "Copper II", "Copper I",
		"Bronze IV", "Bronze III", "Bronze II", "Bronze I",
		"Silver IV", "Silver III", "Silver II", "Silver I",
		"Gold IV", "Gold III", "Gold II", "Gold I",
		"Platinum III", "Platinum II", "Platinum I", "Diamond"
	];

	if ((num == 0) || (num > 21)){
		if (mmr != -1)
			return lang_season_not_ranked[lang] + " (" + lang_season_prevision[lang] + ": " + mapRank(mmr, lang) + ")";
		else
			return lang_season_not_ranked[lang];
	}

	if (lang == "it")
		return rankIt[num-1];
	else
		return rankEn[num-1];
}

function decodePlatform(platform){
	if (platform == "uplay")
		return "PC";
	else if (platform == "psn")
		return "Ps4";
	else if (platform == "xbl")
		return "Xbox One";
}

bot.onText(/^\/lang(?:@\w+)? (.+)|^\/lang/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /lang");
			return;
		}

		var errMsg = lang_invalid_lang[rows[0].lang] + validLang.join(", ");
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}
		match[1] = match[1].toLowerCase();
		if (validLang.indexOf(match[1]) == -1){
			bot.sendMessage(message.chat.id, errMsg);
			return;
		}

		var lang = match[1];
		connection.query("UPDATE user SET lang = '" + lang + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_changed[lang]);
		});
	});
});

bot.onText(/^\/setusername(?:@\w+)? (.+)|^\/setusername(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setusername");
			return;
		}

		var lang = rows[0].lang;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_user_1[lang]);
			return;
		}

		var user = match[1].toLowerCase().trim();
		connection.query("UPDATE user SET default_username = '" + user + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_user_changed[lang]);
		});
	});
});

bot.onText(/^\/setplatform(?:@\w+)? (.+)|^\/setplatform(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setplatform");
			return;
		}

		var lang = rows[0].lang;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang]);
			return;
		}

		var platform = match[1].toLowerCase().trim();
		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}
		connection.query("UPDATE user SET default_platform = '" + platform + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_platform_changed[lang]);
		});
	});
});

bot.onText(/^\/setreport(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, report FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setreport");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].report == 1) {
			connection.query("UPDATE user SET report = 0 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_report_deactivated[lang]);
			});
		} else {
			connection.query("UPDATE user SET report = 1 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_report_activated[lang]);
			});
		}
	});
});

bot.onText(/^\/setdailyreport(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, daily_report FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setdailyreport");
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].daily_report == 1) {
			connection.query("UPDATE user SET daily_report = 0 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_daily_report_deactivated[lang]);
			});
		} else {
			connection.query("UPDATE user SET daily_report = 1 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_daily_report_activated[lang]);
			});
		}
	});
});

bot.onText(/^\/status(?:@\w+)? (.+)|^\/status(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /status");
			return;
		}

		var lang = rows[0].lang;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang]);
			return;
		}

		var platform = match[1].toLowerCase();
		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}

		var lang_complex = "";
		if (lang == "it")
			lang_complex = "it-it";
		else if (lang == "en")
			lang_complex = "en-us";

		var platform_complex = 0;
		if (platform == "uplay")
			platform_complex = 9;
		else if (platform == "psn")
			platform_complex = 47;
		else if (platform == "xbl")
			platform_complex = 43;

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
				bot.sendMessage(message.chat.id, decodePlatform(platform) + " Server Status: " + status);
			});
		});
	});
});

bot.onText(/^\/news(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /news");
			return;
		}

		var lang = rows[0].lang;

		var num = 0;
		if (message.text.indexOf(" ") != -1){
			num = parseInt(message.text.substr(message.text.indexOf(" "), message.text.length));
			if (num < 1)
				num = 1;
			if (num > 5)
				num = 5;
		}

		var lang_complex = "";
		var cookie = "";
		if (lang == "it")
			cookie = "italian";
		else if (lang == "en")
			cookie = "english";

		console.log(getNow("it") + " Request " + (num == 0 ? "all" : num) + " news in " + cookie + " from " + message.from.username);
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
					if (num > 0){
						if (index === (num-1)){
							bot.sendMessage(message.chat.id, text, no_preview);
							return;
						}
					} else if (index === 4)
						bot.sendMessage(message.chat.id, text, no_preview);
				});
			})();
		});
	});
});

bot.onText(/^\/challenges(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /challenges");
			return;
		}

		var lang = rows[0].lang;

		var lang_complex = "";
		if (lang == "it")
			lang_complex = "it-IT";
		else if (lang == "en")
			lang_complex = "en-US";

		var image_url = "https://static8.cdn.ubi.com/u/Uplay";

		console.log(getNow("it") + " Request challenges in " + lang_complex + " from " + message.from.username);
		var endpoint = "https://public-ubiservices.ubi.com/v3/spaces/5172a557-50b5-4665-b7db-e3f2e8c5041d/club/challengepools?locale=" + lang_complex;
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			request.get(endpoint, (error, response, body) => {
				if(!error && response.statusCode == '200') {			
					var resp = JSON.parse(body);

					var rewards;
					var reward;
					var challenges = [];
					var challengeKeys = []
					var challengesCat = [];
					var challengesExpire = [];
					var challengesName = [];
					var challengesDescription = [];
					var challengesPreview = [];
					var challengesValue = [];
					var challengesReward = [];

					for (var j = 0, ch_len = Object.keys(resp).length; j < ch_len; j++) {
						challengeKeys = Object.keys(resp[j]);
						for (var m = 0, ke_len = Object.keys(challengeKeys).length; m < ke_len; m++) {
							if (challengeKeys[m] == "playerChallenges")
								challenges = resp[j]["playerChallenges"]["challenges"];
							else if (challengeKeys[m] == "communityChallenges")
								challenges = resp[j]["communityChallenges"];
							else
								continue;
							for (var i = 0, len = Object.keys(challenges).length; i < len; i++) {
								challengesCat.push(resp[j]["localizations"][0]["value"]);
								challengesExpire.push(resp[j]["expirationDate"]);
								challengesName.push(challenges[i]["localizations"][0]["value"]);
								challengesDescription.push(challenges[i]["localizations"][1]["value"]);
								if (challenges[i]["localizations"].length >= 4)
									challengesPreview.push(challenges[i]["localizations"][3]["value"]);
								else
									challengesPreview.push(null);
								challengesValue.push(challenges[i]["thresholds"][0]["value"]);

								rewards = challenges[i]["thresholds"][0]["rewards"];
								reward = "";
								for (var k = 0, rew_len = Object.keys(rewards).length; k < rew_len; k++){
									if ((rewards[k]["type"].toLowerCase() != "xp") && (rewards[k]["type"].toLowerCase() != "renown"))
										rewards[k]["localizations"][0]["value"] = jsUcfirst(rewards[k]["localizations"][0]["value"].toLowerCase());
									reward += rewards[k]["value"] + " " + rewards[k]["localizations"][0]["value"] + " | ";
								}
								reward = reward.slice(0, -3);
								challengesReward.push(reward);
							}
						}
					}

					var text = "";
					var thisCat = "";
					var preview = "";
					var expire_date;
					for (var i = 0, len = challengesName.length; i < len; i++){
						if (thisCat != challengesCat[i]){
							expire_date = new Date(challengesExpire[i]);
							text += "<b>" + challengesCat[i] + "</b> | " + lang_challenges_refresh[lang] + " " + toDate(lang, expire_date) + "\n\n";
							thisCat = challengesCat[i];
						}

						preview = "";
						if (challengesPreview[i] != null){
							challengesPreview[i] = challengesPreview[i].replace("uat-", "");
							if (challengesPreview[i].startsWith("https"))
								preview = " | <a href='" + challengesPreview[i] + "'>" + lang_challenges_preview[lang] + "</a>";
							else
								preview = " | <a href='" + image_url + challengesPreview[i] + "'>" + lang_challenges_preview[lang] + "</a>";
						}

						if (challengesDescription[i].indexOf("{threshold}") != -1)
							challengesDescription[i] = challengesDescription[i].replace("{threshold}", challengesValue[i]);
						else if (challengesDescription[i].indexOf(challengesValue[i]) == -1)
							challengesDescription[i] += " | " + challengesValue[i];
						challengesDescription[i] = challengesDescription[i].replaceAll("(<br>)", "").trim();

						text += "<b>" + challengesName[i] + "</b>" + preview + "\n" + challengesDescription[i] + "\n" + lang_challenges_rewards[lang] + ": " + challengesReward[i] + "\n\n";
					}

					bot.sendMessage(message.chat.id, text, no_preview);
				}
			});
		});
	});
});

bot.onText(/^\/graph(?:@\w+)? (.+)|^\/graph(?:@\w+)?|^\/lastgraph(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform, last_graph FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /graph");
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
		var param = "";

		if (message.text.indexOf("/lastgraph") == -1){
			var errMsg = lang_graph_no_param[lang] + validParam.join(", ")
			if (match[1] == undefined){
				bot.sendMessage(message.chat.id, errMsg);
				return;
			}
			match[1] = match[1].toLowerCase();
			if (validParam.indexOf(match[1]) == -1){
				bot.sendMessage(message.chat.id, errMsg);
				return;
			}

			param = match[1];
		} else {
			if (rows[0].last_graph == null){
				bot.sendMessage(message.chat.id, lang_no_validgraph[lang]);
				return;
			}
			param = rows[0].last_graph;
		}

		console.log(getNow("it") + " Request graph for " + param + " from " + message.from.username);
		connection.query("SELECT ubisoft_id FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "'", function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_graph_no_data[lang]);
				return;
			}

			var ubisoft_id = rows[0].ubisoft_id;

			connection.query("SELECT insert_date, " + param + " FROM player_history WHERE " + param + " != 0 AND ubisoft_id = '" + ubisoft_id + "'", function (err, rows) {
				if (err) throw err;

				if (Object.keys(rows).length <= 5){
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

					connection.query("UPDATE user SET last_graph = '" + param + "' WHERE account_id = '" + message.from.id + "'", function (err, rows) {
						if (err) throw err;
					});
				});
			});
		});
	});
});

bot.onText(/^\/update(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT default_username, default_platform, lang, force_update, last_update FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /update");
			return;
		}

		var lang = rows[0].lang;

		var date1 = new Date(rows[0].last_update);
		var date2 = new Date();
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var diffMin = Math.ceil(timeDiff / (1000 * 60)); 

		if (diffMin < 180){
			bot.sendMessage(message.chat.id, lang_update_err[lang]);
			return;
		}

		var force_update = rows[0].force_update;

		var default_username = "";
		if (rows[0].default_username != undefined)
			default_username = rows[0].default_username;

		var default_platform = "";
		if (rows[0].default_platform != undefined)
			default_platform = rows[0].default_platform;

		connection.query("SELECT insert_date FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "' ORDER BY id DESC", function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length > 0){
				date1 = new Date(rows[0].insert_date);
				timeDiff = Math.abs(date2.getTime() - date1.getTime());
				diffMin = Math.ceil(timeDiff / (1000 * 60)); 

				if (diffMin < 180){
					bot.sendMessage(message.chat.id, lang_update_err_3[lang]);
					return;
				}
			}

			if (force_update == 1){
				bot.sendMessage(message.chat.id, lang_update_err_2[lang]);
				return;
			}

			connection.query("UPDATE user SET force_update = 1, last_force_update = NOW() WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_update_ok[lang]);
			});
		});
	});
});

bot.onText(/^\/mstats(?:@\w+)? (.+)|^\/mstats(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform, force_update FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /mstats");
			return;
		}

		var lang = rows[0].lang;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_multiple[lang]);
			return;
		}

		var platform = "uplay";

		if (rows[0].default_platform != null)
			platform = rows[0].default_platform;

		var players = match[1].split(",");
		players = players.map(function(item) {
			return item.trim();
		});
		players = players.filter(function(elem, pos) {
			return players.indexOf(elem) == pos;
		})
		if (players.length > 5){
			bot.sendMessage(message.chat.id, lang_multiple_limit[lang], html);
			return;
		}
		
		var text = "";
		var textDone = 0;

		bot.sendChatAction(message.chat.id, "typing").then(function () {
			for (i = 0; i < players.length; i++){
				r6.stats(players[i], platform, -1, 0).then(response => {
					if (response.level != undefined)
						text += getDataLine(response, lang) + "\n";

					textDone++;
					if (textDone >= players.length)
						bot.sendMessage(message.chat.id, text, html);
				}).catch(error => {
					textDone++;
					if (textDone >= players.length)
						bot.sendMessage(message.chat.id, text, html);
				});
			}
		});
	});
});

bot.onText(/^\/checklang/, function (message, match) {
	var lang = defaultLang;
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	bot.sendMessage(message.from.id, message.from.language_code + " - " + lang);
});

bot.onText(/^\/stats(?:@\w+)? (.+),(.+)|^\/stats(?:@\w+)? (.+)|^\/stats(?:@\w+)?|^\/!stats(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform, force_update, undefined_track FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /stats");
			return;
		}

		var lang = rows[0].lang;
		var undefined_track = rows[0].undefined_track;
		var username = "";
		var platform = "uplay";

		var extra_info = "";
		if (lang_extra_info[lang] != "")
			extra_info = lang_extra_info[lang];

		var forceSave = 0;
		if (rows[0].force_update == 1){
			forceSave = 1;
			console.log("ForceSave enabled");
		}

		if (match[3] != undefined){
			username = match[3];
			if (rows[0].default_platform != null)
				platform = rows[0].default_platform;
		}else{
			if (match[1] == undefined){
				if (message.reply_to_message != undefined) {
					var user = connection_sync.query("SELECT default_username FROM user WHERE account_id = " + message.reply_to_message.from.id);
					if (Object.keys(user).length > 0)
						username = user[0].default_username;
					else
						username = message.reply_to_message.from.username;
				} else if (rows[0].default_username != null)
					username = rows[0].default_username;
				else{
					bot.sendMessage(message.chat.id, lang_invalid_user[lang]);
					return;
				}
			}else
				username = match[1];

			if (match[2] == undefined){
				if (rows[0].default_platform != null)
					platform = rows[0].default_platform;
			}else
				platform = match[2].toLowerCase();
		}

		username = username.trim();
		platform = platform.trim();

		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}

		updateChatId(message.from.id, message.chat.id);

		console.log(getNow("it") + " Request user data for " + username + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			connection.query('UPDATE user SET last_stats = NOW() WHERE account_id = ' + message.from.id, function (err, rows) {
				if (err) throw err;
			});
			connection.query('SELECT * FROM player_history WHERE platform = "' + platform + '" AND username = "' + username + '" ORDER BY id DESC', function (err, rows) {
				if (err) throw err;

				if ((Object.keys(rows).length > 0) && (forceSave == 0)){
					var d = new Date(rows[0].insert_date);
					var insert_date;
					if (lang == "it")
						insert_date = addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + " del " + addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear();
					else
						insert_date = addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + " of " + addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear();
					insert_date = "\n\n<i>" + lang_insert_date[lang] + insert_date + "</i>";
					var response = {};
					response.player = {};
					response.player.stats = {};
					response.player.stats.progression = {};
					response.player.stats.ranked = {};
					response.player.stats.casual = {};
					response.player.stats.overall = {};
					response.player.season = {};

					response.username = rows[0].username;
					response.platform = rows[0].platform;
					response.level = rows[0].level;
					response.xp = rows[0].xp;
					response.ranked_plays = rows[0].ranked_plays;
					response.ranked_wins = rows[0].ranked_wins;
					response.ranked_losses = rows[0].ranked_losses;
					response.ranked_wl = rows[0].ranked_wl;
					response.ranked_kills = rows[0].ranked_kills;
					response.ranked_deaths = rows[0].ranked_deaths;
					response.ranked_kd = rows[0].ranked_kd;
					response.ranked_playtime = rows[0].ranked_playtime;
					response.casual_plays = rows[0].casual_plays;
					response.casual_wins = rows[0].casual_wins;
					response.casual_losses = rows[0].casual_losses;
					response.casual_wl = rows[0].casual_wl;
					response.casual_kills = rows[0].casual_kills;
					response.casual_deaths = rows[0].casual_deaths;
					response.casual_kd = rows[0].casual_kd;
					response.casual_playtime = rows[0].casual_playtime;
					response.revives = rows[0].revives;
					response.suicides = rows[0].suicides;
					response.reinforcements_deployed = rows[0].reinforcements_deployed;
					response.barricades_built = rows[0].barricades_built;
					response.bullets_hit = rows[0].bullets_hit;
					response.headshots = rows[0].headshots;
					response.melee_kills = rows[0].melee_kills;
					response.penetration_kills = rows[0].penetration_kills;
					response.assists = rows[0].assists;

					response.season_id = rows[0].season_id;
					response.season_rank = rows[0].season_rank;
					response.season_mmr = rows[0].season_mmr;
					response.season_max_mmr = rows[0].season_max_mmr;

					response.mode_secure = rows[0].mode_secure;
					response.mode_hostage = rows[0].mode_hostage;
					response.mode_bomb = rows[0].mode_bomb;

					var most_played = rows[0].operator_max_plays;
					var most_played_name = rows[0].operator_max_plays_name;
					var most_wins = rows[0].operator_max_wins;
					var most_wins_name = rows[0].operator_max_wins_name;
					var most_losses = rows[0].operator_max_losses;
					var most_losses_name = rows[0].operator_max_losses_name;
					var most_kills = rows[0].operator_max_kills;
					var most_kills_name = rows[0].operator_max_kills_name;
					var most_deaths = rows[0].operator_max_deaths;
					var most_deaths_name = rows[0].operator_max_deaths_name;
					var most_playtime = rows[0].operator_max_playtime;
					var most_playtime_name = rows[0].operator_max_playtime_name;
					var most_kd = rows[0].operator_max_kd;
					var most_kd_name = rows[0].operator_max_kd_name;
					var most_wl = rows[0].operator_max_wl;
					var most_wl_name = rows[0].operator_max_wl_name;

					var text = getData(response, lang);
					text += getOperatorsText(most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name, lang);

					bot.sendMessage(message.chat.id, text + insert_date + extra_info, html);
					console.log(getNow("it") + " Cached user data served for " + username + " on " + platform);
					return;
				}

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username, platform, -1, 0).then(response => {
						var responseStats = response;

						if (responseStats.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
							console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
							return;
						}

						var text = getData(responseStats, lang);
						r6.stats(username, platform, -1, 1).then(response => {
							var responseOps = response;

							var ops = getOperators(responseOps);							
							text += getOperatorsText(ops[0], ops[1], ops[2], ops[3], ops[4], ops[5], ops[6], ops[7], ops[8], ops[9], ops[10], ops[11], ops[12], ops[13], ops[14], ops[15], lang);

							if (undefined_track == 1){
								connection.query("UPDATE user SET undefined_track = 0 WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
									console.log(getNow("it") + " User unlocked for " + username + " on " + platform);
								});
							}

							bot.sendMessage(message.chat.id, text + "\n" + extra_info, html);

							if (forceSave == 1){
								connection.query("UPDATE user SET force_update = 0, last_update = NOW() WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
								});
								saveData(responseStats, responseOps);
							}

							console.log(getNow("it") + " User data served for " + username + " on " + platform);
						}).catch(error => {
							console.log(error);
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
							console.log(getNow("it") + " User data operators not found for " + username + " on " + platform);
						});
					}).catch(error => {
						console.log(error);
						bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
						console.log(getNow("it") + " User data not found for " + username + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/rank(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /rank");
			return;
		}

		var lang = rows[0].lang;
		
		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang]);
			return;
		}

		var username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang]);
			return;
		}

		var platform = rows[0].default_platform;

		console.log(getNow("it") + " Request rank data for " + username + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			bot.sendChatAction(message.chat.id, "typing").then(function () {
				r6.stats(username, platform, -1, 0).then(response => {
					var responseStats = response;

					if (responseStats.platform == undefined){
						bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
						console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
						return;
					}

					var text = getRankData(responseStats, lang);
					bot.sendMessage(message.chat.id, text, html);
				}).catch(error => {
					console.log(error);
					bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
					console.log(getNow("it") + " User data not found for " + username + " on " + platform);
				});
			});
		});
	});
});

bot.onText(/^\/r6info(?:@\w+)? (.+)|^\/r6info(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /r6info");
			return;
		}

		var lang = rows[0].lang;
		
		var mark = {
			parse_mode: "Markdown"
		};
		
		var html = {
			parse_mode: "HTML"
		};
		
		var account_id;
		var username;
		if (message.reply_to_message != undefined){
			account_id = message.reply_to_message.from.id;
			username = message.reply_to_message.from.username;
		}else{
			account_id = message.from.id;
			username = message.from.username;
		}

		console.log(getNow("it") + " Request infos for " + username);
		connection.query("SELECT default_username, default_platform FROM user WHERE account_id = " + account_id, function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_info_notfound[lang]);
				return;
			}
			
			if ((rows[0].default_username == null) && (rows[0].default_platform == null)){
				bot.sendMessage(message.chat.id, lang_info_notfound2[lang]);
				return;
			}
			
			var default_username = (rows[0].default_username == null ? "-" : rows[0].default_username);
			var default_platform = (rows[0].default_platform == null ? "-" : rows[0].default_platform);
			
			connection.query("SELECT insert_date FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "' ORDER BY id DESC LIMIT 1", function (err, rows) {
				if (err) throw err;
			
				var insert_date;
				if (Object.keys(rows).length > 0){
					var d = new Date(rows[0].insert_date);
					if (lang == "it")
						insert_date = addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + " del " + addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear();
					else
						insert_date = addZero(d.getHours()) + ':' + addZero(d.getMinutes()) + " of " + addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear();
					insert_date = "\n\n<i>" + lang_insert_date[lang] + insert_date + "</i>";
				}

				bot.sendMessage(message.chat.id, "<b>" + lang_info_result[lang] + " " + username + "</b>\n\n" + lang_username[lang] + ": " + default_username + "\n" + lang_platform[lang] + ": " + decodePlatform(default_platform) + insert_date, html);
			});
		});
	});
});

function getData(response, lang){
	var text = "<b>" + lang_username[lang] + "</b>: " + response.username + "\n" +
		"<b>" + lang_platform[lang] + "</b>: " + decodePlatform(response.platform) + "\n" +
		"<b>" + lang_level[lang] + "</b>: " + response.level + "\n" +
		"<b>" + lang_xp[lang] + "</b>: " + formatNumber(response.xp) + "\n" +
		"\n<b>" + lang_title_ranked[lang] + "</b>:\n" +
		"<b>" + lang_ranked_plays[lang] + "</b>: " + formatNumber(response.ranked_plays) + "\n" +
		"<b>" + lang_ranked_win[lang] + "</b>: " + formatNumber(response.ranked_wins) + "\n" +
		"<b>" + lang_ranked_losses[lang] + "</b>: " + formatNumber(response.ranked_losses) + "\n" +
		"<b>" + lang_ranked_wl[lang] + "</b>: " + formatNumber(response.ranked_wl) + "\n" +
		"<b>" + lang_ranked_kills[lang] + "</b>: " + formatNumber(response.ranked_kills) + "\n" +
		"<b>" + lang_ranked_deaths[lang] + "</b>: " + formatNumber(response.ranked_deaths) + "\n" +
		"<b>" + lang_ranked_kd[lang] + "</b>: " + formatNumber(response.ranked_kd) + "\n" +
		"<b>" + lang_ranked_playtime[lang] + "</b>: " + toTime(response.ranked_playtime, lang) + " (" + toTime(response.ranked_playtime, lang, true) + ")\n" +
		"\n<b>" + lang_title_casual[lang] + "</b>:\n" +
		"<b>" + lang_casual_plays[lang] + "</b>: " + formatNumber(response.casual_plays) + "\n" +
		"<b>" + lang_casual_win[lang] + "</b>: " + formatNumber(response.casual_wins) + "\n" +
		"<b>" + lang_casual_losses[lang] + "</b>: " + formatNumber(response.casual_losses) + "\n" +
		"<b>" + lang_casual_wl[lang] + "</b>: " + formatNumber(response.casual_wl) + "\n" +
		"<b>" + lang_casual_kills[lang] + "</b>: " + formatNumber(response.casual_kills) + "\n" +
		"<b>" + lang_casual_deaths[lang] + "</b>: " + formatNumber(response.casual_deaths) + "\n" +
		"<b>" + lang_casual_kd[lang] + "</b>: " + formatNumber(response.casual_kd) + "\n" +
		"<b>" + lang_casual_playtime[lang] + "</b>: " + toTime(response.casual_playtime, lang) + " (" + toTime(response.casual_playtime, lang, true) + ")\n" +
		"\n<b>" + lang_title_general[lang] + "</b>:\n" +
		"<b>" + lang_revives[lang] + "</b>: " + formatNumber(response.revives) + "\n" +
		"<b>" + lang_suicides[lang] + "</b>: " + formatNumber(response.suicides) + "\n" +
		"<b>" + lang_reinforcements[lang] + "</b>: " + formatNumber(response.reinforcements_deployed) + "\n" +
		"<b>" + lang_barricades[lang] + "</b>: " + formatNumber(response.barricades_built) + "\n" +
		"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(response.bullets_hit) + "\n" +
		"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(response.headshots) + "\n" +
		"<b>" + lang_melee_kills[lang] + "</b>: " + formatNumber(response.melee_kills) + "\n" +
		"<b>" + lang_penetration_kills[lang] + "</b>: " + formatNumber(response.penetration_kills) + "\n" +
		"<b>" + lang_assists[lang] + "</b>: " + formatNumber(response.assists) + "\n" +
		"\n<b>" + lang_title_season[lang] + "</b>:\n" +
		"<b>" + lang_season_rank[lang] + "</b>: " + numToRank(response.season_rank, lang, Math.round(response.season_mmr)) + "\n" +
		"<b>" + lang_season_mmr[lang] + "</b>: " + Math.round(response.season_mmr) + "\n" +
		"<b>" + lang_season_max_mmr[lang] + "</b>: " + Math.round(response.season_max_mmr) + "\n" +
		"\n<b>" + lang_title_mode[lang] + "</b>:\n" +
		"<b>" + lang_mode_secure[lang] + "</b>: " + formatNumber(response.mode_secure) + " " + lang_points[lang] + "\n" +
		"<b>" + lang_mode_hostage[lang] + "</b>: " + formatNumber(response.mode_hostage) + " " + lang_points[lang] + "\n" +
		"<b>" + lang_mode_bomb[lang] + "</b>: " + formatNumber(response.mode_bomb) + " " + lang_points[lang] + "\n"; // a capo finale

	return text;
}

function getRankData(response, lang){
	var text = lang_rank_data[lang] + " " + numToRank(response.season_rank, lang) + " (" + lang_season_mmr[lang] + " " + Math.round(response.season_mmr) + ")";

	return text;
}

function getDataLine(response, lang){
	var text = "<b>" + response.username + "</b>: Lv " + response.level + " - " + lang_ranked_kd[lang] + " " + response.ranked_kd + " - " + numToRank(response.season_rank, lang);

	return text;
}

function getOperators(response){
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
	var most_kd = 0;
	var most_kd_name = "";
	var most_wl = 0;
	var most_wl_name = "";

	var operators = Object.keys(response);

	// remove profile_id, name, platform
	operators.splice(-1,1);
	operators.splice(-1,1);
	operators.splice(-1,1);

	for (i = 0; i < operators.length; i++){
		var plays = response[operators[i]].operatorpvp_roundlost+response[operators[i]].operatorpvp_roundwon;
		if (plays > most_played){
			most_played = plays;
			most_played_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_roundwon > most_wins){
			most_wins = response[operators[i]].operatorpvp_roundwon;
			most_wins_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_roundlost > most_losses){
			most_losses = response[operators[i]].operatorpvp_roundlost;
			most_losses_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_kills > most_kills){
			most_kills = response[operators[i]].operatorpvp_kills;
			most_kills_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_death > most_deaths){
			most_deaths = response[operators[i]].operatorpvp_death;
			most_deaths_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_timeplayed > most_playtime){
			most_playtime = response[operators[i]].operatorpvp_timeplayed;
			most_playtime_name = operators[i];
		}
		var kd = response[operators[i]].operatorpvp_kills/response[operators[i]].operatorpvp_death;
		if (!isFinite(kd))
			kd = response[operators[i]].operatorpvp_kills;
		if (kd > most_kd){
			most_kd = kd;
			most_kd_name = operators[i];
		}
		var wl = response[operators[i]].operatorpvp_roundwon/response[operators[i]].operatorpvp_roundlost;
		if (!isFinite(wl))
			wl = response[operators[i]].operatorpvp_roundwon;
		if (wl > most_wl){
			most_wl = wl;
			most_wl_name = operators[i];
		}
	}

	most_played_name = jsUcfirst(most_played_name);
	most_wins_name = jsUcfirst(most_wins_name);
	most_losses_name = jsUcfirst(most_losses_name);
	most_kills_name = jsUcfirst(most_kills_name);
	most_deaths_name = jsUcfirst(most_deaths_name);
	most_playtime_name = jsUcfirst(most_playtime_name);
	most_kd_name = jsUcfirst(most_kd_name);
	most_wl_name = jsUcfirst(most_wl_name);

	return [most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name];
}

function getOperatorsText(most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name, lang){
	return "\n<b>" + lang_title_operators[lang] + "</b>:\n" +
		"<b>" + lang_op_kd[lang] + "</b>: " + most_kd_name + " (" + most_kd.toFixed(3) + ")\n" +
		"<b>" + lang_op_wl[lang] + "</b>: " + most_wl_name + " (" + most_wl.toFixed(3) + ")\n" +
		"<b>" + lang_op_plays[lang] + "</b>: " + most_played_name + " (" + formatNumber(most_played) + ")\n" +
		"<b>" + lang_op_wins[lang] + "</b>: " + most_wins_name + " (" + formatNumber(most_wins) + ")\n" +
		"<b>" + lang_op_losses[lang] + "</b>: " + most_losses_name + " (" + formatNumber(most_losses) + ")\n" +
		"<b>" + lang_op_kills[lang] + "</b>: " + most_kills_name + " (" + formatNumber(most_kills) + ")\n" +
		"<b>" + lang_op_deaths[lang] + "</b>: " + most_deaths_name + " (" + formatNumber(most_deaths) + ")\n" +
		"<b>" + lang_op_playtime[lang] + "</b>: " + most_playtime_name + " (" + toTime(most_playtime, lang, true) + ")";
}

bot.onText(/^\/compare(?:@\w+)? (.+),(.+)|^\/compare(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /compare");
			return;
		}

		var lang = rows[0].lang;
		if ((match[1] == undefined) || (match[2] == undefined)){
			bot.sendMessage(message.chat.id, lang_invalid_user_2[lang]);
			return;
		}

		var platform = "uplay";
		if (rows[0].default_platform != null)
			platform = rows[0].default_platform;

		var username1 = match[1].trim();
		var username2 = match[2].trim();

		console.log(getNow("it") + " Request user compare for " + username1 + " and " + username2 + " on " + platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username1, platform, -1, 0).then(response1 => {

				if (response1.platform == undefined){
					bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username1 + ", " + platform + ")", html);
					console.log(getNow("it") + " User data 1 (compare) undefined for " + username1 + " on " + platform);
					return;
				}

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username2, platform, -1, 0).then(response2 => {

						if (response2.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username2 + ", " + platform + ")", html);
							console.log(getNow("it") + " User data 2 (compare) undefined for " + username2 + " on " + platform);
							return;
						}

						var text = "<i>" + response1.username + " vs " + response2.username + "</i>\n\n" +
							"<b>" + lang_platform[lang] + "</b>: " + decodePlatform(response1.platform) + " - " + decodePlatform(response2.platform) + "\n" +
							"<b>" + lang_level[lang] + "</b>: " + compare(response1.level, response2.level) + "\n" +
							"<b>" + lang_xp[lang] + "</b>: " + compare(response1.xp, response2.xp, "number") + "\n" +
							"\n<b>" + lang_title_ranked[lang] + "</b>:\n" +
							"<b>" + lang_ranked_plays[lang] + "</b>: " + compare(response1.ranked_plays, response2.ranked_plays, "number") + "\n" +
							"<b>" + lang_ranked_win[lang] + "</b>: " + compare(response1.ranked_wins, response2.ranked_wins, "number") + "\n" +
							"<b>" + lang_ranked_losses[lang] + "</b>: " + compare(response1.ranked_losses, response2.ranked_losses, "number", lang, 1) + "\n" +
							"<b>" + lang_ranked_wl[lang] + "</b>: " + compare(response1.ranked_wl, response2.ranked_wl, "number", lang) + "\n" +
							"<b>" + lang_ranked_kills[lang] + "</b>: " + compare(response1.ranked_kills, response2.ranked_kills, "number") + "\n" +
							"<b>" + lang_ranked_deaths[lang] + "</b>: " + compare(response1.ranked_deaths, response2.ranked_deaths, "number", lang, 1) + "\n" +
							"<b>" + lang_ranked_kd[lang] + "</b>: " + compare(response1.ranked_kd, response2.ranked_kd, "number") + "\n" +
							"<b>" + lang_ranked_playtime[lang] + "</b>: " + compare(response1.ranked_playtime, response2.ranked_playtime, "time", lang) + "\n" +
							"\n<b>" + lang_title_casual[lang] + "</b>:\n" +
							"<b>" + lang_casual_plays[lang] + "</b>: " + compare(response1.casual_plays, response2.casual_plays, "number") + "\n" +
							"<b>" + lang_casual_win[lang] + "</b>: " + compare(response1.casual_wins, response2.casual_wins, "number") + "\n" +
							"<b>" + lang_casual_losses[lang] + "</b>: " + compare(response1.casual_losses, response2.casual_losses, "number", lang, 1) + "\n" +
							"<b>" + lang_casual_wl[lang] + "</b>: " + compare(response1.casual_wl, response2.casual_wl, "number", lang) + "\n" +
							"<b>" + lang_casual_kills[lang] + "</b>: " + compare(response1.casual_kills, response2.casual_kills, "number") + "\n" +
							"<b>" + lang_casual_deaths[lang] + "</b>: " + compare(response1.casual_deaths, response2.casual_deaths, "number", lang, 1) + "\n" +
							"<b>" + lang_casual_kd[lang] + "</b>: " + compare(response1.casual_kd, response2.casual_kd, "number") + "\n" +
							"<b>" + lang_casual_playtime[lang] + "</b>: " + compare(response1.casual_playtime, response2.casual_playtime, "time", lang) + "\n" +
							"\n<b>" + lang_title_general[lang] + "</b>:\n" +
							"<b>" + lang_revives[lang] + "</b>: " + compare(response1.revives, response2.revives, "number") + "\n" +
							"<b>" + lang_suicides[lang] + "</b>: " + compare(response1.suicides, response2.suicides, "number", lang, 1) + "\n" +
							"<b>" + lang_reinforcements[lang] + "</b>: " + compare(response1.reinforcements_deployed, response2.reinforcements_deployed, "number") + "\n" +
							"<b>" + lang_barricades[lang] + "</b>: " + compare(response1.barricades_built, response2.barricades_built, "number") + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + compare(response1.bullets_hit, response2.bullets_hit, "number") + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + compare(response1.headshots, response2.headshots, "number") + "\n" +
							"<b>" + lang_melee_kills[lang] + "</b>: " + compare(response1.melee_kills, response2.melee_kills, "number") + "\n" +
							"<b>" + lang_penetration_kills[lang] + "</b>: " + compare(response1.penetration_kills, response2.penetration_kills, "number") + "\n" +
							"<b>" + lang_assists[lang] + "</b>: " + compare(response1.assists, response2.assists, "number") + "\n" +
							"\n<b>" + lang_title_season[lang] + "</b>:\n" +
							"<b>" + lang_season_mmr[lang] + "</b>: " + compare(Math.round(response1.season_mmr), Math.round(response2.season_mmr)) + "\n" +
							"<b>" + lang_season_max_mmr[lang] + "</b>: " + compare(Math.round(response1.season_max_mmr),Math.round(response2.season_max_mmr))  + "\n" +  
							"\n<b>" + lang_title_mode[lang] + "</b>:\n" +
							"<b>" + lang_mode_secure[lang] + "</b>: " + compare(response1.mode_secure, response2.mode_secure, "number") + "\n" +
							"<b>" + lang_mode_hostage[lang] + "</b>: " + compare(response1.mode_hostage, response2.mode_hostage, "number") + "\n" +
							"<b>" + lang_mode_bomb[lang] + "</b>: " + compare(response1.mode_bomb, response2.mode_bomb, "number");

						bot.sendMessage(message.chat.id, text, html);
					}).catch(error => {
						bot.sendMessage(message.chat.id, error, html);
						console.log(getNow("it") + " User data not found for " + username2 + " on " + platform);
					});
				});
			}).catch(error => {
				bot.sendMessage(message.chat.id, error, html);
				console.log(getNow("it") + " User data not found for " + username1 + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/seasons(?:@\w+)?/i, function (message) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /seasons");
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
		
		console.log(getNow("it") + " Request seasons data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, -1, 0).then(response => {
				var responseStats = response;
				
				if (responseStats.platform == undefined){
					bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + platform + ")", html);
					console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
					return;
				}
				
				var lastSeason = responseStats.season_id;
				var seasonArray = [];
				var textDone = 0;
				for(i = 1; i < lastSeason+1; i++){
					r6.stats(default_username, default_platform, i, 0).then(response => {
						if ((response.season_id != undefined) && (response.season_rank != 0)) {
							seasonArray[response.season_id] = "<b>" + seasonList[response.season_id-1] + ":</b> " + numToRank(response.season_rank, lang, Math.round(response.season_mmr)) + "\n";
						}
						textDone++;
						if (textDone >= lastSeason)
							bot.sendMessage(message.chat.id, lang_seasons_intro[lang] + sortSeasons(seasonArray), html);
					}).catch(error => {
						textDone++;
						if (textDone >= lastSeason)
							bot.sendMessage(message.chat.id, lang_seasons_intro[lang] + sortSeasons(seasonArray), html);
					});
				}
			});
		});
	});
});

function sortSeasons(seasonArray){
	var text = "";
	seasonArray = seasonArray.reverse();
	for(i = 0; i < seasonArray.length; i++){
		if (seasonArray[i] != undefined)
			text += seasonArray[i];
	}
	return text;
}

bot.onText(/^\/operators(?:@\w+)?/i, function (message) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /operators");
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
			r6.stats(default_username, default_platform, -1, 1).then(response => {
				var text = "<b>" + lang_operator_title[lang] + " - " + lang_operator_plays[lang] + " - " + lang_operator_wins[lang] + " - " + lang_operator_losses[lang] + " - " + lang_operator_kills[lang] + " - " + lang_operator_deaths[lang] + " - " + lang_operator_playtime[lang] + " - " + lang_operator_specials[lang] + "</b>\n";

				var operators = response;

				delete operators.nickname;
				delete operators.platform;
				delete operators.profile_id;

				var ordered = {};
				Object.keys(response).sort().forEach(function(key) {
					ordered[key] = response[key];
				});
				operators = ordered;

				var operators_name = Object.keys(operators);

				for (i = 0; i < Object.keys(operators).length; i++){
					text += "<b>" + jsUcfirst(operators_name[i]) + "</b> - " + formatNumber(response[operators_name[i]].operatorpvp_roundwon+response[operators_name[i]].operatorpvp_roundlost) + " - " + formatNumber(response[operators_name[i]].operatorpvp_roundwon) + " - " + formatNumber(response[operators_name[i]].operatorpvp_roundlost) + " - " + formatNumber(response[operators_name[i]].operatorpvp_kills) + " - " + formatNumber(response[operators_name[i]].operatorpvp_death) + " - " + toTime(response[operators_name[i]].operatorpvp_timeplayed, lang, true);

					var specials = Object.keys(operators[operators_name[i]]);

					// remove stats
					delete operators[operators_name[i]].operatorpvp_roundlost;
					delete operators[operators_name[i]].operatorpvp_death;
					delete operators[operators_name[i]].operatorpvp_roundwon;
					delete operators[operators_name[i]].operatorpvp_kills;
					delete operators[operators_name[i]].operatorpvp_timeplayed;
					specials.splice(0,1);
					specials.splice(0,1);
					specials.splice(0,1);
					specials.splice(0,1);
					specials.splice(0,1);

					var sum = 0;
					if (specials.length > 0){
						for (j = 0; j < specials.length; j++) {
							if (specials[j] != "")
								sum += parseInt(eval("operators[operators_name[" + i + "]]." + specials[j]));
						}
					}
					text += " - " + formatNumber(sum);
					text += "\n";
				}
				bot.sendMessage(message.chat.id, text + lang_operator_extra[lang], html);
			}).catch(error => {
				console.log(error);
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + default_platform + ")", html);
				console.log(getNow("it") + " Operators data not found for " + default_username + " on " + default_platform);
			});
		});
	});
});

bot.onText(/^\/operator(?:@\w+)? (.+)|^\/operator(?:@\w+)?$/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /operator");
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
		if (operatorList.indexOf(match[1]) == -1){
			match[1] = jsUcfirst(match[1]);
			var sim = stringSimilarity.findBestMatch(match[1], operatorList);
			if (sim.bestMatch.rating >= 0.6)
				match[1] = sim.bestMatch.target;
			else{
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang]);
				return;
			}
		}

		operator_name = match[1];

		console.log(getNow("it") + " Request operator data for " + operator_name + " from " + message.from.username);
		bot.sendChatAction(message.chat.id, "typing").then(function () {

			r6.stats(default_username, default_platform, -1, 2).then(response => {
				var operators_info = response;

				r6.stats(default_username, default_platform, -1, 1).then(response => {

					var operators = Object.keys(response);

					// remove profile_id, name, platform
					operators.splice(-1,1);
					operators.splice(-1,1);
					operators.splice(-1,1);

					var name = "";
					var role = "";
					var org = "";
					var badge_url = "";
					var played = 0;
					var wins = 0;
					var losses = 0;
					var wlratio = 0;
					var kills = 0;
					var deaths = 0;
					var kdratio = 0;
					var playtime = 0;
					var special_names = [];
					var special_values = [];	
					var found = 0;
					var validSpecials = 0;
					for (i = 0; i < operators.length; i++){
						if (operators[i] == operator_name.toLowerCase()){
							name = jsUcfirst(operators[i]);
							role = operators_info[operators[i]].category;
							if (role == "atk")
								role = lang_operator_role_atk[lang];
							else if (role == "def")
								role = lang_operator_role_def[lang];
							org = operators_info[operators[i]].organisation;
							badge_url = operators_info[operators[i]].images.badge;
							played = (response[operators[i]].operatorpvp_roundwon+response[operators[i]].operatorpvp_roundlost);
							wins = response[operators[i]].operatorpvp_roundwon;
							losses = response[operators[i]].operatorpvp_roundlost;
							wlratio = (wins/losses).toFixed(3);
							if (!isFinite(wlratio)) wlratio = wins;
							kills = response[operators[i]].operatorpvp_kills;
							deaths = response[operators[i]].operatorpvp_death;
							kdratio = (kills/deaths).toFixed(3);
							if (!isFinite(kdratio)) kdratio = kills;
							playtime = response[operators[i]].operatorpvp_timeplayed;

							var specials = Object.keys(response[operators[i]]);
							// remove stats
							specials.splice(0,1);
							specials.splice(0,1);
							specials.splice(0,1);
							specials.splice(0,1);
							specials.splice(0,1);

							if (specials.length > 0){
								for (j = 0; j < specials.length; j++){
									if (specials[j].indexOf("pve") == -1){
										special_names.push(eval("ability_" + specials[j] + "['" + lang + "']"));
										special_values.push(parseInt(eval("response[operators[" + i + "]]." + specials[j])));
										validSpecials++;
									}
								}
							}
							found = 1;
						}
					}

					if (found == 0){
						bot.sendMessage(message.chat.id, lang_operator_not_found[lang]);
						return;
					}

					var text = 	"<b>" + lang_operator_title[lang] + "</b>: " + name + " (" + role + ", " + org + ")\n" +
						"<b>" + lang_operator_plays[lang] + "</b>: " + formatNumber(played) + "\n" +
						"<b>" + lang_operator_wins[lang] + "</b>: " + formatNumber(wins) + "\n" +
						"<b>" + lang_operator_losses[lang] + "</b>: " + formatNumber(losses) + "\n" +
						"<b>" + lang_operator_wlratio[lang] + "</b>: " + formatNumber(wlratio) + "\n" +
						"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(kills) + "\n" +
						"<b>" + lang_operator_deaths[lang] + "</b>: " + formatNumber(deaths) + "\n" +
						"<b>" + lang_operator_kdratio[lang] + "</b>: " + formatNumber(kdratio) + "\n" +
						"<b>" + lang_operator_playtime[lang] + "</b>: " + toTime(playtime, lang, true) + "\n";
					for (j = 0; j < validSpecials; j++)
						text += "<b>" + special_names[j] + "</b>: " + formatNumber(special_values[j]) + "\n";

					bot.sendMessage(message.chat.id, text, html);

					/* invio immagine badge
					if (message.chat.id > 0)
						bot.sendPhoto(message.chat.id, badge_url);
					*/
				}).catch(error => {
					console.log(error);
					bot.sendMessage(message.chat.id, lang_operator_not_found[lang] + " (" + default_platform + ")", html);
					console.log(getNow("it") + " Operators data not found for " + operator_name + " from " + message.from.username);
				});
			}).catch(error => {
				console.log(error);
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang] + " (" + default_platform + ")", html);
				console.log(getNow("it") + " Operators info data not found for " + operator_name + " from " + message.from.username);
			});
		});
	});
});

bot.onText(/^\/loadout(?:@\w+)? (.+)|^\/loadout(?:@\w+)?$/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /loadout");
			return;
		}

		var lang = rows[0].lang;
		var operator_name;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_operator_no_name[lang]);
			return;
		}
		if (operatorList.indexOf(match[1]) == -1){
			var sim = stringSimilarity.findBestMatch(match[1], operatorList);
			if (sim.bestMatch.rating >= 0.6)
				match[1] = sim.bestMatch.target;
			else{
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang]);
				return;
			}
		}
		operator_name = jsUcfirst(match[1]);

		console.log(getNow("it") + " Request best loadout for " + operator_name + " from " + message.from.username);
		var endpoint = "https://pastebin.com/raw/kAKZKUuq";
		request.get(endpoint, (error, response, body) => {
			if(!error && response.statusCode == '200') {
				var resp = JSON.parse(body);
				var equip = resp[operator_name];

				if (equip == undefined){
					bot.sendMessage(message.chat.id, lang_operator_not_found[lang]);
					return;
				}

				var primary = equip.Primary;
				var primary_weapon = primary.Weapon;
				var primary_grip = primary.Grip;
				var primary_sight = primary.Sight;
				var primary_attachment = primary.Attachment;
				var primary_laser = primary.Laser;
				if (primary_laser == true)
					primary_laser = "Yes";

				var secondary = equip.Secondary;
				var secondary_weapon = secondary.Weapon;
				var secondary_grip = secondary.Grip;
				var secondary_sight = secondary.Sight;
				var secondary_attachment = secondary.Attachment;
				var secondary_laser = secondary.Laser;
				if (secondary_laser == true)
					secondary_laser = "Yes";

				var utility = equip.Utility;

				var text = 	"";

				text += lang_loadout_intro[lang] + " <b>" + operator_name + "</b>:\n";

				text += "\n<b>" + lang_loadout_primary[lang] + "</b>\n";
				text += "<b>" + lang_loadout_weapon[lang] + "</b>: " + primary_weapon + "\n";
				if (primary_grip != undefined)
					text += "<b>" + lang_loadout_grip[lang] + "</b>: " + mapLoadout(primary_grip, lang) + "\n";
				if (primary_sight != undefined)
					text += "<b>" + lang_loadout_sight[lang] + "</b>: " + mapLoadout(primary_sight, lang) + "\n";
				if (primary_attachment != undefined)
					text += "<b>" + lang_loadout_attachment[lang] + "</b>: " + mapLoadout(primary_attachment, lang) + "\n";
				if (primary_laser != undefined)
					text += "<b>" + lang_loadout_laser[lang] + "</b>: " + mapLoadout(primary_laser, lang) + "\n";

				text += "\n<b>" + lang_loadout_secondary[lang] + "</b>\n";
				text += "<b>" + lang_loadout_weapon[lang] + "</b>: " + secondary_weapon + "\n";
				if (secondary_grip != undefined)
					text += "<b>" + lang_loadout_grip[lang] + "</b>: " + mapLoadout(secondary_grip, lang) + "\n";
				if (secondary_sight != undefined)
					text += "<b>" + lang_loadout_sight[lang] + "</b>: " + mapLoadout(secondary_sight, lang) + "\n";
				if (secondary_attachment != undefined)
					text += "<b>" + lang_loadout_attachment[lang] + "</b>: " + mapLoadout(secondary_attachment, lang) + "\n";
				if (secondary_laser != undefined)
					text += "<b>" + lang_loadout_laser[lang] + "</b>: " + mapLoadout(secondary_laser, lang) + "\n";

				text += "\n<b>" + lang_loadout_utility[lang] + "</b>: " + mapLoadout(utility, lang);

				bot.sendMessage(message.chat.id, text, html);
			}
		});
	});
});

function mapLoadout(itemOrig, lang){
	var resp = "";
	if (lang != "en"){
		item = itemOrig.toLowerCase();
		if (item == "vertical")
			resp = lang_loadout_map_verticalgrip[lang];
		else if (item == "holographic")
			resp = lang_loadout_map_holographic[lang];
		else if (item == "compensator")
			resp = lang_loadout_map_compensator[lang];
		else if (item == "impact grenade")
			resp = lang_loadout_map_impact[lang];
		else if (item == "shield")
			resp = lang_loadout_map_shield[lang];
		else if (item == "flash hider")
			resp = lang_loadout_map_flashider[lang];
		else if (item == "breach charge")
			resp = lang_loadout_map_breach[lang];
		else if (item == "red dot")
			resp = lang_loadout_map_reddot[lang];
		else if (item == "muzzle brake")
			resp = lang_loadout_map_muzzle[lang];
		else if (item == "nitro cell")
			resp = lang_loadout_map_nitro[lang];
		else if (item == "smoke grenade")
			resp = lang_loadout_map_smoke[lang];
		else if (item == "barbed wire")
			resp = lang_loadout_map_barbed[lang];
		else if (item == "frag grenade")
			resp = lang_loadout_map_frag[lang];
		else if (item == "bulletproof camera")
			resp = lang_loadout_map_bulletproof[lang];
		else if (item == "stun grenade")
			resp = lang_loadout_map_stun[lang];
		else if (item == "suppressor")
			resp = lang_loadout_map_suppressor[lang];
		else if (item == "yes")
			resp = lang_loadout_map_lasertrue[lang];
		else
			resp = itemOrig;
	}else
		resp = itemOrig;
	return resp;
}

function mapRank(rank, lang){	
	if (rank < 1399)
		return lang_rank_copper4[lang];
	else if ((rank >= 1399) && (rank < 1499))
		return lang_rank_copper3[lang];
	else if ((rank >= 1499) && (rank < 1599))
		return lang_rank_copper2[lang];
	else if ((rank >= 1599) && (rank < 1699))
		return lang_rank_copper1[lang];
	else if ((rank >= 1699) && (rank < 1799))
		return lang_rank_bronze4[lang];
	else if ((rank >= 1799) && (rank < 1899))
		return lang_rank_bronze3[lang];
	else if ((rank >= 1899) && (rank < 1999))
		return lang_rank_bronze2[lang];
	else if ((rank >= 1999) && (rank < 2099))
		return lang_rank_bronze1[lang];
	else if ((rank >= 2099) && (rank < 2199))
		return lang_rank_silver4[lang];
	else if ((rank >= 2199) && (rank < 2299))
		return lang_rank_silver3[lang];
	else if ((rank >= 2299) && (rank < 2399))
		return lang_rank_silver2[lang];
	else if ((rank >= 2399) && (rank < 2499))
		return lang_rank_silver1[lang];
	else if ((rank >= 2499) && (rank < 2699))
		return lang_rank_gold4[lang];
	else if ((rank >= 2699) && (rank < 2899))
		return lang_rank_gold3[lang];
	else if ((rank >= 2899) && (rank < 3099))
		return lang_rank_gold2[lang];
	else if ((rank >= 3099) && (rank < 3299))
		return lang_rank_gold1[lang];
	else if ((rank >= 3299) && (rank < 3699))
		return lang_rank_platinum3[lang];
	else if ((rank >= 3699) && (rank < 4099))
		return lang_rank_platinum2[lang];
	else if ((rank >= 4099) && (rank < 4499))
		return lang_rank_platinum1[lang];
	else
		return lang_rank_diamond[lang];
}

bot.onText(/^\/help(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /help");
			return;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "Markdown"
		};

		if (message.chat.id < 0)
			bot.sendMessage(message.chat.id, lang_private[lang]);
		bot.sendMessage(message.from.id, lang_help[lang], mark);
	});
});

bot.onText(/^\/groups(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /groups");
			return;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		bot.sendMessage(message.chat.id, lang_groups[lang], mark);
	});
});

bot.onText(/^\/team(?:@\w+)? (.+)|^\/team(?:@\w+)?$/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /team");
			return;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		connection.query("SELECT team_id FROM team_member WHERE username = '" + message.from.username + "' AND role = 1", function (err, rows) {
			if (err) throw err;

			var team_list = "";
			if (Object.keys(rows).length == 0)
				team_list = "\n" + lang_team_no_team[lang];
			else{
				var team;
				var team_member;
				var team_members = "";
				for (var i = 0, len = Object.keys(rows).length; i < len; i++) {
					team = connection_sync.query("SELECT name FROM team WHERE id = " + rows[i].team_id);
					team_member = connection_sync.query("SELECT username FROM team_member WHERE username != '" + message.from.username + "' AND team_id = " + rows[i].team_id);
					team_members = "";
					for (var j = 0, len2 = Object.keys(team_member).length; j < len2; j++)
						team_members += team_member[j].username + ", ";
					team_members = team_members.slice(0, -2);
					team_list += "\n" + team[0].name + " (" + team_members + ")";
				}
			}

			bot.sendMessage(message.chat.id, lang_team_intro[lang] + team_list, mark);

		});
	});
});

bot.onText(/^\/tagteam(?:@\w+)? (.+)/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /team");
			return;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_team_only_groups[lang]);
			return;
		}

		var mark = {
			parse_mode: "HTML"
		};

		var team_name = match[1];

		connection.query("SELECT id FROM team WHERE group_id = '" + message.chat.id + "' AND name = '" + team_name + "'", function (err, rows) {
			if (err) throw err;
			var team_id = rows[0].id;
			connection.query("SELECT username FROM team_member WHERE username != '" + message.from.username + "' AND team_id = " + team_id, function (err, rows) {
				if (err) throw err;
				var text = "<b>" + message.from.username + "</b> " + lang_team_call[lang] + ": ";
				for (var i = 0; i < Object.keys(rows).length; i++)
					text += "@" + rows[i].username + ", ";
				text = text.slice(0, -2) + "!";
				bot.sendMessage(message.chat.id, text, mark);

				connection.query("UPDATE team SET tag_date = NOW() WHERE id = " + team_id, function (err, rows) {
					if (err) throw err;
				});
			});
		});
	});
});

bot.onText(/^\/addteam(?:@\w+)? (.+)/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /team");
			return;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_team_only_groups[lang]);
			return;
		}

		var parts = message.text.split(" ");
		if (parts.length < 3){
			bot.sendMessage(message.chat.id, lang_team_invalid_syntax[lang]);
			return;
		}

		var team_name = parts[1];
		var members = parts[2];

		var re = new RegExp("^[a-zA-Z0-9àèìòù\\-_ ]{1,64}$");
		if (re.test(team_name) == false) {
			bot.sendMessage(message.chat.id, lang_team_invalid_name[lang]);
			return;
		}

		if (members.indexOf("@") != -1){
			bot.sendMessage(message.chat.id, lang_team_invalid_at[lang]);
			return;
		}

		var arr_members = [];
		if (members.indexOf(",") != -1)
			arr_members = members.split(",").map(item => item.trim());
		else
			arr_members.push(members);
		arr_members.push(message.from.username);
		arr_members = uniq(arr_members);

		connection.query("SELECT id FROM team WHERE group_id = '" + message.chat.id + "' AND name = '" + team_name + "'", function (err, rows, fields) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				if (arr_members.length > 10){
					bot.sendMessage(message.chat.id, lang_team_invalid_count[lang]);
					return;
				}
				connection.query("INSERT INTO team (group_id, name, tag_date) VALUES (" + message.chat.id + ",'" + team_name + "', NOW())", function (err, rows, fields) {
					if (err) throw err;
					var team_id = rows.insertId;
					var role = 0;
					var added = 0;
					for (var i = 0; i < arr_members.length; i++){
						if (arr_members[i] == message.from.username)
							role = 1;
						else
							role = 0;
						var member = connection_sync.query("SELECT 1 FROM team_member WHERE team_id = " + team_id + " AND username = '" + arr_members[i] + "'");
						if (Object.keys(member).length == 0){
							connection.query("INSERT INTO team_member (team_id, username, role) VALUES (" + team_id + ",'" + arr_members[i] + "', " + role + ")", function (err, rows, fields) {
								if (err) throw err;
							});
							added++;
						}
					}

					bot.sendMessage(message.chat.id, lang_team_created[lang] + ", " + added + " " + lang_team_users_added[lang] + "!");
				});
				return;
			} else {
				var team_id = rows[0].id;
				var member_permission = connection_sync.query("SELECT username FROM team_member WHERE team_id = " + team_id + " AND role = 1");
				if (member_permission[0].username != message.from.username){
					bot.sendMessage(message.chat.id, lang_team_only_leader[lang]);
					return;
				}
				var member_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM team_member WHERE team_id = " + team_id);
				member_cnt = member_cnt[0].cnt;
				if (member_cnt+(arr_members.length-1) > 10){
					bot.sendMessage(message.chat.id, lang_team_invalid_count[lang]);
					return;
				}
				var role = 0;
				var added = 0;
				for (var i = 0; i < arr_members.length; i++){
					if (arr_members[i] == message.from.username)
						role = 1;
					else
						role = 0;
					var member = connection_sync.query("SELECT 1 FROM team_member WHERE team_id = " + team_id + " AND username = '" + arr_members[i] + "'");
					if (Object.keys(member).length == 0){
						connection.query("INSERT INTO team_member (team_id, username, role) VALUES (" + team_id + ",'" + arr_members[i] + "', " + role + ")", function (err, rows, fields) {
							if (err) throw err;
						});
						added++;
					}
				}

				bot.sendMessage(message.chat.id, added + " " + lang_team_users_added[lang] + "!");
			}
		});
	});
});

bot.onText(/^\/delteam(?:@\w+)? (.+)/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /team");
			return;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_team_only_groups[lang]);
			return;
		}

		var parts = message.text.split(" ");
		if (parts.length < 3){
			bot.sendMessage(message.chat.id, lang_team_invalid_syntax[lang]);
			return;
		}

		var team_name = parts[1];
		var members = parts[2];

		var re = new RegExp("^[a-zA-Z0-9àèìòù\\-_ ]{1,64}$");
		if (re.test(team_name) == false) {
			bot.sendMessage(message.chat.id, lang_team_invalid_name[lang]);
			return;
		}

		if (members.indexOf("@") != -1){
			bot.sendMessage(message.chat.id, lang_team_invalid_at[lang]);
			return;
		}

		var arr_members = [];
		if (members.indexOf(",") != -1)
			arr_members = members.split(",").map(item => item.trim());
		else
			arr_members.push(members);
		arr_members = uniq(arr_members);

		connection.query("SELECT id FROM team WHERE group_id = '" + message.chat.id + "' AND name = '" + team_name + "'", function (err, rows, fields) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_team_not_exists[lang]);
			} else {
				var team_id = rows[0].id;
				var member_permission = connection_sync.query("SELECT username FROM team_member WHERE team_id = " + team_id + " AND role = 1");
				if (member_permission[0].username != message.from.username){
					bot.sendMessage(message.chat.id, lang_team_not_leader_del[lang]);
					return;
				}
				var member_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM team_member WHERE team_id = " + team_id);
				member_cnt = member_cnt[0].cnt;
				var removed = 0;
				for (var i = 0; i < arr_members.length; i++){
					var member = connection_sync.query("SELECT role FROM team_member WHERE team_id = " + team_id + " AND username = '" + arr_members[i] + "'");
					if (Object.keys(member).length > 0){
						if (arr_members[i] == message.from.username){
							bot.sendMessage(message.chat.id, lang_team_remove_yourself[lang]);
							continue;
						}
						connection.query("DELETE FROM team_member WHERE team_id = " + team_id + " AND username = '" + arr_members[i] + "'", function (err, rows, fields) {
							if (err) throw err;
						});
						removed++;
					}
				}

				var team_deleted = "";
				if (member_cnt-1 == removed){
					connection.query("DELETE FROM team WHERE id = " + team_id, function (err, rows, fields) {
						if (err) throw err;
					});
					connection.query("DELETE FROM team_member WHERE team_id = " + team_id + " AND username = '" + message.from.username + "'", function (err, rows, fields) {
						if (err) throw err;
					});
					team_deleted = " " + lang_team_deleted[lang];
				}

				bot.sendMessage(message.chat.id, removed + " " + lang_team_user_removed[lang] + team_deleted + "!");
			}
		});
	});
});

bot.onText(/^\/search(?:@\w+)? (.+)|^\/search(?:@\w+)?$/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /search");
			return;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang]);
			return;
		}

		var platform = match[1].toLowerCase();
		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}

		connection.query("SELECT default_username FROM user WHERE default_platform = '" + platform + "' AND lang = '" + lang + "' AND default_username IS NOT NULL", function (err, rows, fields) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_search_noplayers[lang]);
				return;
			}

			var list = lang_search_found[lang] + " " + platform + ":";
			for (var i = 0, len = Object.keys(rows).length; i < len; i++)
				list += "\n" + rows[i].default_username;

			if (message.chat.id < 0)
				bot.sendMessage(message.chat.id, lang_private[lang]);
			bot.sendMessage(message.from.id, list);
		});
	});
});

bot.onText(/^\/top(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /top");
			return;
		}

		var mark = {
			parse_mode: "HTML"
		};

		var text = "<b>" + lang_rank[rows[0].lang] + "</b>\n";
		var c = 1;
		var size = 25;

		connection.query('SELECT username, platform, ranked_kd As points FROM player_history WHERE id IN (SELECT MAX(id) FROM player_history GROUP BY username, platform) GROUP BY username, platform ORDER BY ranked_kd DESC', function (err, rows, fields) {
			if (err) throw err;
			for (var i = 0; i < size; i++){
				text += c + "° <b>" + rows[i].username + "</b> on " + decodePlatform(rows[i].platform) + " (" + rows[i].points + ")\n";
				c++;
			}

			bot.sendMessage(message.chat.id, text, html);
		});
	});
});

bot.onText(/^\/parse(?:@\w+)?/i, function (message, match) {
	if ((message.from.id == 20471035) || (message.from.id == 200492030)) {
		if (message.reply_to_message == undefined){
			console.log("Use this in reply mode");
			return;
		}
		var text = message.reply_to_message.text.replace(/[^a-zA-Z0-9\-_\s\.,]/g, " ");
		var author;
		if (message.reply_to_message.from.username != undefined)
			author = "@" + message.reply_to_message.from.username;
		else if (message.reply_to_message.from.first_name != undefined)
			author = message.reply_to_message.from.first_name;
		var response = "";
		
		if (text.search(/recluto|recluta|reclutiamo|cerchiamo/gmi) == -1){
			console.log("Recruit text not found");
			return;
		}
		var clanNameFound = "";
		var clanName = text.match(/^clan [\w ]+$|^team [\w ]+$/gmi);
		if (clanName != null)
			clanNameFound = " " + jsUcall(clanName[0]);
		else {
			var team = text.search(/team/gmi);
			var clan = text.search(/clan/gmi);
			if ((team != -1) || (clan != -1)) {
				if (team != -1)
					response += "<b>Tipo gruppo</b>: Team\n";
				else
					response += "<b>Tipo gruppo</b>: Clan\n";
			}
		}
		var header = "🔰 <b>Reclutamento" + clanNameFound + "</b> 🔰\n";
		var age = text.match(/(\d){2} anni|età (\d){2}|(\d){2} in su|(\d){2} in poi|(\s[1-3][0-9]\s){1}/gmi);
		if (age != null)
			response += "<b>Età</b>: " + age[0].trim() + "\n";
		var rank = text.match(/(platino|oro|argento) (\d){1}|(platino|oro|argento)(\d){1}|(platino|oro|argento)/gmi);
		if (rank != null) {
			for (var i = 0; i < rank.length; i++)
				rank[i] = jsUcfirst(rank[i].toLowerCase());
			response += "<b>Rango</b>: " + rank.join(", ") + "\n";
		}
		var platform = text.match(/pc|ps4|xbox/gmi);
		if (platform != null) {
			for (var i = 0; i < platform.length; i++)
				platform[i] = jsUcfirst(platform[i].toLowerCase());
			response += "<b>Piattaforma</b>: " + platform.join(", ") + "\n";
		} else
			response += "<i>Specifica la piattaforma!</i>\n";
		var rateo = text.match(/((\d)\.(\d))|((\d)\,(\d))/gmi);
		if (rateo != null)
			response += "<b>Rateo</b>: " + rateo[0].trim() + "\n";
		var competitive = text.search(/competitivo|esl|cw|go4|ladder/gmi);
		if (competitive != -1) {
			var competitive_more = text.match(/esl|cw|go4|ladder/gmi);
			if (competitive_more != null)
				response += "<b>Competitivo</b>: " + jsUcfirst(competitive_more[0].toLowerCase()) + "\n";
			else
				response += "<b>Competitivo</b>: Sì\n";
		}
		var audition = text.search(/provino|provini/gmi);
		if (audition != -1)
			response += "<b>Provino</b>: Sì\n";
		
		if (response == ""){
			console.log("Response empty");
			return;
		}
		
		response += "\n<i>Contattare</i> " + author
		// bot.deleteMessage(message.chat.id, message.reply_to_message.message_id);
		
		bot.sendMessage(message.from.id, header + response, html);
	}
});

bot.onText(/^\/find (.+)(?:@\w+)?|^\/find(?:@\w+)?/i, function (message, match) {
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /find");
			return;
		}

		var lang = rows[0].lang;
		
		var mark = {
			parse_mode: "HTML"
		};

		if (match[1] != undefined){
			var platform = match[1].toLowerCase();
			if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
				bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
				return;
			}
		} else {
			if (rows[0].default_platform != null)
				var platform = rows[0].default_platform;
			else {
				bot.sendMessage(message.chat.id, lang_invalid_find[lang]);
				return;
			}
		}
		
		var platform_txt = decodePlatform(platform);
		var author;
		if (rows[0].default_username != null)
			author = rows[0].default_username;
		else if (message.from.username != undefined)
			author = "@" + message.from.username;
		else if (message.from.first_name != undefined)
			author = message.from.first_name;
		
		var iKeys = [];
		iKeys.push([{
			text: lang_search_join[lang],
			callback_data: "find:" + lang
		}]);
		
		var opt = {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: iKeys
			}
		}
		
		bot.sendMessage(message.chat.id, "👀 " + jsUcfirst(author) + " " + lang_search_mates[lang] + " " + platform_txt + "!", opt);
	});
});

bot.on('callback_query', function (message) {
	var split = message.data.split(":");
	var lang = split[1];
	
	connection.query("SELECT default_username FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
	
		var name;
		if ((Object.keys(rows).length > 0) && (rows[0].default_username != null))
			name = rows[0].default_username;
		else if (message.from.username != undefined)
			name = "@" + message.from.username;
		else if (message.from.first_name != undefined)
			name = message.from.first_name;
		
		var newtext = message.message.text;
		if (newtext.toLowerCase().indexOf(name.toLowerCase()) != -1){
			bot.answerCallbackQuery(message.id, {text: lang_search_already[lang]});
			return;
		}

		name = jsUcfirst(name);
		
		if (message.message.text.indexOf(lang_search_mates_lbl[lang]) == -1)
			newtext += "\n" + lang_search_mates_lbl[lang] + ": " + name;
		else
			newtext += ", " + name;		

		var iKeys = [];
		iKeys.push([{
			text: lang_search_join[lang],
			callback_data: "find:" + lang
		}]);

		bot.editMessageText(newtext, {
			chat_id: message.message.chat.id,
			message_id: message.message.message_id,
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: iKeys
			}
		});

		bot.answerCallbackQuery(message.id, {text: lang_search_ok[lang]});
	});
});

bot.onText(/^\/autotrack(?:@\w+)?/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Autotrack called manually");
		autoTrack();
		bot.sendMessage(messsage.chat.id, "Done");
	}
});

bot.onText(/^\/report(?:@\w+)?/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Weekly report generation called manually");
		reportType = 1;
		reportProgress(message.chat.id);
	}
});

bot.onText(/^\/mreport(?:@\w+)?/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Monthly report generation called manually");
		reportType = 2;
		reportProgress(message.chat.id);
	}
});

bot.onText(/^\/dreport(?:@\w+)?/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Daily report generation called manually");
		reportDailyProgress(message.chat.id);
	}
});

// Funzioni

function updateChatId(from_id, chat_id) {
	if (chat_id < 0){
		connection.query('UPDATE user SET last_chat_id = "' + chat_id + '" WHERE account_id = ' + from_id, function (err, rows, fields) {
			if (err) throw err;
		});
	}
}

function reportDailyProgress() {
	var query = "SELECT account_id, default_username, default_platform, lang FROM user WHERE daily_report = 1 AND default_username IS NOT NULL AND default_platform IS NOT NULL";
	connection.query(query, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length > 0) {
			if (Object.keys(rows).length == 1)
				console.log(getNow("it") + "\x1b[32m 1 daily report generation\x1b[0m");
			else
				console.log(getNow("it") + "\x1b[32m " + Object.keys(rows).length + " daily reports generation\x1b[0m");
			rows.forEach(generateDailyReport);
		}
	});
}

function generateDailyReport(element, index, array) {
	var account_id = element.account_id;
	var username = element.default_username;
	var platform = element.default_platform;
	var lang = element.lang;
	var report = "<b>" + lang_daily_report_header[lang] + "</b>\n";
	var cnt = 0;

	var lastId;
	var player = connection_sync.query('SELECT username, platform, ranked_wl, ranked_kd, season_mmr FROM player_history WHERE username = "' + username + '" AND platform = "' + platform + '" AND insert_date BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY) AND CURRENT_DATE ORDER BY id DESC');
	if (Object.keys(player).length > 1){
		var lastId = Object.keys(player).length-1;
		report_head = "\n<b>" + player[0].username + "</b> " + lang_on[lang] + " " + decodePlatform(player[0].platform) + ":\n";
		report_line = "";
		report_line += calculateSym(lang_operator_wlratio[lang], player[0].ranked_wl, player[lastId].ranked_wl, 1);
		report_line += calculateSym(lang_operator_kdratio[lang], player[0].ranked_kd, player[lastId].ranked_kd, 1);
		report_line += calculateSym(lang_season_mmr[lang], player[0].season_mmr, player[lastId].season_mmr, 1);
		if (report_line != "") {
			console.log("Daily report sent for user " + username + " on " + platform);
			bot.sendMessage(account_id, report + report_head + report_line, html);
		}
	}
}

function reportProgress(chat_id) {
	var query = "";
	if (chat_id != -1)
		query = "SELECT last_chat_id, lang FROM user WHERE last_chat_id = '" + chat_id + "' AND report = 1 GROUP BY last_chat_id";
	else
		query = "SELECT last_chat_id, lang FROM user WHERE last_chat_id IS NOT NULL AND report = 1 GROUP BY last_chat_id";
	connection.query(query, function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length > 0) {
			if (Object.keys(rows).length == 1)
				console.log(getNow("it") + "\x1b[32m 1 report generation\x1b[0m");
			else
				console.log(getNow("it") + "\x1b[32m " + Object.keys(rows).length + " reports generation\x1b[0m");
			rows.forEach(generateReport);
		}
	});
}

function generateReport(element, index, array) {
	var last_chat_id = element.last_chat_id;
	var lang = element.lang;
	var interval = "";
	var intervalDays = 0;
	if (reportType == 1) {
		intervalDays = 7;
		interval = lang_report_header_week[lang];
	} else if (reportType == 2) {
		intervalDays = 30;
		interval = lang_report_header_month[lang];
	}
	var report = "<b>" + interval + "</b>\n";
	var cnt = 0;

	var lastId;
	var player;
	var player_list = connection_sync.query('SELECT default_username, default_platform FROM user WHERE default_username IS NOT NULL AND default_platform IS NOT NULL AND last_chat_id = "' + last_chat_id + '"');
	for (var i = 0, len = Object.keys(player_list).length; i < len; i++) {
		player = connection_sync.query('SELECT username, platform, ranked_wl, ranked_kd, season_mmr FROM player_history WHERE username = "' + player_list[i].default_username + '" AND platform = "' + player_list[i].default_platform + '" AND insert_date BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL ' + intervalDays + ' DAY) AND CURRENT_DATE ORDER BY id DESC');
		if (Object.keys(player).length > 1){
			var lastId = Object.keys(player).length-1;
			report_head = "\n<b>" + player[0].username + "</b> " + lang_on[lang] + " " + decodePlatform(player[0].platform) + ":\n";
			report_line = "";
			report_line += calculateSym(lang_operator_wlratio[lang], player[0].ranked_wl, player[lastId].ranked_wl, 1);
			report_line += calculateSym(lang_operator_kdratio[lang], player[0].ranked_kd, player[lastId].ranked_kd, 1);
			report_line += calculateSym(lang_season_mmr[lang], player[0].season_mmr, player[lastId].season_mmr, 1);
			if (report_line != ""){
				report += report_head + report_line;
				cnt++;
			}
		}
	}

	if (cnt > 0) {
		bot.sendMessage(last_chat_id, report, html);
		console.log("Weekly/Monthly report sent for group " + last_chat_id);
	} else
		console.log("No data report for group " + last_chat_id);
}

function calculateSym(text, first, last, float) {
	if (first == last)
		return "";
	var sym = "⬇";
	if (first > last)
		sym = "⬆";
	if (float == 1) {
		last = parseFloat(last).toFixed(3);
		first = parseFloat(first).toFixed(3);
	}
	return "<i>" + text + "</i>: " + last + " -> " + first + " " + sym + "\n";
}

function checkTeam() {
	connection.query('SELECT id FROM team WHERE DATEDIFF(CURDATE(), CAST(tag_date As date)) > 15', function (err, rows, fields) {
		if (err) throw err;
		if (Object.keys(rows).length > 0) {
			if (Object.keys(rows).length == 1)
				console.log(getNow("it") + "\x1b[32m 1 team deleted\x1b[0m");
			else
				console.log(getNow("it") + "\x1b[32m " + Object.keys(rows).length + " teams deleted\x1b[0m");
			rows.forEach(deleteTeam);
		}
	});
};

function deleteTeam(element, index, array) {
	var team_id = element.id;

	connection.query('DELETE FROM team_member WHERE team_id = ' + team_id, function (err, rows, fields) {
		if (err) throw err;
		connection.query('DELETE FROM team WHERE id = ' + team_id, function (err, rows, fields) {
			if (err) throw err;
		});
	});
};

function autoTrack(){
	connection.query("SELECT default_username, default_platform FROM user WHERE default_username IS NOT NULL AND default_platform IS NOT NULL AND undefined_track = 0 ORDER BY last_force_update DESC, last_update ASC", function (err, rows, fields) {
		if (err) throw err;

		if (Object.keys(rows).length > 0){
			console.log("Found " + Object.keys(rows).length + " users to check");
			rows.forEach(setAutoTrack);
		}else
			console.log("No users found");
	});
}

function setAutoTrack(element, index, array) {
	var username = element.default_username;
	var platform = element.default_platform;

	r6.stats(username, platform, -1, 0).then(response => {

		var responseStats = response;

		connection.query('SELECT ranked_playtime, casual_playtime FROM player_history WHERE platform = "' + response.platform + '" AND username = "' + response.username + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;

			var toSave = 0;
			if (Object.keys(rows).length == 0){
				toSave = 1;
				console.log(getNow("it") + " " + username + " on " + platform + " created");
			}else if ((rows[0].ranked_playtime < responseStats.ranked_playtime) || (rows[0].casual_playtime < responseStats.casual_playtime)){
				toSave = 1;
				console.log(getNow("it") + " " + username + " on " + platform + " updated");
			}
			/*
			else
				console.log(getNow("it") + " " + username + " on " + platform + " skipped");
			*/

			if (toSave == 1){
				r6.stats(username, platform, -1, 1).then(response => {
					var responseOps = response;
					if (toSave == 1)
						saveData(responseStats, responseOps);
				});
			}
		});
	}).catch(error => {
		console.log(error);
		console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " not found");
	});
};

function stripContent(text){
	text = striptags(text, ["b","i","br","li"]);
	text = text.replaceAll("(<br>)","\n");
	text = text.replaceAll("(<li>)","\n- ");
	text = text.replaceAll("(</li>)","");

	// sempre per ultima
	text = text.replaceAll("((\\n\\n\\n))","\n");
	text = text.replaceAll("((\\n\\n))","\n");
	if (text.length > 500)
		text = text.substr(0, 500) + "...";
	return text.trim();
}

String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function compare(val1, val2, format = "", lang = defaultLang, inverted = 0){
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

function toTime(seconds, lang = defaultLang, onlyHours = false) {
	if (onlyHours == true)
		return formatNumber(humanizeDuration(seconds*1000, { language: lang, units: ['h'], round: true }));
	else
		return humanizeDuration(seconds*1000, { language: lang });
}

function callNTimes(time, fn) {
	function callFn() {
		if (1 < 0) return;
		fn();
		setTimeout(callFn, time);
	}
	setTimeout(callFn, time);
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
		datetime = "Error";
	if (obj == true)
		datetime = new Date(datetime);
	return datetime;
}

function toDate(lang, date) {
	var d = new Date(date);
	if (typeof date == "object")
		d = date;
	var datetime;
	if (lang == "it") {
		datetime = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear() + " alle " + addZero(d.getHours()) + ':' + addZero(d.getMinutes());
	} else if (lang == "en") {
		datetime = d.getFullYear() + "-" + addZero(d.getMonth() + 1) + "-" + addZero(d.getDate()) + " " + addZero(d.getHours()) + ':' + addZero(d.getMinutes());
	} else
		datetime = "Error";
	return datetime;
}

function jsUcfirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function jsUcall(string) {
    return string.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
}

function addZero(i) {
	if (i < 10)
		i = "0" + i;
	return i;
}

function uniq(a) {
	return Array.from(new Set(a));
}
