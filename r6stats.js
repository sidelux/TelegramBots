process.env["NTBA_FIX_319"] = 1;
process.env["NTBA_FIX_350"] = 1;

process.on('uncaughtException', function (error) {
	console.log("\x1b[31m", "Exception: ", error, "\x1b[0m");
});

process.on('unhandledRejection', function (error, p) {
	if ((error.message != undefined) && (error.message.indexOf("ECONNRESET") == -1))
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
var humanizeDuration = require('humanize-duration');
var request = require("request");
var plotly = require('plotly')('redfenix45', config.plotlytoken);
var Schedule = require('node-schedule');
var Parser = require('rss-parser');
var striptags = require('striptags');
var stringSimilarity = require('string-similarity');
var im = require('imagemagick');
var tesseract = require('node-tesseract-ocr');
var ffmpeg = require('fluent-ffmpeg');
var fetch = require('node-fetch');
var PDFDocument = require('./pdfkit-tables.js');

// require('longjohn');		// enable to detailed error log

var r6italy_chatid = -1001246584843;
var api_disabled = 0;
var api_overloaded = 0;

class RainbowSixApi {
	constructor() {}

	stats(username, platform, season, region, extra) {
		return new Promise((resolve, reject) => {

			var endpoint;

			username = encodeURI(username);

			if (extra == 1){
				endpoint = "http://fenixweb.net/r6api/getOperators.php?name=" + username + "&platform=" + platform + "&region=" + region + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {
					if (!error && response.statusCode == '200') {
						var objResp = JSON.parse(body.replaceAll("nakk", "nokk"));	// nokk fix (ubi pls)
						
						if (objResp.error != undefined)
							return reject(mapError(objResp.error.errorCode, objResp.error.message));
						
						if (objResp.players == undefined)
							return reject("Operators data not found - " + username);
						
						var keys = Object.keys(objResp.players);
						var ubi_id = keys[0];

						if (objResp.players[ubi_id] == undefined)
							return reject("User not found (1) - " + username);

						var objOps = objResp.players[ubi_id];
						return resolve(objOps);
					}
				});
			}else if (extra == 2){
				endpoint = "http://fenixweb.net/r6api/getOperators.php?name=" + username + "&platform=" + platform + "&region=" + region + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {
					if (!error && response.statusCode == '200') {						
						var objResp = JSON.parse(body.replaceAll("nakk", "nokk"));	// nokk fix (ubi pls)
						
						if (objResp.error != undefined)
							return reject(mapError(objResp.error.errorCode, objResp.error.message));
						
						var objOps = objResp.operators;
						return resolve(objOps);
					}
				});
			}else{
				var objStats = {};

				endpoint = "http://fenixweb.net/r6api/getUser.php?name=" + username + "&platform=" + platform + "&region=" + region + "&season=" + season + "&appcode=" + appcode;
				request.get(endpoint, (error, response, body) => {					
					if (!error && response.statusCode == '200') {
						var objResp = JSON.parse(body);

						if (objResp.error != undefined)
							return reject(mapError(objResp.error.errorCode, objResp.error.message));

						var keys = Object.keys(objResp.players);
						var ubi_id = keys[0];

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
						objStats.top_rank_position = objResp.players[ubi_id].top_rank_position;

						objStats.last_match_skill_stdev_change = objResp.players[ubi_id].last_match_skill_stdev_change;
						objStats.last_match_mmr_change = objResp.players[ubi_id].last_match_mmr_change;
						objStats.last_match_skill_mean_change = objResp.players[ubi_id].last_match_skill_mean_change;
						objStats.last_match_result = objResp.players[ubi_id].last_match_result;

						if (objStats.season_rank == undefined) objStats.season_rank = 0;
						if (objStats.season_mmr == undefined) objStats.season_mmr = 0;
						if (objStats.season_max_mmr == undefined) objStats.season_max_mmr = 0;

						endpoint = "http://fenixweb.net/r6api/getStats.php?name=" + username + "&platform=" + platform + "&appcode=" + appcode;
						request.get(endpoint, (error, response, body) => {
							if(!error && response.statusCode == '200') {
								var objResp = JSON.parse(body);

								if (objResp.players[ubi_id] == undefined)
									return reject("User stats empty - " + username);

								// Ranked
								objStats.ranked_plays = objResp.players[ubi_id].rankedpvp_matchplayed;
								objStats.ranked_wins = objResp.players[ubi_id].rankedpvp_matchwon;
								objStats.ranked_losses = objResp.players[ubi_id].rankedpvp_matchlost;
								objStats.ranked_kills = objResp.players[ubi_id].rankedpvp_kills;
								objStats.ranked_deaths = objResp.players[ubi_id].rankedpvp_death;
								objStats.ranked_playtime = objResp.players[ubi_id].rankedpvp_timeplayed;
								
								// Casual
								objStats.casual_plays = objResp.players[ubi_id].casualpvp_matchplayed;
								objStats.casual_wins = objResp.players[ubi_id].casualpvp_matchwon;
								objStats.casual_losses = objResp.players[ubi_id].casualpvp_matchlost;
								objStats.casual_kills = objResp.players[ubi_id].casualpvp_kills;
								objStats.casual_deaths = objResp.players[ubi_id].casualpvp_death;
								objStats.casual_playtime = objResp.players[ubi_id].casualpvp_timeplayed;
								
								// Other
								objStats.revives = objResp.players[ubi_id].generalpvp_revive;
								objStats.suicides = objResp.players[ubi_id].generalpvp_suicide;
								objStats.reinforcements_deployed = objResp.players[ubi_id].generalpvp_reinforcementdeploy;
								objStats.barricades_built = objResp.players[ubi_id].generalpvp_barricadedeployed;
								objStats.bullets_hit = objResp.players[ubi_id].generalpvp_bullethit;
								objStats.headshots = objResp.players[ubi_id].generalpvp_headshot;
								objStats.melee_kills = objResp.players[ubi_id].generalpvp_meleekills;
								objStats.penetration_kills = objResp.players[ubi_id].generalpvp_penetrationkills;
								objStats.assists = objResp.players[ubi_id].generalpvp_killassists;
								
								// Modes
								objStats.mode_secure = objResp.players[ubi_id].secureareapvp_bestscore;
								objStats.mode_hostage = objResp.players[ubi_id].rescuehostagepvp_bestscore;
								objStats.mode_bomb = objResp.players[ubi_id].plantbombpvp_bestscore;
								
								// Weapons
								objStats.bulletfired_1 = objResp.players[ubi_id]["weapontypepvp_bulletfired:1"];
								objStats.bullethit_1 = objResp.players[ubi_id]["weapontypepvp_bullethit:1"];
								objStats.kills_1 = objResp.players[ubi_id]["weapontypepvp_kills:1"];
								objStats.headshot_1 = objResp.players[ubi_id]["weapontypepvp_headshot:1"];
								objStats.bulletfired_2 = objResp.players[ubi_id]["weapontypepvp_bulletfired:2"];
								objStats.bullethit_2 = objResp.players[ubi_id]["weapontypepvp_bullethit:2"];
								objStats.kills_2 = objResp.players[ubi_id]["weapontypepvp_kills:2"];
								objStats.headshot_2 = objResp.players[ubi_id]["weapontypepvp_headshot:2"];
								objStats.bulletfired_3 = objResp.players[ubi_id]["weapontypepvp_bulletfired:3"];
								objStats.bullethit_3 = objResp.players[ubi_id]["weapontypepvp_bullethit:3"];
								objStats.kills_3 = objResp.players[ubi_id]["weapontypepvp_kills:3"];
								objStats.headshot_3 = objResp.players[ubi_id]["weapontypepvp_headshot:3"];
								objStats.bulletfired_4 = objResp.players[ubi_id]["weapontypepvp_bulletfired:4"];
								objStats.bullethit_4 = objResp.players[ubi_id]["weapontypepvp_bullethit:4"];
								objStats.kills_4 = objResp.players[ubi_id]["weapontypepvp_kills:4"];
								objStats.headshot_4 = objResp.players[ubi_id]["weapontypepvp_headshot:4"];
								objStats.bulletfired_5 = objResp.players[ubi_id]["weapontypepvp_bulletfired:5"];
								objStats.bullethit_5 = objResp.players[ubi_id]["weapontypepvp_bullethit:5"];
								objStats.kills_5 = objResp.players[ubi_id]["weapontypepvp_kills:5"];
								objStats.headshot_5 = objResp.players[ubi_id]["weapontypepvp_headshot:5"];
								objStats.bulletfired_6 = objResp.players[ubi_id]["weapontypepvp_bulletfired:6"];
								objStats.bullethit_6 = objResp.players[ubi_id]["weapontypepvp_bullethit:6"];
								objStats.kills_6 = objResp.players[ubi_id]["weapontypepvp_kills:6"];
								objStats.headshot_6 = objResp.players[ubi_id]["weapontypepvp_headshot:6"];
								objStats.bulletfired_7 = objResp.players[ubi_id]["weapontypepvp_bulletfired:7"];
								objStats.bullethit_7 = objResp.players[ubi_id]["weapontypepvp_bullethit:7"];
								objStats.kills_7 = objResp.players[ubi_id]["weapontypepvp_kills:7"];
								objStats.headshot_7 = objResp.players[ubi_id]["weapontypepvp_headshot:7"];

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
								if (objStats.bulletfired_1 == undefined) objStats.bulletfired_1 = 0;
								if (objStats.bullethit_1 == undefined) objStats.bullethit_1 = 0;
								if (objStats.kills_1 == undefined) objStats.kills_1 = 0;
								if (objStats.headshot_1 == undefined) objStats.headshot_1 = 0;
								if (objStats.bulletfired_2 == undefined) objStats.bulletfired_2 = 0;
								if (objStats.bullethit_2 == undefined) objStats.bullethit_2 = 0;
								if (objStats.kills_2 == undefined) objStats.kills_2 = 0;
								if (objStats.headshot_2 == undefined) objStats.headshot_2 = 0;
								if (objStats.bulletfired_3 == undefined) objStats.bulletfired_3 = 0;
								if (objStats.bullethit_3 == undefined) objStats.bullethit_3 = 0;
								if (objStats.kills_3 == undefined) objStats.kills_3 = 0;
								if (objStats.headshot_3 == undefined) objStats.headshot_3 = 0;
								if (objStats.bulletfired_4 == undefined) objStats.bulletfired_4 = 0;
								if (objStats.bullethit_4 == undefined) objStats.bullethit_4 = 0;
								if (objStats.kills_4 == undefined) objStats.kills_4 = 0;
								if (objStats.headshot_4 == undefined) objStats.headshot_4 = 0;
								if (objStats.bulletfired_5 == undefined) objStats.bulletfired_5 = 0;
								if (objStats.bullethit_5 == undefined) objStats.bullethit_5 = 0;
								if (objStats.kills_5 == undefined) objStats.kills_5 = 0;
								if (objStats.headshot_5 == undefined) objStats.headshot_5 = 0;
								if (objStats.bulletfired_6 == undefined) objStats.bulletfired_6 = 0;
								if (objStats.bullethit_6 == undefined) objStats.bullethit_6 = 0;
								if (objStats.kills_6 == undefined) objStats.kills_6 = 0;
								if (objStats.headshot_6 == undefined) objStats.headshot_6 = 0;
								if (objStats.bulletfired_7 == undefined) objStats.bulletfired_7 = 0;
								if (objStats.bullethit_7 == undefined) objStats.bullethit_7 = 0;
								if (objStats.kills_7 == undefined) objStats.kills_7 = 0;
								if (objStats.headshot_7 == undefined) objStats.headshot_7 = 0;

								objStats.ranked_wl = (objStats.ranked_wins/objStats.ranked_losses).toFixed(3);
								if (!isFinite(objStats.ranked_wl)) objStats.ranked_wl = objStats.ranked_wins;
								objStats.ranked_kd = (objStats.ranked_kills/objStats.ranked_deaths).toFixed(3);
								if (!isFinite(objStats.ranked_kd)) objStats.ranked_kd = objStats.ranked_kills;
								objStats.casual_wl = (objStats.casual_wins/objStats.casual_losses).toFixed(3);
								if (!isFinite(objStats.casual_wl)) objStats.casual_wl = objStats.casual_wins;
								objStats.casual_kd = (objStats.casual_kills/objStats.casual_deaths).toFixed(3);
								if (!isFinite(objStats.casual_kd)) objStats.casual_kd = objStats.casual_kills;

								return resolve(objStats);
							} else
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
var validRegion = ["emea", "ncsa", "apac"];
var defaultLang = "it";
var validParam = ["casual_kd", "ranked_kd", "season_mmr", "season_max_mmr", "casual_wl", "ranked_wl"];
var operatorList = ["Alibi", "Maestro", "Finka", "Lion", "Vigil", "Dokkaebi", "Zofia", "Ela", "Ying", "Lesion", "Mira", "Jackal", "Hibana", "Echo", "Caveira", "Capitao", "Blackbeard", "Valkyrie", "Buck", "Frost", "Mute", "Sledge", "Smoke", "Thatcher", "Ash", "Castle", "Pulse", "Thermite", "Montagne", "Twitch", "Doc", "Rook", "Jager", "Bandit", "Blitz", "IQ", "Fuze", "Glaz", "Tachanka", "Kapkan", "Maverick", "Clash", "Nomad", "Kaid", "Mozzie", "Gridlock", "Nokk", "Warden", "Goyo", "Amaru", "Wamai", "Kali", "Oryx", "Iana", "Ace", "Melusi"];
var seasonList = ["Black Ice", "Dust Line", "Skull Rain", "Red Crow", "Velvet Shell", "Health", "Blood Orchid", "White Noise", "Chimera", "Para Bellum", "Grim Sky", "Wind Bastion", "Burnt Horizon", "Phantom Sight", "Ember Rise", "Shifting Tides", "Void Edge", "Steel Wave"];
var lang_main = [];
var lang_stats = [];
var lang_startme = [];
var lang_only_groups = [];
var lang_changed = [];
var lang_region_changed = [];
var lang_invalid_lang = [];
var lang_invalid_region = [];
var lang_invalid_user = [];
var lang_invalid_user_1 = [];
var lang_default_user_changed = [];
var lang_invalid_user_2 = [];
var lang_invalid_user_3 = [];
var lang_invalid_platform = [];
var lang_invalid_platform_2 = [];
var lang_default_platform_changed = [];
var lang_default = [];
var lang_user_not_found = [];
var lang_user_wrong_platform = [];
var lang_graph_no_data = [];
var lang_graph_no_param = [];
var lang_no_defaultuser = [];
var lang_no_defaultplatform = [];
var lang_news_readall = [];
var lang_news_date = [];
var lang_operator_no_name = [];
var lang_operator_not_found = [];
var lang_help = [];
var lang_config = [];
var lang_config_private = [];
var lang_last_news = [];
var lang_groups = [];
var lang_rank = [];
var lang_time = [];
var lang_update_ok = [];
var lang_update_err = [];
var lang_update_err_2 = [];
var lang_update_err_3 = [];
var lang_config_inline = [];
var lang_disabled = [];

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
var lang_bullets_fired = [];
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
var lang_op_meleekills = [];
var lang_op_headshot = [];
var lang_op_dbno = [];

var lang_title_ranked = [];
var lang_title_casual = [];
var lang_title_general = [];
var lang_title_season = [];
var lang_title_operators = [];

var lang_insert_date = [];
var lang_full_stats = [];

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
var lang_season_invalid = [];
var lang_season_error = [];
var lang_season_not_specified = [];

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
var ability_operatorpvp_kaid_electroclawelectrify = [];
var ability_operatorpvp_nomad_airjabdetonate = [];
var ability_operatorpvp_mozzie_droneshacked = [];
var ability_operatorpvp_gridlock_traxdeployed = [];
var ability_operatorpvp_nokk_observationtooldeceived = [];
var ability_operatorpvp_warden_killswithglasses = [];
var ability_operatorpvp_goyo_volcandetonate = [];
var ability_operatorpvp_amaru_distancereeled = [];
var ability_operatorpvp_kali_gadgetdestroywithexplosivelance = [];
var ability_operatorpvp_wamai_gadgetdestroybymagnet = [];
var ability_operatorpvp_ace_selmadetonate = [];
var ability_operatorpvp_melusi_sloweddown = [];

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
var lang_challenges_invalid_type = [];

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
var lang_team_stats = [];
var lang_team_intro = [];
var lang_team_no_team = [];
var lang_team_notfound = [];
var lang_team_notmembers = [];
var lang_team_numlimit = [];

var lang_search_noplayers = [];
var lang_search_found = [];
var lang_private = [];
var lang_extra_info = [];
var lang_invalid_multiple = [];
var lang_multiple_limit = [];
var lang_dist_noplayers = [];
var lang_dist = [];
var lang_rank_dist = [];

var lang_rank_copper5 = [];
var lang_rank_copper4 = [];
var lang_rank_copper3 = [];
var lang_rank_copper2 = [];
var lang_rank_copper1 = [];
var lang_rank_bronze5 = [];
var lang_rank_bronze4 = [];
var lang_rank_bronze3 = [];
var lang_rank_bronze2 = [];
var lang_rank_bronze1 = [];
var lang_rank_silver5 = [];
var lang_rank_silver4 = [];
var lang_rank_silver3 = [];
var lang_rank_silver2 = [];
var lang_rank_silver1 = [];
var lang_rank_gold3 = [];
var lang_rank_gold2 = [];
var lang_rank_gold1 = [];
var lang_rank_platinum3 = [];
var lang_rank_platinum2 = [];
var lang_rank_platinum1 = [];
var lang_rank_diamond = [];
var lang_rank_champion = [];

var lang_no_validgraph = [];
var lang_report_deactivated = [];
var lang_report_activated = [];
var lang_report_header_week = [];
var lang_report_header_month = [];

var lang_info_notfound = [];
var lang_info_notfound2 = [];
var lang_info_result = [];

var lang_seasons_intro = [];
var lang_season_intro = [];
var lang_rank_data = [];
var lang_search_mates = [];
var lang_search_join = [];
var lang_search_mates_lbl = [];
var lang_search_already = [];
var lang_search_ok = [];
var lang_invalid_find = [];
var lang_seasons_invalid_order = [];

var lang_on = [];
var lang_daily_report_header = [];
var lang_daily_report_activated = [];
var lang_daily_report_deactivated = [];

var lang_inline_invite_join = [];
var lang_inline_invite_title = [];
var lang_inline_invite_desc = [];
var lang_inline_invite_text = [];

var lang_no_history = [];
var lang_history_stdev = [];
var lang_history_mmr = [];
var lang_history_mean = [];
var lang_history_result = [];
var lang_history_result_win = [];
var lang_history_result_lose = [];
var lang_history_date = [];

var lang_scan_error = [];
var lang_scan_limit = [];
var lang_scan_reply = [];
var lang_scan_photo = [];
var lang_scan_video = [];
		
var lang_contest_invalid_username = [];
var lang_contest_already_linked = [];
var lang_contest_done = [];
var lang_contest_invalid_date = [];
var lang_contest_username_me = [];

var lang_check_res = [];
var lang_check_yes = [];
var lang_check_no = [];

var lang_nickhistory_nodata = [];
var lang_nickhistory_nochange = [];
var lang_nickhistory_title = [];
var lang_nickhistory_actual = [];

var lang_avatar_param = [];
var lang_avatar_photo = [];
var lang_avatar_size = [];

var lang_unavailable = [];
var lang_status_maintenance = [];
var lang_status_online = [];
var lang_status_interrupted = [];
var lang_status_degraded = [];

var lang_maprank_error = [];
var lang_reddit = [];
var lang_twitch = [];
var lang_twitch_live = [];
var lang_twitch_view = [];
var lang_youtube = [];
var lang_noparam = [];
				
var lang_weapon_title = [];
var lang_weapon_assault = [];
var lang_weapon_submachine = [];
var lang_weapon_marksman = [];
var lang_weapon_shotgun = [];
var lang_weapon_handgun = [];
var lang_weapon_lightmachine = [];
var lang_weapon_machinepistol = [];
var lang_weapon_precision = [];

lang_main["it"] = "Benvenuto in <b>Rainbow Six Siege Stats</b>! [Available also in english! 🇺🇸]\n\nUsa '/stats username,piattaforma' per visualizzare le informazioni del giocatore, per gli altri comandi digita '/' e visualizza i suggerimenti. Funziona anche inline!";
lang_main["en"] = "Welcome to <b>Rainbow Six Siege Stats</b>! [Disponibile anche in italiano! 🇮🇹]\n\nUse '/stats username,platform' to print player infos, to other commands write '/' and show hints. It works also inline!";
lang_stats["it"] = "%n operatori registrati, %s statistiche memorizzate in %g gruppi diversi";
lang_stats["en"] = "%n operators registered, %s stats saved in %g different groups";
lang_startme["it"] = "Questo comando necessita della configurazione del giocatore con nome utente e piattaforma\nClicca il pulsante per configurare il bot e poter utilizzare il comando";
lang_startme["en"] = "This command needs player configuration with username and platform\nClick the button to configure bot and use the command";
lang_only_groups["it"] = "Questo comando funziona solo nei gruppi";
lang_only_groups["en"] = "This command work only in groups";
lang_changed["it"] = "Lingua modificata!";
lang_changed["en"] = "Language changed!";
lang_region_changed["it"] = "Regione modificata!";
lang_region_changed["en"] = "Region changed!";
lang_invalid_lang["it"] = "Lingua non valida. Lingue disponibili: ";
lang_invalid_lang["en"] = "Invalid language. Available languages: ";
lang_invalid_region["it"] = "Regione non valida. Regioni disponibili: ";
lang_invalid_region["en"] = "Invalid region. Available regions:";
lang_invalid_user["it"] = "Nome utente non specificato, esempio: '/stats username,piattaforma' (uplay, xbl o psn).";
lang_invalid_user["en"] = "Username not specified, example: '/stats username,platform' (uplay, xbl or psn).";
lang_invalid_user_1["it"] = "Nome utente non valido.";
lang_invalid_user_1["en"] = "Invalid username.";
lang_default_user_changed["it"] = "Nome utente predefinito modificato!";
lang_default_user_changed["en"] = "Default username changed!";
lang_invalid_user_2["it"] = "Username non specificati, esempio: '/compare username1,username2'.";
lang_invalid_user_2["en"] = "Username not specified, example: '/compare username1,username2'.";
lang_invalid_user_3["it"] = "Username non specificati, esempio: '/canplay username1,username2'.";
lang_invalid_user_3["en"] = "Username not specified, example: '/canplay username1,username2'.";
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
lang_user_wrong_platform["it"] = "L'utente inserito non corrisponde alla piattaforma specificata, riprova cambiandola.";
lang_user_wrong_platform["en"] = "Inserted user not match specified platform, retry by change it.";
lang_graph_no_data["it"] = "Non ci sono abbastanza dati salvati per creare un grafico, usa /stats per salvarli.";
lang_graph_no_data["en"] = "Not enough data saved found to create a graph, use /stats to save more.";
lang_graph_no_param["it"] = "Parametro non valido. Parametri disponibili: ";
lang_graph_no_param["en"] = "Invalid parameter. Available parameters: ";
lang_no_defaultuser["it"] = "Usa '/setusername nome utente' prima di usare questo comando.";
lang_no_defaultuser["en"] = "Use '/setusername user name' before use this command.";
lang_no_defaultplatform["it"] = "Usa '/setplatform piattaforma' (uplay, xbl o psn) prima di usare questo comando.";
lang_no_defaultplatform["en"] = "Use '/setplatform platform' (uplay, xbl or psn) before use this command.";
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
	"> '/scan - Scansiona lo screenshot di una classifica e visualizza le statistiche dei giocatori (solo PC, sperimentale).\n" +
	"> '/update' - Forza l'aggiornamento delle statistiche del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/operators <ordinamento>' - Permette di visualizzare la lista completa degli operatori del giocatore specificato utilizzando /setusername e /setplatform inviandola in privato.\n" +
	"> '/operator <nome-operatore>' - Permette di visualizzare i dettagli di un solo operatore specificato come parametro utilizzando /setusername e /setplatform.\n" +
	"> '/season <nome-stagione>' - Permette di visualizzare i punteggi relativi alla stagione indicata del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/seasons' - Permette di visualizzare la lista completa del rango massimo ottenuto in tutte le stagioni del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/rank' - Permette di visualizzare il rango attuale del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/history' - Permette di visualizzare i risultati delle ultime partite del giocatore specificato utilizzando /setusername e /setplatform.\n" +
	"> '/userhistory' - Permette di visualizzare la cronologia dei cambiamenti al proprio nickname da quando si utilizza il bot.\n" +
	"> '/compare <username1>,<username2>' - Permette di confrontare le statistiche di due giocatori.\n" +
	"> '/canplay <username1>,<username2>' - Permette di verificare se due giocatori possono giocare insieme in classificata.\n" +
	"> '/graph <parametro>' - Genera un grafico per il parametro specificato.\n" +
	"> '/lastgraph' - Genera un grafico utilizzando l'ultimo parametro usato.\n" +
	"> '/loadout <nome-operatore>' - Suggerisce un equipaggiamento per l'operatore specificato.\n" +
	"> '/status <piattaforma>' - Permette di visualizzare lo status ufficiale dei server di gioco.\n" +
	"> '/news <numero>' - Permette di visualizzare le ultime news ufficiali del gioco reperite da Steam.\n" +
	"> '/avatar <testo>' - Crea un avatar personalizzato con logo e bandiera della lingua usando il comando in risposta ad un immagine quadrata (puoi anche usare \\n per andare a capo).\n" +
	"> '/challenges <tipo>' - Permette di visualizzare le sfide settimanali in corso, eventualmente con il tipo di sfida.\n" +
	"> '/lang <lingua>' - Imposta la lingua del bot.\n" +
	"> '/region <regione>' - Imposta la regione del giocatore.\n" +
	"> '/setusername <username>' - Imposta il nome utente di default necessario per alcune funzioni.\n" +
	"> '/setplatform <piattaforma>' - Imposta la piattaforma di default necessaria per alcune funzioni.\n" +
	"> '/r6info' - (in risposta) Consente di visualizzare le informazioni salvate dell'utente come username e piattaforma.\n" +
	"> '/find <piattaforma>' - Crea un messaggio dove gli altri giocatori possono partecipare rendendosi disponibili.\n" +
	"> '/dist' - Visualizza la lista della distribuzione giocatori per piattaforma del gruppo attuale.\n" +
	"> '/distrank' - Visualizza la lista della distribuzione rango tra tutti i giocatori memorizzati.\n" +
	"> '/team <nome-team> <utenti>' - Crea un team e fornisce la possibilità di taggarne tutti i membri.\n" +
	"> '/search <piattaforma>' - Invia in privato un messaggio con tutti i nomi in game degli utenti relativi alla lingua ed alla piattaforma inserita.\n" +
	"> '/setreport' - Attiva o disattiva il report statistiche del gruppo in cui si è usato /stats l'ultima volta.\n" +
	"> '/setdailyreport' - Attiva o disattiva il report statistiche giornaliero del giocatore.\n" +
	"> '/botconfig' - Mostra la guida per la prima configurazione del bot.\n" +
	"\nE' possibile utilizzare il bot anche *inline* inserendo username e piattaforma come per il comando /stats oppure invitare qualcuno nel gruppo italiano!\n\nPer ulteriori informazioni contatta @fenix45.";
lang_help["en"] = 	"*Commands tutorial:*\n" +
	"> '/stats <username>,<platform>' - Allow to print a complete stats list of user specified in command parameters. Is possibile to omit params if they has been saved with /setusername and /setplatform.\n" +
	"> '/mstats <username1>,<username2>,etc. - Allow to print a short stats for multiple specified users.\n" +
	"> '/scan - Scan a leaderboard screenshot and show stats of players (only PC, experimental).\n" +
	"> '/update' - Force update of user stats of player specified using /setusername and /setplatform.\n" +
	"> '/operators <order-method>' - Allow to print a complete operators list of player specified using /setusername and /setplatform.\n" +
	"> '/operator <operator-name>' - Allow to print operator details specified as parameter using /setusername and /setplatform sending it in private mode.\n" +
	"> '/season <season-name>' - Allow to print season details specified as parameter using /setusername and /setplatform..\n" +
	"> '/seasons' - Allow to print seasons max ranks details specified as parameter using /setusername and /setplatform.\n" +
	"> '/rank' - Allow to print rank specified as parameter using /setusername and /setplatform.\n" +
	"> '/history' - Allow to print match history specified as parameter using /setusername and /setplatform.\n" +
	"> '/userhistory' - Allow to show username changes history from bot starts.\n" +
	"> '/compare <username1>,<username2>' - Allow to compare two players stats.\n" +
	"> '/canplay <username1>,<username2>' - Allow to check if two players can play together in ranked.\n" +
	"> '/graph <parameter>' - Generate a graph using parameter specified.\n" +
	"> '/lastgraph' - Generate a graph using last parameter used.\n" +
	"> '/loadout <operator-name>' - Suggest a full loadout for specified operator.\n" +
	"> '/status <platform>' - Allow to print official server status of the game.\n" +
	"> '/news <number>' - Allow to print latest official news of the game wrote by Steam.\n" +
	"> '/avatar <text>' - Generate a custom avatar with language flag and logo using command in reply to a squared image (you can use \\n to make a newline).\n" +
	"> '/challenges <type>' - Allow to print current weekly challenges, eventually with the challenge type.\n" +
	"> '/lang <language>' - Change bot language.\n" +
	"> '/region <region>' - Change player region.\n" +
	"> '/setusername <username>' - Change default username to use some functions.\n" +
	"> '/setplatform <platform>' - Change default platform to use some functions.\n" +
	"> '/r6info' - (in reply) Allow to show infos about saved user like username and platform.\n" +
	"> '/find <platform>' - Make a message where other player can join.\n" +
	"> '/dist' - Show platform distribution for platforms for actual group.\n" +
	"> '/distrank' - Show rank distribution for all saved players.\n" +
	"> '/team <team-name> <users>' - Create a team and offer the possibility to tag all members.\n" +
	"> '/search <platform>' - Send in private a message with name of users found with selected language and platform.\n" +
	"> '/setreport' - Active or deactive stats report in group where you have used /stats last time.\n" +
	"> '/setdailyreport' - Active or deactive user daily stats report.\n" +
	"> '/botconfig' - Show guide for bot's first configuration.\n" +
	"\nYou can also use the *inline mode* providing username and platform like /stats command!\n\nFor informations contact @fenix45.";
lang_config["it"] = "⚙️ Guida alla prima configurazione del bot ⚙️\n\nLe parole scritte in *grassetto* sono comandi, mentre quelle in _corsivo_ sono i campi da inserire\n\n1. Prima di tutto avvia il bot IN PRIVATO (cliccando qui >> @R6SiegeStatsBot);\n2. Scrivi: '*/setusername*' con a seguire, nello stesso messaggio, il tuo username del gioco (quindi */setusername* _USERNAME_);\n3. '*/setplatform*' con a seguire la piattaforma. Le piattaforme sono: pc, xbox e ps4 (quindi */setplatform* _PIATTAFORMA_);\n4. Dopo aver fatto ciò, il bot avrà salvato il tuo username e la tua piattaforma e basterà inviare '*/stats*' per visualizzare le statistiche.\n\nPer visualizzare le stats di un altro utente senza rifare la procedura, basta inviare un messaggio con questo formato:\n*/stats* _USERNAME_,_PIATTAFORMA_.";
lang_config["en"] = "⚙️ Bot's first configuration - Written guide ⚙️\n\nWords that are written in *bold* are commands and those in _italics_ are the fields to be inserted.\n\n1. First of all, start the bot IN PRIVATE CHAT (clicking here >> @R6SiegeStatsBot);\n2. Now write: '*/setusername*' and then, in the same message, your game username (*/setusername* _USERNAME_)\n3. Then write: '*/setplatform*' and the platform where you play. There are 3 different platforms: pc, xbox and ps4 (*/setplatform* _PLATFORM_);\n4. After doing this, the bot  will have your username and your platform saved. From now on you will only need to send a '*/stats*' to view your in-game statistics.\n\nTo view the statistics of another player without redoing the procedure, just send a message with this format:\n*/stats* _USERNAME_, _PLATFORM_.";
lang_config_private["it"] = "⚙️ Guida alla prima configurazione del bot ⚙️\n\nLe parole scritte in *grassetto* sono comandi, mentre quelle in _corsivo_ sono i campi da inserire\n\n1. Scrivi: '*/setusername*' con a seguire, nello stesso messaggio, il tuo username del gioco (quindi */setusername* _USERNAME_);\n2. '*/setplatform*' con a seguire la piattaforma. Le piattaforme sono: pc, xbox e ps4 (quindi */setplatform* _PIATTAFORMA_);\n3. Dopo aver fatto ciò, il bot avrà salvato il tuo username e la tua piattaforma e basterà inviare '*/stats*' per visualizzare le statistiche.\n\nPer visualizzare le stats di un altro utente senza rifare la procedura, basta inviare un messaggio con questo formato:\n*/stats* _USERNAME_,_PIATTAFORMA_.";
lang_config_private["en"] = "⚙️ Bot's first configuration - Written guide ⚙️\n\nWords that are written in *bold* are commands and those in _italics_ are the fields to be inserted.\n\n1. Now write: '*/setusername*' and then, in the same message, your game username (*/setusername* _USERNAME_)\n2. Then write: '*/setplatform*' and the platform where you play. There are 3 different platforms: pc, xbox and ps4 (*/setplatform* _PLATFORM_);\n3. After doing this, the bot  will have your username and your platform saved. From now on you will only need to send a '*/stats*' to view your in-game statistics.\n\nTo view the statistics of another player without redoing the procedure, just send a message with this format:\n*/stats* _USERNAME_, _PLATFORM_.";
lang_last_news["it"] = 	"<b>Ultimi aggiornamenti:</b>\n" +
	"11/08/20 - Aggiunto il comando /weapons\n" +
	"23/06/20 - Aggiornato con il supporto a Steel Wave\n" +
	"24/03/20 - Aggiunto il comando /distrank\n" +
	"09/03/20 - Aggiunta la possibilità di cambiare regione\n" +
	"20/02/20 - Aggiornato con il supporto parziale a Void Edge\n" +
	"11/02/20 - Accorciate le statistiche del comando /stats, quelle complete sono comunque visibili con il nuovo comando /fullstats\n" +
	"10/02/20 - Migliorato il report settimanale e mensile dei giocatori nel gruppo\n" +
	"03/02/20 - Aggiunto il comando /maprank per visualizzare il corrispondente rango al mmr specificato\n" +
	"13/01/20 - Aggiornato con il supporto completo ad Shifting Tides\n" +
	"15/11/19 - Aggiunto il comando /avatar per generare un avatar personalizzato";
lang_last_news["en"] = 	"<b>Latest updates:</b>\n" +
	"08/11/20 - Added /weapons command\n" +
	"06/23/20 - Updated with Steel Wave support\n" +
	"03/24/20 - Added /distrank command\n" +
	"03/09/20 - Added support for different regions\n" +
	"02/20/20 - Updated with Void Eddge partial support\n" +
	"02/11/20 - Reduced stats of /stats command, full stats are in the new /fullstats command\n" +
	"02/10/20 - Improved weekly and monthly report for players in group\n" +
	"02/03/20 - Added /maprank command to show relative tank to specified mmr\n" +
	"01/13/20 - Updated with Shifting Tides complete support\n" +
	"11/15/19 - Added /avatar command to generate a custom avatar";
lang_groups["it"] = "<b>Gruppi affiliati</b>\n\nGruppo italiano: <a href='https://t.me/Rainbow6SItaly'>Rainbow Six Siege Italy</a>\nGruppo inglese: non disponibile";
lang_groups["en"] = "<b>Affiliates groups</b>\n\nItalian group: <a href='https://t.me/Rainbow6SItaly'>Rainbow Six Siege Italy</a>\nEnglish group: not available";
lang_rank["it"] = "Classifica per rapporto U/M in Classificata per questo gruppo:";
lang_rank["en"] = "Leaderboard for ranked K/D for this group:";
lang_time["it"] = "Ultimo aggiornamento:";
lang_time["en"] = "Last update:";
lang_update_ok["it"] = "Al prossimo '/stats' il tuo profilo verrà aggiornato!";
lang_update_ok["en"] = "At next '/stats' your profile will be updated!";
lang_update_err["it"] = "Puoi aggiornare il profilo manualmente solo ogni 3 ore";
lang_update_err["en"] = "You can update your profile only every 3 hours";
lang_update_err_2["it"] = "Il tuo profilo è già pronto per l'aggiornamento";
lang_update_err_2["en"] = "Your profile is already prepared for update";
lang_update_err_3["it"] = "Puoi aggiornare il profilo manualmente solo ogni 3 ore dalle ultime stats salvate";
lang_update_err_3["en"] = "You can update your profile only every 3 hours after last saved stats";
lang_config_inline["it"] = "Configura il bot";
lang_config_inline["en"] = "Configure bot";
lang_disabled["it"] = "Questo comando è temporaneamente disabilitato";
lang_disabled["en"] = "This command is temporarily disabled";

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
lang_op_meleekills["it"] = "Corpo a corpo";
lang_op_meleekills["en"] = "Melee kills";
lang_op_headshot["it"] = "Colpi in testa";
lang_op_headshot["en"] = "Headshots";
lang_op_dbno["it"] = "Atterramenti";
lang_op_dbno["en"] = "DBNOs";

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
lang_full_stats["it"] = "Per visualizzare le statistiche complete usa /fullstats"
lang_full_stats["en"] = "To show full stats use /fullstats"

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
lang_season_invalid["it"] = "Stagione non valida, riprova.";
lang_season_invalid["en"] = "Invalid season, try again.";
lang_season_error["it"] = "Errore, impossibile recuperare i dati della stagione. I dati precedenti all'Operazione Health non vengono forniti da Ubisoft.";
lang_season_error["en"] = "Error, unable to get season data. Previous data from Operation Health are not provided by Ubisoft.";
lang_season_not_specified["it"] = "Stagione non specificata, riprova.";
lang_season_not_specified["en"] = "Season not specified, try again.";

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
ability_operatorpvp_kaid_electroclawelectrify["it"] = "Elettroartigli lanciati";
ability_operatorpvp_kaid_electroclawelectrify["en"] = "Electroclaw throwed";
ability_operatorpvp_nomad_airjabdetonate["it"] = "Airjab esplosi";
ability_operatorpvp_nomad_airjabdetonate["en"] = "Airjab detonated";
ability_operatorpvp_mozzie_droneshacked["it"] = "Droni hackerati";
ability_operatorpvp_mozzie_droneshacked["en"] = "Drones hacked";
ability_operatorpvp_gridlock_traxdeployed["it"] = "Trax piazzati";
ability_operatorpvp_gridlock_traxdeployed["en"] = "Trax deployed";
ability_operatorpvp_nokk_observationtooldeceived["it"] = "Videocamere disturbate";
ability_operatorpvp_nokk_observationtooldeceived["en"] = "Deceived cameras";
ability_operatorpvp_warden_killswithglasses["it"] = "Uccisioni con abilità";
ability_operatorpvp_warden_killswithglasses["en"] = "Kills during ability";
ability_operatorpvp_goyo_volcandetonate["it"] = "Volcan detonati";
ability_operatorpvp_goyo_volcandetonate["en"] = "Detonated Volcan";
ability_operatorpvp_amaru_distancereeled["it"] = "Distanza percorsa in volo";
ability_operatorpvp_amaru_distancereeled["en"] = "Distance reeled";
ability_operatorpvp_kali_gadgetdestroywithexplosivelance["it"] = "Gadget distrutti con la lancia esplosiva";
ability_operatorpvp_kali_gadgetdestroywithexplosivelance["en"] = "Gadget destroyed with explosive lance";
ability_operatorpvp_wamai_gadgetdestroybymagnet["it"] = "Gadget distrutti con il magnet";
ability_operatorpvp_wamai_gadgetdestroybymagnet["en"] = "Gadget destroyed with magnet";
ability_operatorpvp_ace_selmadetonate["it"] = "Cariche SELMA detonate";
ability_operatorpvp_ace_selmadetonate["en"] = "SELMA charges detonated";
ability_operatorpvp_melusi_sloweddown["it"] = "Nemici rallentati";
ability_operatorpvp_melusi_sloweddown["en"] = "Enemies slowed down";

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
lang_challenges_invalid_type["it"] = "Tipo non valido. Tipi disponibili: ";
lang_challenges_invalid_type["en"] = "Invalid type. Available types: ";

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
lang_team_stats["it"] = "visualizza le stats del suo team";
lang_team_stats["en"] = "show his teammates stats";
lang_team_intro["it"] = "Benvenuto nella gestione dei <b>Team</b>.\nI team sono legati al gruppo in cui si creano.\n\nPuoi crearlo ed aggiungere utenti con:\n/addteam <i>nome_team</i> <i>nickname,nickname,nickname</i>\nCreandolo ne sarai il leader\n\nPuoi rimuovere gli utenti con:\n/delteam <i>nome_team</i> <i>nickname,nickname,nickname</i>\nQuando un team non ha più utenti viene cancellato\n\nPer taggare tutti i compagni di team:\n/ttag <i>nome_team</i>\n\nPer ottenere statistiche abbreviate di tutti i compagni di team:\n/tstats <i>nome_team</i>\nDopo 15 giorni che non viene taggato o richieste le statistiche, il team viene cancellato\n\n<b>Team creati:</b>";
lang_team_intro["en"] = "Welcome to <b>Team</b> manage.\nTeams are linked with groups where they are created.\n\nYou can create it and add users with:\n/addteam <i>team_name</i> <i>nickname,nickname,nickname</i>\nCreating it you will be the leader\n\nYou can remove users with:\n/delteam <i>team_name</i> <i>nickname,nickname,nickname</i>\nWhen a team have no more users it will be deleted\n\nYou can tag all your teammates with:\n/ttag <i>team_name</i>\n\nYou can show all teammates stats with:\n/tstats <i>team_name</i>\nAfter 15 days that a team has not been tagged or showed stats, it will be automatically deleted\n\nCreated teams:";
lang_team_no_team["it"] = "Non hai creato nessun team";
lang_team_no_team["en"] = "No teams created";
lang_team_notfound["it"] = "Il gruppo inserito non esiste";
lang_team_notfound["en"] = "Group specified not exists";
lang_team_notmembers["it"] = "Nessun utente del team è associato al bot, riprova dopo aver fatto usare loro il comando /stats almeno una volta";
lang_team_notmembers["en"] = "No team user linked to bot, retry after use of command /stats at least once";
lang_team_numlimit["it"] = "Puoi visualizzare le statistiche al massimo di un team composto da 5 membri";
lang_team_numlimit["en"] = "You can show stats for a team of maximum 5 members";

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
lang_dist_noplayers["it"] = "Non ci sono giocatori collegati a questo gruppo";
lang_dist_noplayers["en"] = "No players linked at this group";
lang_dist["it"] = "Distribuzione giocatori memorizzati per questo gruppo";
lang_dist["en"] = "Distribution of saved players for this group";
lang_rank_dist["it"] = "Distribuzione rango giocatori memorizzati";
lang_rank_dist["en"] = "Rank distribution of saved players";

lang_rank_copper5["it"] = "Rame V";
lang_rank_copper5["en"] = "Copper V";
lang_rank_copper4["it"] = "Rame IV";
lang_rank_copper4["en"] = "Copper IV";
lang_rank_copper3["it"] = "Rame III";
lang_rank_copper3["en"] = "Copper III";
lang_rank_copper2["it"] = "Rame II";
lang_rank_copper2["en"] = "Copper II";
lang_rank_copper1["it"] = "Rame I";
lang_rank_copper1["en"] = "Copper I";
lang_rank_bronze5["it"] = "Bronzo V";
lang_rank_bronze5["en"] = "Bronze V";
lang_rank_bronze4["it"] = "Bronzo IV";
lang_rank_bronze4["en"] = "Bronze IV";
lang_rank_bronze3["it"] = "Bronzo III";
lang_rank_bronze3["en"] = "Bronze III";
lang_rank_bronze2["it"] = "Bronzo II";
lang_rank_bronze2["en"] = "Bronze II";
lang_rank_bronze1["it"] = "Bronzo I";
lang_rank_bronze1["en"] = "Bronze I";
lang_rank_silver5["it"] = "Argento V";
lang_rank_silver5["en"] = "Silver V";
lang_rank_silver4["it"] = "Argento IV";
lang_rank_silver4["en"] = "Silver IV";
lang_rank_silver3["it"] = "Argento III";
lang_rank_silver3["en"] = "Silver III";
lang_rank_silver2["it"] = "Argento II";
lang_rank_silver2["en"] = "Silver II";
lang_rank_silver1["it"] = "Argento I";
lang_rank_silver1["en"] = "Silver I";
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
lang_rank_champion["it"] = "Campione";
lang_rank_champion["en"] = "Champion";

lang_no_validgraph["it"] = "Utilizza almeno una volta il comando /graph prima di utilizzare /lastgraph";
lang_no_validgraph["en"] = "Use at least once the command /graph before using /lastgraph";
lang_report_activated["it"] = "Report gruppo attivato";
lang_report_activated["en"] = "Group report activated";
lang_report_deactivated["it"] = "Report gruppo disattivato";
lang_report_deactivated["en"] = "Group report deactivated";
lang_report_header_month["it"] = "Migliori giocatori del mese per questo gruppo";
lang_report_header_month["en"] = "Best players of the month for this group";
lang_report_header_week["it"] = "Migliori giocatori della settimana per questo gruppo";
lang_report_header_week["en"] = "Best players of the week for this group";

lang_info_notfound["it"] = "Utente non trovato";
lang_info_notfound["en"] = "User not found";
lang_info_notfound2["it"] = "Il nome utente e la piattaforma per l'utente selezionato non sono state memorizzate";
lang_info_notfound2["en"] = "Default username and platform for selected user are not memorized";
lang_info_result["it"] = "Informazioni R6 per";
lang_info_result["en"] = "R6 infos for";

lang_seasons_intro["it"] = "<b>Classificazioni stagioni:</b>\n\n";
lang_seasons_intro["en"] = "<b>Seasons ranking:</b>\n\n";
lang_season_intro["it"] = "Classificazione";
lang_season_intro["en"] = "Ranking";

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
lang_seasons_invalid_order["it"] = "Ordinamento non valido, ordinamenti disponibili: ";
lang_seasons_invalid_order["en"] = "Invalid sort, available sorting method: ";

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
lang_inline_invite_text["it"] = "🇮🇹 Entra nel gruppo *Rainbow Six Siege Italy*! 🇮🇹\n\nConfronta le tue statistiche con altri giocatori provenienti da tutte le piattaforme 🎮, forma team 👥, discuti aggiornamenti 💬, partecipa a contest 💰 e tanto altro!\n\n🔥 Ti aspettiamo 🔥";
lang_inline_invite_text["en"] = "English version not available";

lang_no_history["it"] = "Nessun dato storico da poter visualizzare";
lang_no_history["en"] = "No historical data to show";
lang_history_stdev["it"] = "Deviazione standard";
lang_history_stdev["en"] = "Standard deviation";
lang_history_mmr["it"] = "Variazione MMR";
lang_history_mmr["en"] = "MMR variation";
lang_history_mean["it"] = "Variazione media";
lang_history_mean["en"] = "Mean variation";
lang_history_result["it"] = "Esito partita";
lang_history_result["en"] = "Match result";
lang_history_result_win["it"] = "Vittoria";
lang_history_result_win["en"] = "Victory";
lang_history_result_lose["it"] = "Sconfitta";
lang_history_result_lose["en"] = "Defeat";
lang_history_date["it"] = "Data partita";
lang_history_date["en"] = "Match date";

lang_scan_error["it"] = "Nessun giocatore trovato nell'immagine scansionata";
lang_scan_error["en"] = "No players found in scanned image";
lang_scan_limit["it"] = "E' possibile ottenere informazioni solamente solo su 10 giocatori alla volta";
lang_scan_limit["en"] = "Is possibile to get infos only for 10 players at time";
lang_scan_photo["it"] = "Il comando deve essere utilizzato in risposta su una foto (non inviata come documento)";
lang_scan_photo["en"] = "This command should be used in reply on a photo (not sent as document)";
lang_scan_video["it"] = "Il comando deve essere utilizzato in risposta su un video MP4";
lang_scan_video["en"] = "This command should be used in reply on a MP4 video";

lang_contest_invalid_username["it"] = "Nome utente non valido";
lang_contest_invalid_username["en"] = "Invalid username";
lang_contest_already_linked["it"] = "Hai già utilizzato un comando contest con un utente";
lang_contest_already_linked["en"] = "You have already linked a username";
lang_contest_done["it"] = "Partecipazione completata!";
lang_contest_done["en"] = "Submission completed!";
lang_contest_invalid_date["it"] = "Puoi utilizzare questo comando solo il giorno di accesso al gruppo";
lang_contest_invalid_date["en"] = "You can use this command only during same day as group access";
lang_contest_username_me["it"] = "Non puoi inserire te stesso";
lang_contest_username_me["en"] = "You can't insert yourself";

lang_check_res["it"] = "Può <i>%a</i> giocare con <i>%b</i> in classificata?\n\n<b>%c</b>\n\nLa differenza di MMR è <b>%d</b>!";
lang_check_res["en"] = "Can <i>%a</i> play with <i>%b</i> on ranked?\n\n<b>%c</b>\n\nMMR difference is <b>%d</b>!";
lang_check_yes["it"] = "SI!";
lang_check_yes["en"] = "YES!";
lang_check_no["it"] = "NO :(";
lang_check_no["en"] = "NO :(";
				
lang_nickhistory_nodata["it"] = "Non ci sono abbastanza dati salvati nel database per ottenere questa informazione";
lang_nickhistory_nodata["en"] = "There are no enough data saved to database to get this information";
lang_nickhistory_nochange["it"] = "Sembra che tu non abbia mai cambiato il tuo username da quando usi il bot...";
lang_nickhistory_nochange["en"] = "Seems that you have never changed your username from bot starts...";
lang_nickhistory_title["it"] = "Storia dei tuoi username";
lang_nickhistory_title["en"] = "Your usernames history";
lang_nickhistory_actual["it"] = "Attuale";
lang_nickhistory_actual["en"] = "Actual";

lang_avatar_param["it"] = "Specifica il testo che vuoi inserire nell'immagine";
lang_avatar_param["en"] = "Specify text you want to insert in the image";
lang_avatar_photo["it"] = "Il comando deve essere utilizzato in risposta su una foto (non inviata come documento)";
lang_avatar_photo["en"] = "This command should be used in reply on a photo (not sent as document)";
lang_avatar_size["it"] = "L'immagine deve essere quadrata";
lang_avatar_size["en"] = "Image must be squared";

lang_unavailable["it"] = "Le API sono state temporaneamente disabilitate da Ubisoft.";
lang_unavailable["en"] = "Ubisoft's API are temporary disabled by Ubisoft.";
lang_status_maintenance["it"] = "Manutenzione";
lang_status_maintenance["en"] = "Maintenance";
lang_status_online["it"] = "Online";
lang_status_online["en"] = "Online";
lang_status_interrupted["it"] = "Interrotto";
lang_status_interrupted["en"] = "Interrupted";
lang_status_degraded["it"] = "Degradato";
lang_status_degraded["en"] = "Degraded";

lang_maprank_error["it"] = "Specifica il valore MMR dopo il comando /maprank";
lang_maprank_error["en"] = "Insert MMR value after /maprank command";
lang_reddit["it"] = "Pubblicato da ";
lang_reddit["en"] = "Published by ";
lang_twitch["it"] = " ha pubblicato un link ad un canale Twitch: ";
lang_twitch["en"] = " has published a Twitch channel link: ";
lang_twitch_live["it"] = " è in LIVE";
lang_twitch_live["en"] = " is LIVE";
lang_twitch_view["it"] = "Guarda su Twitch";
lang_twitch_view["en"] = "View on Twitch";
lang_youtube["it"] = " ha pubblicato un link ad un canale Youtube: ";
lang_youtube["en"] = " has published a Youtube channel link: ";
lang_noparam["it"] = "Questo comando può essere utilizzato solo salvando i dati del tuo giocatore, usa il comando /botconfig per continuare";
lang_noparam["en"] = "This command must be used only saving player's data, use /botconfig command to continue";
				
lang_weapon_title["it"] = "Statistiche armi";
lang_weapon_title["en"] = "Weapon stats";
lang_weapon_assault["it"] = "Fucile d'Assalto";
lang_weapon_assault["en"] = "Assault Rifle";
lang_weapon_submachine["it"] = "Mitraglietta";
lang_weapon_submachine["en"] = "Submachine Gun";
lang_weapon_marksman["it"] = "Fucile da Cecchino";
lang_weapon_marksman["en"] = "Marksman Rifle";
lang_weapon_shotgun["it"] = "Fucile a pompa";
lang_weapon_shotgun["en"] = "Shotgun";
lang_weapon_handgun["it"] = "Pistola";
lang_weapon_handgun["en"] = "Handgun";
lang_weapon_lightmachine["it"] = "Mitragliatrice Leggera";
lang_weapon_lightmachine["en"] = "Light Machine Gun";
lang_weapon_machinepistol["it"] = "Pistola Mitragliatrice";
lang_weapon_machinepistol["en"] = "Machine Pistol";
lang_weapon_precision["it"] = "Precisione colpi in testa";
lang_weapon_precision["en"] = "Precision headshots";

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

bot.onText(/^\/start (.+)|^\/start/i, function (message, match) {
	var options = {disable_web_page_preview: true, parse_mode: "HTML", reply_to_message_id: message.message_id};
	/*
	if ((message.chat.id < 0) && (message.text.indexOf("@") != -1) && (message.text.indexOf("r6siegestatsbot") == -1))
		return;
	*/
	
	if (message.chat.id == r6italy_chatid) {
		if (match[1] != undefined) {
			var opt = {parse_mode: "Markdown", reply_to_message_id: message.message_id};
			bot.sendMessage(message.from.id, "Il comando corretto per richiamare le statistiche è */stats*, riprova.", opt);
		}
	}
	
	if (message.chat.id < 0)
		return;

	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		var lang = defaultLang;
		if (message.from.language_code != undefined){
			if (validLang.indexOf(message.from.language_code) != -1)
				lang = message.from.language_code;
		}
		var default_text = "";
		if (Object.keys(rows).length == 0){
			connection.query("INSERT INTO user (account_id, lang, region) VALUES (" + message.from.id + ", '" + lang + "', 'emea')", function (err, rows) {
				if (err) throw err;
				var nick = "";
				if (message.from.username == undefined)
					nick = message.from.first_name;
				else
					nick = message.from.username;
				
				console.log(getNow("it") + " New user " + nick + " (" + message.from.id + " - " + lang + ")");
			});
		}else{
			lang = rows[0].lang;
			if ((rows[0].default_username != null) || (rows[0].default_platform != null) || (rows[0].region != null)) {
				default_text = "\n" + lang_default[lang];
				
				var params = [];
				if (rows[0].default_username != null)
					params.push(rows[0].default_username);
				else if (rows[0].default_platform != null)
					params.push(rows[0].default_platform);
				else if (rows[0].region != null)
					params.push(rows[0].region);
				
				default_text += params.join(", ");
			}
		}

		if (match[1] != undefined) {
			if (match[1] == "config") {
				var opt = {parse_mode: "Markdown", reply_to_message_id: message.message_id};
				bot.sendMessage(message.from.id, lang_config_private[lang], opt);
				return;
			}
		}

		var last_news = "";
		if (lang_last_news[lang] != "")
			last_news = "\n" + lang_last_news[lang] + "\n";

		connection.query("SELECT COUNT(1) As cnt FROM user UNION SELECT COUNT(1) As cnt FROM player_history UNION SELECT COUNT(DISTINCT last_chat_id) As cnt FROM user", function (err, rows) {
			if (err) throw err;

			var stats_text = "\n" + lang_stats[lang];
			stats_text = stats_text.replace("%n", formatNumber(rows[0].cnt, lang));
			stats_text = stats_text.replace("%s", formatNumber(rows[1].cnt, lang));
			stats_text = stats_text.replace("%g", formatNumber(rows[2].cnt, lang));

			fs.stat("r6stats.js", function(err, stats){
				var time = new Date(stats.mtime);
				var time_text = "\n<i>" + lang_time[lang] + " " + toDate(lang, time) + "</i>";

				bot.sendMessage(message.chat.id, lang_main[lang] + "\n" + default_text + last_news + stats_text + time_text, options);
			});
		});
	});
});

bot.on('message', function (message) {
	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status != "creator") && (data.status != "administrator")) {
			capture_parse(message);
			contest_group(message);
			capture_url(message);
		}
	});
	capture_reddit(message);
});

bot.on('edited_message', function (message) {
	bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
		if ((data.status != "creator") && (data.status != "administrator")) {
			capture_parse(message);
			capture_url(message);
		}
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
				var response = JSON.parse(JSON.stringify(rows[0]));

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

bot.onText(/^\/avatar(?:@\w+)? (.+)|^\/avatar/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /avatar", opt);
			return;
		}

		var lang = rows[0].lang;
		
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_avatar_param[lang], options);
			return;
		}

		if ((message.reply_to_message == undefined) || (message.reply_to_message.photo == undefined)) {
			bot.sendMessage(message.chat.id, lang_avatar_photo[lang], options);
			return;
		}
		
		var inputText = match[1];
		var lines = inputText.split("\\n");
		
		var line1 = "";
		var line2 = "";
		if (lines.length == 1) {
			line1 = "text 0,300 '" + lines[0] + "'";
			line2 = "text 0,300 ''";
		} else if (lines.length == 2) {
			line1 = "text 0,230 '" + lines[0] + "'";
			line2 = "text 0,300 '" + lines[1] + "'";
		}

		console.log(getNow("it") + " Request avatar from " + message.from.username + " with text " + inputText);

		var image = message.reply_to_message.photo;
		bot.downloadFile(image[image.length-1].file_id, "r6tmp/").then(function (data) {
			var filePath = data;
			var outputFilePath = data.replace(".", "_output.");

			im.identify(filePath, function(err, data){
  				if (err) throw err;
				
				if (data.width/data.height != 1) {
					bot.sendMessage(message.chat.id, lang_avatar_size[lang], options);
					return;
				}
				
				im.identify(['-format', '%[fx:mean]', filePath], function(err, data){
  					if (err) throw err;
					
					var image = 'r6';
					var color = 'black';
					if (data < 0.5) {
						image = 'r6_w';
						color = 'white';
					}
				
					im.convert([filePath,
								'-resize', '500x500',
								'-font', 'r6res/ScoutCond-Regular.otf',
								'-pointsize', '80',
								'-fill', color,
								'-gravity', 'north',
								'-draw', line1,
								'-draw', line2,
								outputFilePath], function(err, stdout){
						if (err) throw err;

						im.convert(['-composite', outputFilePath, 'r6res/' + lang + '.png',
									'-gravity', 'center',
									'-geometry', '+0+170',
									outputFilePath], function(err, stdout){
							if (err) throw err;

							im.convert(['-composite', outputFilePath, 'r6res/' + image + '.png',
									'-gravity', 'center',
									'-geometry', '+0-150',
									outputFilePath], function(err, stdout){
								if (err) throw err;

								bot.sendPhoto(message.chat.id, outputFilePath, {reply_to_message_id: message.reply_to_message.message_id}).then(function (data) {
									fs.unlink(filePath, function (err) {
										if (err) throw err;
									}); 
									fs.unlink(outputFilePath, function (err) {
										if (err) throw err;
									});
								});
							});
						});
					});
				});
			});
		});
	});
});

bot.onText(/^\/lang(?:@\w+)? (.+)|^\/lang/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /lang", opt);
			return;
		}

		var errMsg = lang_invalid_lang[rows[0].lang] + validLang.join(", ");
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg, options);
			return;
		}
		
		var lang = match[1];
		lang = lang.toLowerCase();
		if (validLang.indexOf(lang) == -1){
			bot.sendMessage(message.chat.id, errMsg, options);
			return;
		}

		connection.query("UPDATE user SET lang = '" + lang + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_changed[lang], options);
		});
	});
});

bot.onText(/^\/region(?:@\w+)? (.+)|^\/region/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /region", opt);
			return;
		}

		var lang = rows[0].lang;
		var errMsg = lang_invalid_region[lang] + validRegion.join(", ");
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, errMsg, options);
			return;
		}
		
		var region = match[1];
		region = region.toLowerCase();
		if (validRegion.indexOf(region) == -1){
			bot.sendMessage(message.chat.id, errMsg, options);
			return;
		}
		
		connection.query("UPDATE user SET region = '" + region + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_region_changed[lang], options);
		});
	});
});

bot.onText(/^\/setusername(?:@\w+)? (.+)|^\/setusername(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setusername", opt);
			return;
		}

		var lang = rows[0].lang;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_user_1[lang], options);
			return;
		}

		var user = match[1].toLowerCase().trim();
		connection.query("UPDATE user SET default_username = '" + user + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_user_changed[lang], options);
		});
	});
});

bot.onText(/^\/setplatform(?:@\w+)? (.+)|^\/setplatform(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setplatform", opt);
			return;
		}

		var lang = rows[0].lang;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang], options);
			return;
		}

		var platform = match[1].toLowerCase().trim();

		if (platform == "ps4")
			platform = "psn";
		else if (platform == "pc")
			platform = "uplay";
		else if (platform.indexOf("xbox") != -1)
			platform = "xbl";

		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang], options);
			return;
		}
		connection.query("UPDATE user SET default_platform = '" + platform + "' WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			bot.sendMessage(message.chat.id, lang_default_platform_changed[lang], options);
		});
	});
});

bot.onText(/^\/setreport(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, report FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setreport", opt);
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].report == 1) {
			connection.query("UPDATE user SET report = 0 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_report_deactivated[lang], options);
			});
		} else {
			connection.query("UPDATE user SET report = 1 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_report_activated[lang], options);
			});
		}
	});
});

bot.onText(/^\/setdailyreport(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, daily_report FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /setdailyreport", opt);
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].daily_report == 1) {
			connection.query("UPDATE user SET daily_report = 0 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_daily_report_deactivated[lang], options);
			});
		} else {
			connection.query("UPDATE user SET daily_report = 1 WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_daily_report_activated[lang], options);
			});
		}
	});
});

bot.onText(/^\/status(?:@\w+)? (.+)|^\/status(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		var lang_complex = "";
		if (lang == "it")
			lang_complex = "it-it";
		else if (lang == "en")
			lang_complex = "en-us";
		
		/*
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang], options);
			return;
		}
		*/
		if (match[1] == undefined){
			console.log("Request generic server status from " + message.from.username);
			// Url source: https://ubistatic-a.akamaihd.net/0115/R6S/js/main.js?t=x1q2x3v2 and https://rainbow6.ubisoft.com/status/
			
			var url = "https://game-status-api.ubisoft.com/v1/instances?appIds=e3d5ea9e-50bd-43b7-88bf-39794f4e3d40,fb4cc4c9-2063-461d-a1e8-84a7d36525fc,4008612d-3baf-49e4-957a-33066726a7bc";
			bot.sendChatAction(message.chat.id, "typing").then(function () {
				request({
					uri: url,
				}, function(error, response, body) {
					var resp = JSON.parse(body);
					var text = "";
					for (var j = 0; j < Object.keys(resp).length; j++)
						text += "<b>" + decodePlatform(resp[j].Platform) + "</b>: " + decodeStatus(resp[j].Status, resp[j].Maintenance, lang) + "\n";
					text += "\n";
					
					var url = "https://ingame-news.ubi.com/json-feed/v1/spaces/news?spaceid=aac52d2d-47f2-4580-812d-5d6edff9cf2e&ver=" + Math.round(Math.random()*100000);
					request({
						headers: {
							'Accept': "application/json",
							'Ubi-AppId': 'f612511e-58a2-4e9a-831f-61838b1950bb',
							'Ubi-localeCode': lang_complex
						},
						uri: url,
					}, function(error, response, body) {
						var resp = JSON.parse(body);
						for (var j = 0; j < Object.keys(resp.news).length; j++)
							text += "<b>" + resp.news[j].title + "</b>\n" + resp.news[j].body + "\n\n";
						bot.sendMessage(message.chat.id, text, options);
					});
				});
			});
			
			return;
		}

		var platform = match[1].toLowerCase();
		
		if (platform == "ps4")
			platform = "psn";
		else if (platform == "pc")
			platform = "uplay";
		else if (platform.indexOf("xbox") != -1)
			platform = "xbl";
		
		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang], options);
			return;
		}

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
				bot.sendMessage(message.chat.id, decodePlatform(platform) + " Server Status: " + status, options);
			});
		});
	});
});

bot.onText(/^\/news(?:@\w+)?/i, function (message, match) {
	var options = {disable_web_page_preview: true, parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
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
							bot.sendMessage(message.chat.id, text, options);
							return;
						}
					} else if (index === 4)
						bot.sendMessage(message.chat.id, text, options);
				});
			})();
		});
	});
});

bot.onText(/^\/challenges(?:@\w+)? (.+)|^\/challenges(?:@\w+)?/i, function (message, match) {
	var options = {disable_web_page_preview: true, parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;
		
		var validParam = ["event", "regular"];
		var filterType = null;
		var type_desc = "";
		if (match[1] != undefined) {
			match[1] = match[1].toLowerCase();
			if (validParam.indexOf(match[1]) != -1) {
				filterType = match[1];
				type_desc = " with type " + filterType;
			} else {
				bot.sendMessage(message.chat.id, lang_invalid_type[lang] + validParam.join(", "), options);
				return;
			}
		}

		var lang_complex = "";
		if (lang == "it")
			lang_complex = "it-IT";
		else if (lang == "en")
			lang_complex = "en-US";

		var image_url = "https://static8.cdn.ubi.com/u/Uplay";

		console.log(getNow("it") + " Request challenges in " + lang_complex + " from " + message.from.username + type_desc);
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
								if ((filterType != null) && (challenges[i].type != filterType))
									continue;
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

					bot.sendMessage(message.chat.id, text, options);
				}
			});
		});
	});
});

bot.onText(/^\/graph(?:@\w+)? (.+)|^\/graph(?:@\w+)?|^\/lastgraph(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var image_options = {reply_to_message_id: message.message_id};
	connection.query("SELECT lang, default_username, default_platform, last_graph FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /graph", opt);
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var default_platform = rows[0].default_platform;
		var param = "";

		if (message.text.indexOf("/lastgraph") == -1){
			var errMsg = lang_graph_no_param[lang] + validParam.join(", ")
			if (match[1] == undefined){
				bot.sendMessage(message.chat.id, errMsg, options);
				return;
			}
			match[1] = match[1].toLowerCase();
			if (validParam.indexOf(match[1]) == -1){
				bot.sendMessage(message.chat.id, errMsg, options);
				return;
			}

			param = match[1];
		} else {
			if (rows[0].last_graph == null){
				bot.sendMessage(message.chat.id, lang_no_validgraph[lang], options);
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
					bot.sendMessage(message.chat.id, lang_graph_no_data[lang], options);
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

					bot.sendPhoto(message.chat.id, imageStream, image_options);

					connection.query("UPDATE user SET last_graph = '" + param + "' WHERE account_id = '" + message.from.id + "'", function (err, rows) {
						if (err) throw err;
					});
				});
			});
		});
	});
});

bot.onText(/^\/update(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT default_username, default_platform, lang, force_update, last_update FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /update", opt);
			return;
		}

		var lang = rows[0].lang;

		var date1 = new Date(rows[0].last_update);
		var date2 = new Date();
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var diffMin = Math.ceil(timeDiff / (1000 * 60)); 

		if ((diffMin < 180) && (message.from.id != 20471035)) {
			bot.sendMessage(message.chat.id, lang_update_err[lang], options);
			return;
		}

		var force_update = rows[0].force_update;

		var default_username = "";
		if (rows[0].default_username != undefined)
			default_username = rows[0].default_username;

		var default_platform = "";
		if (rows[0].default_platform != undefined)
			default_platform = rows[0].default_platform;

		console.log(getNow("it") + " Request update for " + default_username + " from " + default_platform);
		connection.query("SELECT insert_date FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "' ORDER BY id DESC", function (err, rows) {
			if (err) throw err;

			if (Object.keys(rows).length > 0) {
				date1 = new Date(rows[0].insert_date);
				timeDiff = Math.abs(date2.getTime() - date1.getTime());
				diffMin = Math.ceil(timeDiff / (1000 * 60)); 

				if ((diffMin < 180) && (message.from.id != 20471035)) {
					bot.sendMessage(message.chat.id, lang_update_err_3[lang], options);
					return;
				}
			}

			if (force_update == 1) {
				bot.sendMessage(message.chat.id, lang_update_err_2[lang], options);
				return;
			}

			connection.query("UPDATE user SET force_update = 1, last_force_update = NOW() WHERE account_id = " + message.from.id, function (err, rows) {
				if (err) throw err;
				bot.sendMessage(message.chat.id, lang_update_ok[lang], options);
			});
		});
	});
});

bot.onText(/^\/mstats(?:@\w+)? (.+)|^\/mstats(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
			rows[0].force_update = 0;
			rows[0].default_username = null;
			rows[0].default_platform = null;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_multiple[lang], options);
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
			bot.sendMessage(message.chat.id, lang_multiple_limit[lang], options);
			return;
		}

		console.log(getNow("it") + " Request multiple stats for " + players.length + " players from " + message.from.username);

		multipleStats(message, players, platform, options, lang, region);
	});
});

bot.onText(/^\/scan(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if ((message.reply_to_message == undefined) || (message.reply_to_message.photo == undefined)) {
			bot.sendMessage(message.chat.id, lang_scan_photo[lang], options);
			return;
		}

		console.log(getNow("it") + " Request scan from " + message.from.username);

		var image = message.reply_to_message.photo;
		bot.downloadFile(image[image.length-1].file_id, "r6tmp/").then(function (data) {
			var filePath = data;
			var outputFilePath = data.replace(".", "_output.");

			im.convert([filePath, '-resize', '1920x1080', '-crop', '+465+295', '-crop', '-965-200', '-resample', '144', '-sharpen', '0x3.0', '-set', 'colorspace', 'Gray', outputFilePath], function(err, stdout){
				if (err) throw err;

				tesseract.recognize(outputFilePath, {
					load_system_dawg: 0
				}).then(text => {
					fs.unlink(filePath, function (err) {
						if (err) throw err;
					}); 
					fs.unlink(outputFilePath, function (err) {
						if (err) throw err;
					});

					var res = text.replace(/^\s*[\r\n]/gm, '');
					var players = res.split("\n");
					players = players.filter(function (el) {
						return el != "";
					});

					if (players.length == 0) {
						bot.sendMessage(message.chat.id, lang_scan_error[lang], options);
						return;
					}

					if (players.length > 10){
						bot.sendMessage(message.chat.id, lang_scan_limit[lang], options);
						return;
					}

					multipleStats(message, players, "uplay", options, lang, region);
				})
			});
		});
	});
});

/* Commented cause 20MB downlod limit :/

bot.onText(/^\/compress(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		if (message.reply_to_message == undefined) {
			bot.sendMessage(message.chat.id, lang_scan_reply[lang], options);
			return;
		}

		if ((message.reply_to_message.document == undefined) && (message.reply_to_message.video == undefined)) {
			bot.sendMessage(message.chat.id, lang_scan_video[lang], options);
			return;
		}
		
		var video = message.reply_to_message.video;
		if (message.reply_to_message.document != undefined)
			video = message.reply_to_message.document;

		console.log(getNow("it") + " Request compress from " + message.from.username);

		if (video.mime_type != "video/mp4") {
			console.log("Invalid mime type: " + video.mime_type);
			bot.sendMessage(message.chat.id, lang_scan_video[lang], options);
			return;
		}
		bot.downloadFile(video.file_id, "r6tmp/").then(function (data) {
			var filePath = data;
			var outputFilePath = data.replace(".", "_output.");
			
			var command = ffmpeg(filePath).inputFormat("mp4").outputOptions([
			  	'-vcodec h264',
			  	'-acodec mp2',
			  	'-vf scale=1280:720',
				'-crf 30'
			]).on('error', function(err) {
				console.log('An error occurred: ' + err.message);
			}).on('end', function() {
				console.log('Compression finished!');
				bot.sendVideo(message.chat.id, outputFilePath, {reply_to_message_id: message.reply_to_message.message_id}).then(function (data) {
					fs.unlink(filePath, function (err) {
						if (err) throw err;
					}); 
					fs.unlink(outputFilePath, function (err) {
						if (err) throw err;
					});
				});
			}).save(outputFilePath);
		});
	});
});

*/

bot.onText(/^\/contest(?:@\w+)? (.+)|^\/contest(?:@\w+)?/i, function (message, match) {
	if (message.chat.id == r6italy_chatid) {
		var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
		connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length == 0){
				var lang = defaultLang;
				if (message.from.language_code != undefined){
					if (validLang.indexOf(message.from.language_code) != -1)
						lang = message.from.language_code;
				}
				rows[0] = {};
				rows[0].lang = lang;
			}

			var lang = rows[0].lang;

			if (match[1] == undefined) {
				bot.sendMessage(message.chat.id, lang_contest_invalid_username[lang]);
				return;
			}

			var username = match[1].replace("@", "");
			
			if (username == message.from.username) {
				bot.sendMessage(message.chat.id, lang_contest_username_me[lang]);
				return;
			}
			
			connection.query("SELECT join_date FROM contest_group WHERE account_id = " + message.from.id + " AND chat_id = '" + message.chat.id + "'", function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length > 0) {
					var join_date = new Date(rows[0].join_date);
					var now = new Date();
					
					if ((join_date.getFullYear() != now.getFullYear()) || 
						(join_date.getMonth() != now.getMonth()) || 
						(join_date.getDate() != now.getDate())) {
						bot.sendMessage(message.chat.id, lang_contest_invalid_date[lang]);
						return;
					}
				}

				connection.query("SELECT 1 FROM contest WHERE account_id = " + message.from.id, function (err, rows) {
					if (err) throw err;
					if (Object.keys(rows).length > 0) {
						bot.sendMessage(message.chat.id, lang_contest_already_linked[lang]);
						return;
					}

					connection.query("INSERT INTO contest (account_id, username, contest_username) VALUES (" + message.from.id + ", '" + message.from.username + "', '" + username + "')", function (err, rows) {
						if (err) throw err;
						bot.sendMessage(message.chat.id, lang_contest_done[lang]);
					});
				});
			});
		});
	}
});

bot.onText(/^\/checklang/, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var lang = defaultLang;
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}

	bot.sendMessage(message.from.id, message.from.language_code + " - " + lang, options);
});

function checkPlatformArray(array, value) {
	var found = "";
  	array.forEach(function(item) {
		if (value.endsWith(item) != false)
			found = item;
	});
	return found;
}

bot.onText(/^\/stats(?:@\w+)? (.+),(.+)|^\/stats(?:@\w+)? (.+)|^\/stats(?:@\w+)?|^\/!stats(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform, force_update, undefined_track FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
			rows[0].undefined_track = 0;
			rows[0].force_update = 0;
			rows[0].default_username = null;
			rows[0].default_platform = null;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;
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
			match[3] = match[3].toLowerCase();
			username = match[3];
			
			var checkPlatform = checkPlatformArray(["ps4", "psn", "pc", "uplay", "xbox", "xbl", "xbox one"], match[3]);
			if (checkPlatform != "") {
				username = username.replace(checkPlatform, "").trim();
				platform = checkPlatform;
			} else if (rows[0].default_platform != null)
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
					var iKeys = [];
					iKeys.push([{
						text: lang_config_inline[lang] + " ⚙️",
						url: "https://t.me/r6siegestatsbot?start=config"
					}]);
					var opt =	{
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: iKeys
						}
					};
					bot.sendMessage(message.chat.id, lang_invalid_user[lang], opt);
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

		if (platform == "ps4")
			platform = "psn";
		else if (platform == "pc")
			platform = "uplay";
		else if (platform.indexOf("xbox") != -1)
			platform = "xbl";

		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang]);
			return;
		}

		updateChatId(message.from.id, message.chat.id);
		updateUsername(message.from.id, message.from.username);

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
					insert_date = "\n<i>" + lang_insert_date[lang] + insert_date + "</i>";
					
					var response = JSON.parse(JSON.stringify(rows[0]));
					
					bot.sendMessage(message.chat.id, shortStats(response, lang) + "\n\n" + lang_full_stats[lang] + insert_date + extra_info, options);
					console.log(getNow("it") + " Cached user data served for " + username + " on " + platform);
					return;
				} else {
					// force save if no data
					forceSave = 1;
				}
				
				if (api_disabled == 1) {
					bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
					return;
				}

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username, platform, -1, region, 0).then(response => {
						var responseStats = response;

						if (responseStats.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_wrong_platform[lang] + " (" + username + ", " + platform + ")", options);
							console.log(getNow("it") + " User data wrong platform for " + username + " on " + platform);
							return;
						}
						
						r6.stats(username, platform, -1, region, 1).then(response => {
							var responseOps = response;
							
							var ops = getOperators(responseOps);
							responseStats.operator_max_wl = ops[14];
							responseStats.operator_max_wl_name = ops[15];
							
							var text = shortStats(responseStats, lang);

							if (undefined_track == 1){
								connection.query("UPDATE user SET undefined_track = 0 WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
									console.log(getNow("it") + " User unlocked for " + username + " on " + platform);
								});
							}

							bot.sendMessage(message.chat.id, text + "\n" + extra_info + "\n" + lang_full_stats[lang], options);

							if (forceSave == 1){
								connection.query("UPDATE user SET force_update = 0, last_update = NOW() WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
								});
								saveData(responseStats, responseOps, 1);
							}

							console.log(getNow("it") + " User data served for " + username + " on " + platform);
						}).catch(error => {
							console.log(username, platform, error);
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
							console.log(getNow("it") + " User data operators not found for " + username + " on " + platform);
						});
					}).catch(error => {
						console.log(username, platform, error);
						bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
						console.log(getNow("it") + " User data not found for " + username + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/fullstats(?:@\w+)? (.+)|^\/fullstats(?:@\w+)?|^\/!fullstats(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform, force_update, undefined_track FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /fullstats", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;
		
		if (match[1] != undefined) {
			bot.sendMessage(message.chat.id, lang_noparam[lang], opt);
			return;
		}
		
		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var platform = rows[0].default_platform;
		
		var undefined_track = rows[0].undefined_track;

		var extra_info = "";
		if (lang_extra_info[lang] != "")
			extra_info = lang_extra_info[lang];

		var forceSave = 0;
		if (rows[0].force_update == 1){
			forceSave = 1;
			console.log("ForceSave enabled");
		}

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
					
					var response = JSON.parse(JSON.stringify(rows[0]));

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
					var most_meleekills = rows[0].operator_max_meleekills;
					var most_meleekills_name = rows[0].operator_max_meleekills_name;
					var most_headshot = rows[0].operator_max_headshot;
					var most_headshot_name = rows[0].operator_max_headshot_name;
					var most_dbno = rows[0].operator_max_dbno;
					var most_dbno_name = rows[0].operator_max_dbno_name;

					var text = getData(response, lang);
					text += getOperatorsText(most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name, most_meleekills, most_meleekills_name, most_headshot, most_headshot_name, most_dbno, most_dbno_name, lang);
					
					bot.sendMessage(message.chat.id, text + insert_date + extra_info, options);
					console.log(getNow("it") + " Cached user data served for " + username + " on " + platform);
					return;
				} else {
					// force save if no data
					forceSave = 1;
				}
				
				if (api_disabled == 1) {
					bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
					return;
				}

				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username, platform, -1, region, 0).then(response => {
						var responseStats = response;

						if (responseStats.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_wrong_platform[lang] + " (" + username + ", " + platform + ")", options);
							console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
							return;
						}

						var text = getData(responseStats, lang);
						r6.stats(username, platform, -1, region, 1).then(response => {
							var responseOps = response;

							var ops = getOperators(responseOps);							
							text += getOperatorsText(ops[0], ops[1], ops[2], ops[3], ops[4], ops[5], ops[6], ops[7], ops[8], ops[9], ops[10], ops[11], ops[12], ops[13], ops[14], ops[15], ops[16], ops[17], ops[18], ops[19], ops[20], ops[21], lang);

							if (undefined_track == 1){
								connection.query("UPDATE user SET undefined_track = 0 WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
									console.log(getNow("it") + " User unlocked for " + username + " on " + platform);
								});
							}

							bot.sendMessage(message.chat.id, text + "\n" + extra_info, options);

							if (forceSave == 1){
								connection.query("UPDATE user SET force_update = 0, last_update = NOW() WHERE account_id = " + message.from.id, function (err, rows) {
									if (err) throw err;
								});
								saveData(responseStats, responseOps, 1);
							}

							console.log(getNow("it") + " User data served for " + username + " on " + platform);
						}).catch(error => {
							console.log(username, platform, error);
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
							console.log(getNow("it") + " User data operators not found for " + username + " on " + platform);
						});
					}).catch(error => {
						console.log(username, platform, error);
						bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
						console.log(getNow("it") + " User data not found for " + username + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/rank(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /rank", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var platform = rows[0].default_platform;

		console.log(getNow("it") + " Request rank data for " + username + " on " + platform);
		
		connection.query('SELECT season_rank, season_mmr FROM player_history WHERE platform = "' + platform + '" AND username = "' + username + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length > 0){
				var responseStats = {};
				responseStats.season_rank = rows[0].season_rank;
				responseStats.season_mmr = rows[0].season_mmr;

				console.log(getNow("it") + " Loaded rank from cache");
				bot.sendMessage(message.chat.id, getRankData(responseStats, lang), options);
				return;
			}
			
			if (api_disabled == 1) {
				bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
				return;
			}
		
			console.log(getNow("it") + " Loading rank from api");
			bot.sendChatAction(message.chat.id, "typing").then(function () {
				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username, platform, -1, region, 0).then(response => {
						var responseStats = response;

						if (responseStats.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_wrong_platform[lang] + " (" + username + ", " + platform + ")", options);
							console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
							return;
						}

						bot.sendMessage(message.chat.id, getRankData(responseStats, lang), options);
					}).catch(error => {
						console.log(username, platform, error);
						bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
						console.log(getNow("it") + " User data not found for " + username + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/userhistory(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /rank", opt);
			return;
		}

		var lang = rows[0].lang;
		
		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var platform = rows[0].default_platform;

		console.log(getNow("it") + " Request user history data for " + username + " on " + platform);
		
		connection.query('SELECT ubisoft_id FROM player_history WHERE platform = "' + platform + '" AND username = "' + username + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				bot.sendMessage(message.chat.id, lang_nickhistory_nodata[lang], options);
				return;
			}
			
			var ubisoft_id = rows[0].ubisoft_id;
			
			connection.query('SELECT MAX(insert_date) As change_date, username FROM player_history WHERE ubisoft_id = "' + ubisoft_id + '" GROUP BY username ORDER BY change_date DESC', function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length == 1) {
					bot.sendMessage(message.chat.id, lang_nickhistory_nochange[lang], options);
					return;
				}

				var text = lang_nickhistory_title[lang] + ":\n";
				var change_date = "";
				for (i = 0; i < Object.keys(rows).length; i++) {
					change_date = rows[i].change_date;
					if (i == 0)
						change_date = lang_nickhistory_actual[lang];
					else {
						var d = new Date(change_date);
						if (lang == "it")
							change_date = addZero(d.getDate()) + "/" + addZero(d.getMonth() + 1) + "/" + d.getFullYear();
						else
							change_date = addZero(d.getMonth() + 1) + "/" + addZero(d.getDate()) + "/" + d.getFullYear();
					}	
					text += change_date + " - " + rows[i].username + "\n";
				}

				bot.sendMessage(message.chat.id, text, options);
			});
		});
	});
});

bot.onText(/^\/r6info(?:@\w+)? (.+)|^\/r6info(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
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
				bot.sendMessage(message.chat.id, lang_info_notfound[lang], options);
				return;
			}

			if ((rows[0].default_username == null) && (rows[0].default_platform == null)){
				bot.sendMessage(message.chat.id, lang_info_notfound2[lang], options);
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

				bot.sendMessage(message.chat.id, "<b>" + lang_info_result[lang] + " " + username + "</b>\n\n" + lang_username[lang] + ": " + default_username + "\n" + lang_platform[lang] + ": " + decodePlatform(default_platform) + insert_date, options);
			});
		});
	});
});

bot.onText(/^\/compare(?:@\w+)? (.+),(.+)|^\/compare(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
			rows[0].default_platform = null;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;
		if ((match[1] == undefined) || (match[2] == undefined)){
			bot.sendMessage(message.chat.id, lang_invalid_user_2[lang], options);
			return;
		}

		var user1platform = "uplay";
		var user2platform = "uplay";
		if (rows[0].default_platform != null){
			user1platform = rows[0].default_platform;
			user2platform = user1platform;
		}

		var username1 = match[1].trim();
		var username2 = match[2].trim();

		var user1info = connection_sync.query("SELECT default_platform FROM user WHERE default_username = '" + username1 + "'");
		if (Object.keys(user1info).length > 0){
			if (user1info[0].default_platform != null)
				user1platform = user1info[0].default_platform;
		}
		var user2info = connection_sync.query("SELECT default_platform FROM user WHERE default_username = '" + username2 + "'");
		if (Object.keys(user2info).length > 0){
			if (user2info[0].default_platform != null)
				user2platform = user2info[0].default_platform;
		}

		console.log(getNow("it") + " Request user compare for " + username1 + " and " + username2 + " on " + user1platform + " and " + user2platform);
		
		var player1cached = 0;
		var player2cached = 0;
		
		connection.query('SELECT * FROM player_history WHERE platform = "' + user1platform + '" AND username = "' + username1 + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length > 0){
				var response1 = JSON.parse(JSON.stringify(rows[0]));

				player1cached = 1;
			}
			
			connection.query('SELECT * FROM player_history WHERE platform = "' + user2platform + '" AND username = "' + username2 + '" ORDER BY id DESC', function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length > 0){
					var response2 = JSON.parse(JSON.stringify(rows[0]));

					player2cached = 1;
				}
				
				if ((player1cached == 1) && (player2cached == 1)) {
					bot.sendMessage(message.chat.id, getCompareStats(response1, response2, lang), options);
					console.log(getNow("it") + " User compared from cache");
					return;
				}
				
				if (api_disabled == 1) {
					bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
					return;
				}
		
				console.log(getNow("it") + " User compared from api request");
				
				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username1, user1platform, -1, region, 0).then(response1 => {

						if (response1.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username1 + ", " + user1platform + ")", options);
							console.log(getNow("it") + " User data 1 (compare) undefined for " + username1 + " on " + user1platform);
							return;
						}

						bot.sendChatAction(message.chat.id, "typing").then(function () {
							r6.stats(username2, user2platform, -1, region, 0).then(response2 => {

								if (response2.platform == undefined){
									bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username2 + ", " + user2platform + ")", options);
									console.log(getNow("it") + " User data 2 (compare) undefined for " + username2 + " on " + user2platform);
									return;
								}

								bot.sendMessage(message.chat.id, getCompareStats(response1, response2, lang), options);
							}).catch(error => {
								bot.sendMessage(message.chat.id, error, options);
								console.log(getNow("it") + " User data not found for " + username2 + " on " + platform);
							});
						});
					}).catch(error => {
						bot.sendMessage(message.chat.id, error, options);
						console.log(getNow("it") + " User data not found for " + username1 + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/canplay(?:@\w+)? (.+),(.+)|^\/canplay(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
			rows[0].default_platform = null;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;
		if ((match[1] == undefined) || (match[2] == undefined)){
			bot.sendMessage(message.chat.id, lang_invalid_user_3[lang], options);
			return;
		}

		var user1platform = "uplay";
		var user2platform = "uplay";
		if (rows[0].default_platform != null){
			user1platform = rows[0].default_platform;
			user2platform = user1platform;
		}

		var username1 = match[1].trim();
		var username2 = match[2].trim();

		var user1info = connection_sync.query("SELECT default_platform FROM user WHERE default_username = '" + username1 + "'");
		if (Object.keys(user1info).length > 0){
			if (user1info[0].default_platform != null)
				user1platform = user1info[0].default_platform;
		}
		var user2info = connection_sync.query("SELECT default_platform FROM user WHERE default_username = '" + username2 + "'");
		if (Object.keys(user2info).length > 0){
			if (user2info[0].default_platform != null)
				user2platform = user2info[0].default_platform;
		}

		console.log(getNow("it") + " Request user check for " + username1 + " and " + username2 + " on " + user1platform + " and " + user2platform);
		
		var player1cached = 0;
		var player2cached = 0;
		
		connection.query('SELECT username, season_mmr FROM player_history WHERE platform = "' + user1platform + '" AND username = "' + username1 + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length > 0){
				var response1 = {};
				response1.username = rows[0].username;
				response1.season_mmr = rows[0].season_mmr;

				player1cached = 1;
			}
			
			connection.query('SELECT username, season_mmr FROM player_history WHERE platform = "' + user2platform + '" AND username = "' + username2 + '" ORDER BY id DESC', function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length > 0){
					var response2 = {};
					response2.username = rows[0].username;
					response2.season_mmr = rows[0].season_mmr;

					player2cached = 1;
				}
				
				if ((player1cached == 1) && (player2cached == 1)) {
					bot.sendMessage(message.chat.id, getCheckStats(response1, response2, lang), options);
					console.log(getNow("it") + " User checked from cache");
					return;
				}
				
				if (api_disabled == 1) {
					bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
					return;
				}
		
				console.log(getNow("it") + " User checked from api request");
		
				bot.sendChatAction(message.chat.id, "typing").then(function () {
					r6.stats(username1, user1platform, -1, region, 0).then(response1 => {

						if (response1.platform == undefined){
							bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username1 + ", " + user1platform + ")", options);
							console.log(getNow("it") + " User data 1 (check) undefined for " + username1 + " on " + user1platform);
							return;
						}

						bot.sendChatAction(message.chat.id, "typing").then(function () {
							r6.stats(username2, user2platform, -1, region, 0).then(response2 => {

								if (response2.platform == undefined){
									bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + username2 + ", " + user2platform + ")", options);
									console.log(getNow("it") + " User data 2 (check) undefined for " + username2 + " on " + user2platform);
									return;
								}

								bot.sendMessage(message.chat.id, getCheckStats(response1, response2, lang), options);
							}).catch(error => {
								bot.sendMessage(message.chat.id, error, options);
								console.log(getNow("it") + " User data not found for " + username2 + " on " + platform);
							});
						});
					}).catch(error => {
						bot.sendMessage(message.chat.id, error, options);
						console.log(getNow("it") + " User data not found for " + username1 + " on " + platform);
					});
				});
			});
		});
	});
});

bot.onText(/^\/season(?:@\w+)? (.+)|^\/season(?:@\w+)?$/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /season", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_season_not_specified[lang], options);
			return;
		}

		var season = match[1];
		var seasonIndex = -1;
		for (var i = 0; i < seasonList.length; i++) {
			if (seasonList[i].toLowerCase() === season.toLowerCase())
				seasonIndex = i;
		}
		if (seasonIndex == -1) {
			bot.sendMessage(message.chat.id, lang_season_invalid[lang], options);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var default_platform = rows[0].default_platform;
		
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		console.log(getNow("it") + " Request season data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, (seasonIndex+1), region, 0).then(response => {
				bot.sendMessage(message.chat.id, "<b>" + lang_season_intro[lang] + " " + seasonList[response.season_id-1] + ":</b>\n" +
								lang_season_mmr[lang] + ": " + mapRank(Math.round(response.season_mmr), lang) + "\n" +
								lang_season_max_mmr[lang] + ": " + mapRank(Math.round(response.season_max_mmr), lang) + "\n", options);
			}).catch(error => {
				console.log(default_username, default_platform, error);
				bot.sendMessage(message.chat.id, lang_season_error[lang] + " (" + error + ")", options);
				console.log(getNow("it") + " Season data not found for " + default_username + " on " + default_platform);
			});
		});
	});
});

bot.onText(/^\/seasons(?:@\w+)?/i, function (message) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /seasons", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}
		
		// disabled
		bot.sendMessage(message.chat.id, lang_disabled[lang], options);
		return;

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var default_platform = rows[0].default_platform;
		
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		console.log(getNow("it") + " Request seasons data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, -1, region, 0).then(response => {
				var responseStats = response;

				if (responseStats.platform == undefined){
					bot.sendMessage(message.chat.id, lang_user_wrong_platform[lang] + " (" + username + ", " + platform + ")", options);
					console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
					return;
				}

				var startSeason = 6;
				var lastSeason = responseStats.season_id;
				var seasonArray = [];
				var textDone = 0;
				for(i = startSeason; i < lastSeason+1; i++){
					var seasonQuery = connection_sync.query("SELECT mmr, max_mmr FROM season_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "' AND season_id = " + i);
					if (Object.keys(seasonQuery).length == 0){
						r6.stats(default_username, default_platform, i, region, 0).then(response => {
							if ((response.season_id != undefined) && (response.season_rank != 0)) {
								seasonArray[response.season_id] = "<b>" + seasonList[response.season_id-1] + ":</b> " + mapRank(Math.round(response.season_max_mmr), lang) + "\n";
								if (response.season_id != lastSeason) {
									connection.query("INSERT INTO season_history (username, platform, season_id, mmr, max_mmr) VALUES ('" + default_username + "', '" + default_platform + "', " + response.season_id + ", " + response.season_mmr + ", " + response.season_max_mmr + ")", function (err, rows) {
										if (err) throw err;
									});
								}
							}
							textDone++;
							if (textDone >= (lastSeason-startSeason)+1)
								bot.sendMessage(message.chat.id, lang_seasons_intro[lang] + sortSeasons(seasonArray), options);
						}).catch(error => {
							textDone++;
							if (textDone >= (lastSeason-startSeason)+1)
								bot.sendMessage(message.chat.id, lang_seasons_intro[lang] + sortSeasons(seasonArray), options);
						});
					} else {
						seasonArray[i] = "<b>" + seasonList[i-1] + ":</b> " + mapRank(Math.round(seasonQuery[0].max_mmr), lang) + "\n";
						textDone++;
						if (textDone >= (lastSeason-startSeason)+1)
							bot.sendMessage(message.chat.id, lang_seasons_intro[lang] + sortSeasons(seasonArray), options);
					}
				}
			}).catch(error => {
				console.log(username, platform, error);
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
				console.log(getNow("it") + " User data not found for " + username + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/history(?:@\w+)?/i, function (message) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /history", opt);
			return;
		}

		var lang = rows[0].lang;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var default_platform = rows[0].default_platform;

		console.log(getNow("it") + " Request history data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			connection.query("SELECT insert_date, last_match_skill_stdev_change, last_match_mmr_change, last_match_skill_mean_change, last_match_result FROM player_history WHERE username = '" + default_username + "' AND platform = '" + default_platform + "' AND (last_match_skill_stdev_change != 0 OR last_match_mmr_change != 0 OR last_match_skill_mean_change != 0) ORDER BY id DESC LIMIT 25", function (err, rows) {
				if (err) throw err;

				if (Object.keys(rows).length == 0) {
					bot.sendMessage(message.chat.id, lang_no_history[lang], options);
					return;
				}

				var text = "<b>" + lang_history_date[lang] + " - " + lang_history_stdev[lang] + " - " + lang_history_mmr[lang] + " - " + lang_history_mean[lang] + " - " + lang_history_result[lang] + "</b>\n";
				var last_match_skill_stdev_change = "";
				var last_match_mmr_change = "";
				var last_match_skill_mean_change = "";
				var last_match_result = "";
				for (i = 0; i < Object.keys(rows).length; i++){
					if ((last_match_skill_stdev_change != rows[i].last_match_skill_stdev_change) || 
						(last_match_mmr_change != rows[i].last_match_mmr_change) || 
						(last_match_skill_mean_change != rows[i].last_match_skill_mean_change) || 
						(last_match_result != rows[i].last_match_result)) {
						
						text += toDate(lang, rows[i].insert_date) + ": " + roundTwoDecimal(rows[i].last_match_skill_stdev_change) + " - " + (rows[i].last_match_mmr_change > 0 ? "+" + rows[i].last_match_mmr_change : rows[i].last_match_mmr_change) + " - " + roundTwoDecimal(rows[i].last_match_skill_mean_change) + " - " + decodeMatchResult(rows[i].last_match_result, lang) + "\n";
						
						last_match_skill_stdev_change = rows[i].last_match_skill_stdev_change;
						last_match_mmr_change = rows[i].last_match_mmr_change;
						last_match_skill_mean_change = rows[i].last_match_skill_mean_change;
						last_match_result = rows[i].last_match_result;
					}
				}

				bot.sendMessage(message.chat.id, text, options);
			});
		});
	});
});

bot.onText(/^\/operators(?:@\w+)? (.+)|^\/operators(?:@\w+)?/i, function (message, match) {
	var options_reply = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var options = {parse_mode: "HTML"};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /operators", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options_reply);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options_reply);
			return;
		}

		var default_platform = rows[0].default_platform;
		
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		var orderList = ["match", "win", "lose", "kill", "death", "time", "melee", "headshot", "dbno"];
		var orderMethod = "";
		if (match[1] != undefined) {
			match[1] = match[1].toLowerCase();
			if (orderList.indexOf(match[1]) != -1)
				orderMethod = match[1];
			else {
				bot.sendMessage(message.chat.id, lang_seasons_invalid_order[lang] + orderList.join(", "), options_reply);
				return;
			}
		}
		
		var header = [];
		var content = [];

		console.log(getNow("it") + " Request operators data for " + default_username + " on " + default_platform);
		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(default_username, default_platform, -1, region, 1).then(response => {
				header = [lang_operator_title[lang], lang_operator_plays[lang], lang_operator_wins[lang], lang_operator_losses[lang], lang_operator_kills[lang], lang_operator_deaths[lang], lang_operator_playtime[lang], lang_op_meleekills[lang], lang_op_headshot[lang], lang_op_dbno[lang], lang_operator_specials[lang]];

				var operators = response;

				delete operators.nickname;
				delete operators.platform;
				delete operators.profile_id;

				if (orderMethod == "") {
					var ordered = {};
					Object.keys(response).sort().forEach(function(key) {
						ordered[key] = response[key];
					});
					operators = ordered;
				} else {
					var ordered = {};
					if (orderMethod == "match") {
						Object.keys(response).sort(function(keyA, keyB) {
							return (response[keyB].operatorpvp_roundwon+response[keyB].operatorpvp_roundlost) - (response[keyA].operatorpvp_roundwon+response[keyA].operatorpvp_roundlost);
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "win") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_roundwon - response[keyA].operatorpvp_roundwon;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "lose") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_roundlost - response[keyA].operatorpvp_roundlost;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "kill") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_kills - response[keyA].operatorpvp_kills;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "death") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_death - response[keyA].operatorpvp_death;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "time") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_timeplayed - response[keyA].operatorpvp_timeplayed;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "melee") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_meleekills - response[keyA].operatorpvp_meleekills;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "headshot") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_headshot - response[keyA].operatorpvp_headshot;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					} else if (orderMethod == "dbno") {
						Object.keys(response).sort(function(keyA, keyB) {
							return response[keyB].operatorpvp_dbno - response[keyA].operatorpvp_dbno;
						}).forEach(function(key) {
							ordered[key] = response[key];
						});
					}

					operators = ordered;
				}

				var operators_name = Object.keys(operators);

				for (i = 0; i < Object.keys(operators).length; i++){
					content[i] = [jsUcfirst(operators_name[i]), formatNumber(response[operators_name[i]].operatorpvp_roundwon+response[operators_name[i]].operatorpvp_roundlost, lang), formatNumber(response[operators_name[i]].operatorpvp_roundwon, lang), formatNumber(response[operators_name[i]].operatorpvp_roundlost, lang), formatNumber(response[operators_name[i]].operatorpvp_kills, lang), formatNumber(response[operators_name[i]].operatorpvp_death, lang), toTime(response[operators_name[i]].operatorpvp_timeplayed, lang, true), formatNumber(response[operators_name[i]].operatorpvp_meleekills, lang), formatNumber(response[operators_name[i]].operatorpvp_headshot, lang), formatNumber(response[operators_name[i]].operatorpvp_dbno, lang)];

					var specials = Object.keys(operators[operators_name[i]]);

					// remove stats
					delete operators[operators_name[i]].operatorpvp_roundlost;
					delete operators[operators_name[i]].operatorpvp_death;
					delete operators[operators_name[i]].operatorpvp_roundwon;
					delete operators[operators_name[i]].operatorpvp_kills;
					delete operators[operators_name[i]].operatorpvp_timeplayed;
					delete operators[operators_name[i]].operatorpvp_meleekills;
					delete operators[operators_name[i]].operatorpvp_headshot;
					delete operators[operators_name[i]].operatorpvp_dbno;
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);
					specials.splice(0, 1);

					var sum = 0;
					if (specials.length > 0){
						for (j = 0; j < specials.length; j++) {
							if (specials[j] != "")
								sum += parseInt(eval("operators[operators_name[" + i + "]]." + specials[j]));
						}
					}
					content[i].push(formatNumber(sum, lang));
				}
				if (message.chat.id < 0)
					bot.sendMessage(message.chat.id, "<i>" + lang_private[lang] + "</i>", options_reply);
				var fileName = "Operators" + (orderMethod != "" ? "_" + orderMethod : "") + ".pdf";
				operatorsPdf(message, header, content, fileName);
				// bot.sendMessage(message.from.id, lang_operator_extra[lang], options);
			}).catch(error => {
				console.log(default_username, default_platform, error);
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options_reply);
				console.log(getNow("it") + " Operators data not found for " + default_username + " on " + default_platform);
			});
		});
	});
});

bot.onText(/^\/weapons(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /weapons", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var platform = rows[0].default_platform;

		console.log(getNow("it") + " Request weapons data for " + username + " on " + platform);
			
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		bot.sendChatAction(message.chat.id, "typing").then(function () {
			r6.stats(username, platform, -1, region, 0).then(response => {
				var responseStats = response;

				if (responseStats.platform == undefined){
					bot.sendMessage(message.chat.id, lang_user_wrong_platform[lang] + " (" + username + ", " + platform + ")", options);
					console.log(getNow("it") + " User data undefined for " + username + " on " + platform);
					return;
				}
				
				/*
				
				1 Assault Rifle
				2 Submachine Gun
				3 Marksman Rifle
				4 Shotgun
				5 Handgun
				6 Light Machine Gun
				7 Machine Pistol
				
				*/
				
				var text = 	"<b>" + lang_weapon_title[lang] + "</b>:\n\n" +
							"<b>" + lang_weapon_assault[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_1, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_1, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_1, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_1, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_1/responseStats.bullethit_1), lang) + "%\n\n" +
							"<b>" + lang_weapon_submachine[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_2, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_2, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_2, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_2, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_2/responseStats.bullethit_2), lang) + "%\n\n" +
							"<b>" + lang_weapon_marksman[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_3, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_3, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_3, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_3, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_3/responseStats.bullethit_3), lang) + "%\n\n" +
							"<b>" + lang_weapon_shotgun[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_4, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_4, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_4, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_4, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_4/responseStats.bullethit_4), lang) + "%\n\n" +
							"<b>" + lang_weapon_handgun[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_5, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_5, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_5, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_5, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_5/responseStats.bullethit_5), lang) + "%\n\n" +
							"<b>" + lang_weapon_lightmachine[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_6, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_6, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_6, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_6, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_6/responseStats.bullethit_6), lang) + "%\n\n" +
							"<b>" + lang_weapon_machinepistol[lang] + "</b>\n" +
							"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(responseStats.kills_7, lang) + "\n" +
							"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(responseStats.headshot_7, lang) + "\n" +
							// "<b>" + lang_bullets_fired[lang] + "</b>: " + formatNumber(responseStats.bulletfired_7, lang) + "\n" +
							"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(responseStats.bullethit_7, lang) + "\n" +
							"<b>" + lang_weapon_precision[lang] + "</b>: " + formatDecimal((responseStats.headshot_7/responseStats.bullethit_7), lang) + "%";

				bot.sendMessage(message.chat.id, text, options);
			}).catch(error => {
				console.log(username, platform, error);
				bot.sendMessage(message.chat.id, lang_user_not_found[lang] + " (" + error + ")", options);
				console.log(getNow("it") + " User data not found for " + username + " on " + platform);
			});
		});
	});
});

bot.onText(/^\/operator(?:@\w+)? (.+)|^\/operator(?:@\w+)?$/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /operator", opt);
			return;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (rows[0].default_username == null){
			bot.sendMessage(message.chat.id, lang_no_defaultuser[lang], options);
			return;
		}

		var default_username = rows[0].default_username;

		if (rows[0].default_platform == null){
			bot.sendMessage(message.chat.id, lang_no_defaultplatform[lang], options);
			return;
		}

		var default_platform = rows[0].default_platform;

		var operator_name;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_operator_no_name[lang], options);
			return;
		}
		if (operatorList.indexOf(match[1]) == -1){
			match[1] = jsUcfirst(match[1]);
			if (match[1].toLowerCase() == "iq")
				match[1] = "IQ";
			var sim = stringSimilarity.findBestMatch(match[1], operatorList);
			if (sim.bestMatch.rating >= 0.6)
				match[1] = sim.bestMatch.target;
			else{
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang], options);
				return;
			}
		}

		operator_name = match[1];
		
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		console.log(getNow("it") + " Request operator data for " + operator_name + " from " + message.from.username);
		bot.sendChatAction(message.chat.id, "typing").then(function () {

			r6.stats(default_username, default_platform, -1, region, 2).then(response => {
				var operators_info = response;

				r6.stats(default_username, default_platform, -1, region, 1).then(response => {

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
						if (operators[i] == "nakk")	// nokk fix (ubi pls)
							operators[i] = "nokk";
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
							wlratio = wins/losses;
							if (!isFinite(wlratio)) wlratio = wins;
							kills = response[operators[i]].operatorpvp_kills;
							deaths = response[operators[i]].operatorpvp_death;
							kdratio = kills/deaths;
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
										try {
											special_names.push(eval("ability_" + specials[j] + "['" + lang + "']"));
										} catch (e) {
											special_names.push("ability_" + specials[j]);
										}
										special_values.push(parseInt(eval("response[operators[" + i + "]]." + specials[j])));
										validSpecials++;
									}
								}
							}
							found = 1;
						}
					}

					if (found == 0){
						bot.sendMessage(message.chat.id, lang_operator_not_found[lang], options);
						return;
					}

					var text = 	"<b>" + lang_operator_title[lang] + "</b>: " + name + " (" + role + ", " + org + ")\n" +
						"<b>" + lang_operator_plays[lang] + "</b>: " + formatNumber(played, lang) + "\n" +
						"<b>" + lang_operator_wins[lang] + "</b>: " + formatNumber(wins, lang) + "\n" +
						"<b>" + lang_operator_losses[lang] + "</b>: " + formatNumber(losses, lang) + "\n" +
						"<b>" + lang_operator_wlratio[lang] + "</b>: " + formatDecimal(wlratio, lang) + "\n" +
						"<b>" + lang_operator_kills[lang] + "</b>: " + formatNumber(kills, lang) + "\n" +
						"<b>" + lang_operator_deaths[lang] + "</b>: " + formatNumber(deaths, lang) + "\n" +
						"<b>" + lang_operator_kdratio[lang] + "</b>: " + formatDecimal(kdratio, lang) + "\n" +
						"<b>" + lang_operator_playtime[lang] + "</b>: " + toTime(playtime, lang, true) + "\n";
					for (j = 0; j < validSpecials; j++)
						text += "<b>" + special_names[j] + "</b>: " + formatNumber(special_values[j], lang) + "\n";

					bot.sendMessage(message.chat.id, text, options);

					/* invio immagine badge
					if (message.chat.id > 0)
						bot.sendPhoto(message.chat.id, badge_url);
					*/
				}).catch(error => {
					console.log(error);
					bot.sendMessage(message.chat.id, lang_operator_not_found[lang] + " (" + default_platform + ")", options);
					console.log(getNow("it") + " Operators data not found for " + operator_name + " from " + message.from.username);
				});
			}).catch(error => {
				console.log(error);
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang] + " (" + default_platform + ")", options);
				console.log(getNow("it") + " Operators info data not found for " + operator_name + " from " + message.from.username);
			});
		});
	});
});

bot.onText(/^\/loadout(?:@\w+)? (.+)|^\/loadout(?:@\w+)?$/i, function (message, match) {
	var options_reply = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var options = {parse_mode: "HTML"};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;
		var operator_name;
		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_operator_no_name[lang], options_reply);
			return;
		}

		operator_name = jsUcfirst(match[1]);

		if (operatorList.indexOf(match[1]) == -1){
			if (operator_name == "Iq")
				operator_name = "IQ";
			var sim = stringSimilarity.findBestMatch(operator_name, operatorList);
			if (sim.bestMatch.rating >= 0.6)
				operator_name = sim.bestMatch.target;
			else {
				bot.sendMessage(message.chat.id, lang_operator_not_found[lang], options_reply);
				return;
			}
		}

		console.log(getNow("it") + " Request best loadout for " + operator_name + " from " + message.from.username);
		var endpoint = "https://pastebin.com/raw/kAKZKUuq";
		request.get(endpoint, (error, response, body) => {
			if(!error && response.statusCode == '200') {
				var resp = JSON.parse(body);
				var equip = resp[operator_name];

				if (equip == undefined){
					bot.sendMessage(message.chat.id, lang_operator_not_found[lang], options_reply);
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

				if (message.chat.id < 0)
					bot.sendMessage(message.chat.id, "<i>" + lang_private[lang] + "</i>", options_reply);
				bot.sendMessage(message.from.id, text, options);
			}
		});
	});
});

bot.onText(/^\/help(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var options_markdown = {parse_mode: "Markdown"};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		if (message.chat.id < 0)
			bot.sendMessage(message.chat.id, "<i>" + lang_private[lang] + "</i>", options);
		bot.sendMessage(message.from.id, lang_help[lang], options_markdown);
	});
});

bot.onText(/^\/botconfig(?:@\w+)?/i, function (message, match) {
	var options_reply = {parse_mode: "Markdown", reply_to_message_id: message.message_id};
	var options = {parse_mode: "Markdown"};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "Markdown"
		};

		if (message.chat.id < 0)
			bot.sendMessage(message.chat.id, lang_config[lang], options_reply);
		else
			bot.sendMessage(message.from.id, lang_config_private[lang], options);
	});
});

bot.onText(/^\/groups(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		bot.sendMessage(message.chat.id, lang_groups[lang], options);
	});
});

bot.onText(/^\/team(?:@\w+)? (.+)|^\/team(?:@\w+)?$/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
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

			bot.sendMessage(message.chat.id, lang_team_intro[lang] + team_list, options);
		});
	});
});

bot.onText(/^\/ttag(?:@\w+)? (.+)/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		var mark = {
			parse_mode: "HTML"
		};

		var team_name = match[1];

		connection.query("SELECT id FROM team WHERE group_id = '" + message.chat.id + "' AND name = '" + team_name + "'", function (err, rows) {
			if (err) throw err;
			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_team_notfound[lang], options);
				return;
			}
			var team_id = rows[0].id;
			connection.query("SELECT username FROM team_member WHERE username != '" + message.from.username + "' AND team_id = " + team_id, function (err, rows) {
				if (err) throw err;
				var text = "<b>" + message.from.username + "</b> " + lang_team_call[lang] + ": ";
				for (var i = 0; i < Object.keys(rows).length; i++)
					text += "@" + rows[i].username + ", ";
				text = text.slice(0, -2) + "!";
				bot.sendMessage(message.chat.id, text, options);

				connection.query("UPDATE team SET tag_date = NOW() WHERE id = " + team_id, function (err, rows) {
					if (err) throw err;
				});
			});
		});
	});
});

bot.onText(/^\/tstats(?:@\w+)? (.+)/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, region FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;
		var region = rows[0].region;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		var mark = {
			parse_mode: "HTML"
		};
		
		if (api_disabled == 1) {
			bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
			return;
		}

		var team_name = match[1];

		connection.query("SELECT id FROM team WHERE group_id = '" + message.chat.id + "' AND name = '" + team_name + "'", function (err, rows) {
			if (err) throw err;
			var team_id = rows[0].id;
			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_team_notfound[lang], options);
				return;
			}
			connection.query("SELECT U.default_username, U.default_platform FROM team_member T, user U WHERE T.username = U.last_username AND T.team_id = " + team_id, function (err, rows) {
				if (err) throw err;
				var len = Object.keys(rows).length;
				if (len == 0){
					bot.sendMessage(message.chat.id, lang_team_notmembers[lang], options);
					return;
				}
				if (len > 5){
					bot.sendMessage(message.chat.id, lang_team_numlimit[lang], options);
					return;
				}
				var textDone = 0;
				var text = "<b>" + message.from.username + "</b> " + lang_team_stats[lang] + ":\n";
				bot.sendChatAction(message.chat.id, "typing").then(function () {
					for (i = 0; i < len; i++){
						r6.stats(rows[i].default_username, rows[i].default_platform, -1, region, 0).then(response => {
							if (response.level != undefined)
								text += getDataLine(response, lang) + "\n";

							textDone++;
							if (textDone >= len)
								bot.sendMessage(message.chat.id, text, options);
						}).catch(error => {
							textDone++;
							if (textDone >= len)
								bot.sendMessage(message.chat.id, text, options);
						});
					}
				});

				connection.query("UPDATE team SET stats_date = NOW() WHERE id = " + team_id, function (err, rows) {
					if (err) throw err;
				});
			});
		});
	});
});

bot.onText(/^\/addteam(?:@\w+)? (.+)|^\/addteam(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		var parts = message.text.split(" ");
		if (parts.length < 3){
			bot.sendMessage(message.chat.id, lang_team_invalid_syntax[lang], options);
			return;
		}

		var team_name = parts[1];
		var members = parts[2];

		var re = new RegExp("^[a-zA-Z0-9àèìòù\\-_ ]{1,64}$");
		if (re.test(team_name) == false) {
			bot.sendMessage(message.chat.id, lang_team_invalid_name[lang], options);
			return;
		}

		if (members.indexOf("@") != -1){
			bot.sendMessage(message.chat.id, lang_team_invalid_at[lang], options);
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
					bot.sendMessage(message.chat.id, lang_team_invalid_count[lang], options);
					return;
				}
				connection.query("INSERT INTO team (group_id, name, tag_date, stats_date) VALUES (" + message.chat.id + ",'" + team_name + "', NOW(), NOW())", function (err, rows, fields) {
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

					bot.sendMessage(message.chat.id, lang_team_created[lang] + ", " + added + " " + lang_team_users_added[lang] + "!", options);
				});
				return;
			} else {
				var team_id = rows[0].id;
				var member_permission = connection_sync.query("SELECT username FROM team_member WHERE team_id = " + team_id + " AND role = 1");
				if (member_permission[0].username != message.from.username){
					bot.sendMessage(message.chat.id, lang_team_only_leader[lang], options);
					return;
				}
				var member_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM team_member WHERE team_id = " + team_id);
				member_cnt = member_cnt[0].cnt;
				if (member_cnt+(arr_members.length-1) > 10){
					bot.sendMessage(message.chat.id, lang_team_invalid_count[lang], options);
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

				bot.sendMessage(message.chat.id, added + " " + lang_team_users_added[lang] + "!", options);
			}
		});
	});
});

bot.onText(/^\/delteam(?:@\w+)? (.+)/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		var parts = message.text.split(" ");
		if (parts.length < 3){
			bot.sendMessage(message.chat.id, lang_team_invalid_syntax[lang], options);
			return;
		}

		var team_name = parts[1];
		var members = parts[2];

		var re = new RegExp("^[a-zA-Z0-9àèìòù\\-_ ]{1,64}$");
		if (re.test(team_name) == false) {
			bot.sendMessage(message.chat.id, lang_team_invalid_name[lang], options);
			return;
		}

		if (members.indexOf("@") != -1){
			bot.sendMessage(message.chat.id, lang_team_invalid_at[lang], options);
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
				bot.sendMessage(message.chat.id, lang_team_not_exists[lang], options);
			} else {
				var team_id = rows[0].id;
				var member_permission = connection_sync.query("SELECT username FROM team_member WHERE team_id = " + team_id + " AND role = 1");
				if (member_permission[0].username != message.from.username){
					bot.sendMessage(message.chat.id, lang_team_not_leader_del[lang], options);
					return;
				}
				var member_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM team_member WHERE team_id = " + team_id);
				member_cnt = member_cnt[0].cnt;
				var removed = 0;
				for (var i = 0; i < arr_members.length; i++){
					var member = connection_sync.query("SELECT role FROM team_member WHERE team_id = " + team_id + " AND username = '" + arr_members[i] + "'");
					if (Object.keys(member).length > 0){
						if (arr_members[i] == message.from.username){
							bot.sendMessage(message.chat.id, lang_team_remove_yourself[lang], options);
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

				bot.sendMessage(message.chat.id, removed + " " + lang_team_user_removed[lang] + team_deleted + "!", options);
			}
		});
	});
});

bot.onText(/^\/search(?:@\w+)? (.+)|^\/search(?:@\w+)?$/i, function (message, match) {
	var options_reply = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	var options = {parse_mode: "HTML"};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		if (match[1] == undefined){
			bot.sendMessage(message.chat.id, lang_invalid_platform[lang], options_reply);
			return;
		}

		var platform = match[1].toLowerCase();
		if (platform == "ps4")
			platform = "psn";
		else if (platform == "pc")
			platform = "uplay";
		else if (platform.indexOf("xbox") != -1)
			platform = "xbl";
		if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
			bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang], options_reply);
			return;
		}

		connection.query("SELECT default_username FROM user WHERE default_platform = '" + platform + "' AND lang = '" + lang + "' AND default_username IS NOT NULL ORDER BY default_username", function (err, rows, fields) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_search_noplayers[lang], options_reply);
				return;
			}

			var list = lang_search_found[lang] + " " + platform + ":";
			for (var i = 0, len = Object.keys(rows).length; i < len; i++)
				list += "\n" + rows[i].default_username;

			if (message.chat.id < 0)
				bot.sendMessage(message.chat.id, "<i>" + lang_private[lang] + "</i>", options_reply);
			bot.sendMessage(message.from.id, list, options);
		});
	});
});

bot.onText(/^\/dist(?:@\w+)?$/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		if (message.chat.id > 0) {
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		connection.query("SELECT default_platform, COUNT(default_platform) As num, (SELECT COUNT(default_platform) FROM user WHERE last_chat_id = '" + message.chat.id + "' AND default_platform IS NOT NULL) As num_tot FROM user WHERE last_chat_id = '" + message.chat.id + "' AND default_platform IS NOT NULL GROUP BY default_platform", function (err, rows, fields) {
			if (err) throw err;

			if (Object.keys(rows).length == 0){
				bot.sendMessage(message.chat.id, lang_dist_noplayers[lang], options);
				return;
			}

			var list = "<b>" + lang_dist[lang] + "</b>";
			for (var i = 0, len = Object.keys(rows).length; i < len; i++)
				list += "\n" + decodePlatform(rows[i].default_platform) + ": " + Math.round(rows[i].num/rows[i].num_tot*100) + "%";

			bot.sendMessage(message.chat.id, list, options);
		});
	});
});

bot.onText(/^\/distrank(?:@\w+)? (.+)|^\/distrank(?:@\w+)?$/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var lang = rows[0].lang;
		
		var platform_query = "";
		var platform_desc = "";
		if (match[1] != undefined){
			var platform = match[1].toLowerCase();
			if (platform == "ps4")
				platform = "psn";
			else if (platform == "pc")
				platform = "uplay";
			else if (platform.indexOf("xbox") != -1)
				platform = "xbl";
			if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
				bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang], options);
				return;
			}
			platform_query = "WHERE platform = '" + platform + "' ";
			platform_desc = " (" + decodePlatform(platform) + ")";
		}

		var mark = {
			parse_mode: "HTML"
		};

		connection.query("SELECT ROUND(MAX(season_mmr)) As max_mmr FROM player_history " + platform_query + "GROUP BY ubisoft_id HAVING max_mmr > 0 ORDER BY max_mmr ASC", function (err, rows, fields) {
			if (err) throw err;

			var rankArray = [];
			var list = "<b>" + lang_rank_dist[lang] + platform_desc + "</b>";
			var totElements = Object.keys(rows).length;
			for (var i = 0, len = Object.keys(rows).length; i < len; i++) {
				var key = mapRank(rows[i].max_mmr, lang);
				if (!Object.prototype.hasOwnProperty.call(rankArray, key))
					rankArray[key] = 1;
				else
					rankArray[key] += 1;
			}
			
			var rankKeys = Object.keys(rankArray);
			var element;
			var perc;
			for (var i = 0; i < rankKeys.length; i++) {
				element = rankArray[rankKeys[i]];
				perc = (Math.round(((element/totElements*100) + Number.EPSILON) * 100) / 100);
				list += "\n<b>" + rankKeys[i] + "</b>: " + perc + "%";
			}

			bot.sendMessage(message.chat.id, list, options);
		});
	});
});

bot.onText(/^\/top(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}

		var mark = {
			parse_mode: "HTML"
		};

		var text = "<b>" + lang_rank[rows[0].lang] + "</b>\n";
		var c = 1;
		var size = 25;

		var group_id = message.chat.id;
		if (group_id > 0){
			bot.sendMessage(message.chat.id, lang_only_groups[lang], options);
			return;
		}

		connection.query('SELECT username, platform, ranked_kd As points FROM player_history P, user U WHERE U.last_chat_id = "' + group_id + '" AND U.default_username = P.username AND P.id IN (SELECT MAX(id) FROM player_history GROUP BY username, platform) GROUP BY username, platform ORDER BY ranked_kd DESC', function (err, rows, fields) {
			if (err) throw err;
			for (var i = 0; i < size; i++){
				text += c + "° <b>" + rows[i].username + "</b> on " + decodePlatform(rows[i].platform) + " (" + rows[i].points + ")\n";
				c++;
			}

			bot.sendMessage(message.chat.id, text, options);
		});
	});
});

bot.onText(/^\/parse(?:@\w+)?/i, function (message, match) {
	if ((message.from.id == 20471035) || (message.from.id == 200492030)) {
		if (message.reply_to_message == undefined){
			console.log("Use this in reply mode");
			return;
		}

		var options = {parse_mode: "HTML", reply_to_message_id: message.reply_to_message.message_id};

		var res = parse(message.reply_to_message, 1);

		if (res == "platform") {
			var nick = "";
			if (message.from.username == undefined)
				nick = message.from.first_name;
			else
				nick = message.from.username;
			
			bot.sendMessage(message.chat.id, nick + ", specifica la piattaforma ed invia nuovamente il reclutamento!", options);
		}
		if (res == "ok") {
			var iKeys = [];
			iKeys.push([{
				text: "Vai al Canale 🔰",
				url: "https://t.me/joinchat/AAAAAE8VVBZcHbmaF3JuLw"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				}
			};

			var nick = "";
			if (message.reply_to_message.from.username == undefined)
				nick = message.reply_to_message.from.first_name;
			else
				nick = message.reply_to_message.from.username;

			bot.sendMessage(message.chat.id, nick + ", il tuo reclutamento è stato postato automaticamente nel <b>Canale Reclutamenti</b>!", opt);

			bot.deleteMessage(message.chat.id, message.message_id);
		}
	}
});

bot.onText(/^\/find (.+)(?:@\w+)?|^\/find(?:@\w+)?/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	connection.query("SELECT lang, default_username, default_platform FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			var iKeys = [];
			iKeys.push([{
				text: lang_config_inline[lang] + " ⚙️",
				url: "https://t.me/r6siegestatsbot?start=config"
			}]);
			var opt =	{
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: iKeys
				},
				reply_to_message_id: message.message_id
			};
			bot.sendMessage(message.chat.id, lang_startme[lang] + " /find", opt);
			return;
		}

		var lang = rows[0].lang;

		var mark = {
			parse_mode: "HTML"
		};

		if (match[1] != undefined){
			var platform = match[1].toLowerCase();
			if ((platform != "uplay") && (platform != "psn") && (platform != "xbl")){
				bot.sendMessage(message.chat.id, lang_invalid_platform_2[lang], options);
				return;
			}
		} else {
			if (rows[0].default_platform != null)
				var platform = rows[0].default_platform;
			else {
				bot.sendMessage(message.chat.id, lang_invalid_find[lang], options);
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
			reply_to_message_id: message.message_id,
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
		bot.sendMessage(message.chat.id, "Done");
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

bot.onText(/^\/creport(?:@\w+)? (.+)/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Weekly report generation called manually on chat id " + match[1]);
		reportType = 1;
		reportProgress(match[1]);
	}
});

bot.onText(/^\/dreport(?:@\w+)?/i, function (message, match) {
	if (message.from.id == 20471035) {
		console.log(getNow("it") + " Daily report generation called manually");
		reportDailyProgress(message.chat.id);
	}
});

bot.onText(/^\/maprank (.+)|^\/maprank/i, function (message, match) {
	var options = {parse_mode: "HTML", reply_to_message_id: message.message_id};
	
	connection.query("SELECT lang FROM user WHERE account_id = " + message.from.id, function (err, rows) {
		if (err) throw err;
		if (Object.keys(rows).length == 0){
			var lang = defaultLang;
			if (message.from.language_code != undefined){
				if (validLang.indexOf(message.from.language_code) != -1)
					lang = message.from.language_code;
			}
			rows[0] = {};
			rows[0].lang = lang;
		}
		
		if (match[1] == undefined) {
			bot.sendMessage(message.chat.id, lang_maprank_error[lang], options);
			return;
		}
		
		bot.sendMessage(message.chat.id, mapRank(match[1], rows[0].lang));
	});
});

// Functions

function operatorsPdf(message, header, content, fileName) {
	var doc = new PDFDocument ({
		margin: 25
	})
	var writeStream = fs.createWriteStream(fileName);
	doc.pipe(writeStream);
	var c = 1;
	var tableRows = [];
	for (var i = 0, len = content.length; i < len; i++) {
		if (content[i] == undefined)
			continue;
		tableRows.push(content[i]);
		c++;
	}

	var table = {
		headers: header,
		rows: tableRows
	};

	doc.table(table, {
		prepareHeader: () => doc.font('Helvetica-Bold').fontSize(11),
		prepareRow: (row, i) => doc.font('Helvetica').fontSize(11)
	});

	doc.end();
	writeStream.on('finish', function () {
		bot.sendDocument(message.chat.id, fileName).then(function (data) {
			fs.unlink(fileName, function (err) {
				if (err) throw err;
			});
		});
	});
}

function mapError(errorCode, errorMsg) {
	if (errorCode == 1100)
		return "Api overloaded, retry after some minutes";
	return errorMsg;
}

function decodeStatus(status, maintenance, lang) {
	status = status.toLowerCase();
	if (maintenance == true)
		return lang_status_maintenance[lang];
	else if (status == "online")
		return lang_status_online[lang];
	else if (status == "interrupted")
		return lang_status_interrupted[lang];
	else if (status == "degraded")
		return lang_status_degraded[lang];
	else
		return status;
}

function getCheckStats(response1, response2, lang) {
	var season_mmr1 = Math.round(response1.season_mmr);
	var season_mmr2 = Math.round(response2.season_mmr);
	var diff = Math.max(season_mmr1, season_mmr2)-Math.min(season_mmr1, season_mmr2);
	var res = lang_check_yes[lang];
	if (diff > 1000)
		res = lang_check_no[lang];

	var lang_string = lang_check_res[lang];
	lang_string = lang_string.replace("%a", response1.username);
	lang_string = lang_string.replace("%b", response2.username);
	lang_string = lang_string.replace("%c", res);
	lang_string = lang_string.replace("%d", diff);
	
	return lang_string;
}

function getCompareStats(response1, response2, lang) {
	return "<i>" + response1.username + " vs " + response2.username + "</i>\n\n" +
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
		"<b>" + lang_season_mmr[lang] + "</b>: " + compare(Math.round(response1.season_mmr), Math.round(response2.season_mmr), "number") + "\n" +
		"<b>" + lang_season_max_mmr[lang] + "</b>: " + compare(Math.round(response1.season_max_mmr), Math.round(response2.season_max_mmr), "number")  + "\n" +  
		"\n<b>" + lang_title_mode[lang] + "</b>:\n" +
		"<b>" + lang_mode_secure[lang] + "</b>: " + compare(response1.mode_secure, response2.mode_secure, "number") + "\n" +
		"<b>" + lang_mode_hostage[lang] + "</b>: " + compare(response1.mode_hostage, response2.mode_hostage, "number") + "\n" +
		"<b>" + lang_mode_bomb[lang] + "</b>: " + compare(response1.mode_bomb, response2.mode_bomb, "number");
}

function multipleStats(message, players, platform, options, lang, region) {
	var text = "";
	var textDone = 0;
	
	if (api_disabled == 1) {
		bot.sendMessage(message.chat.id, lang_unavailable[lang], options);
		return;
	}

	bot.sendChatAction(message.chat.id, "typing").then(function () {
		for (i = 0; i < players.length; i++){
			r6.stats(players[i], platform, -1, region, 0).then(response => {
				if (response.level != undefined)
					text += getDataLine(response, lang) + "\n";

				textDone++;
				if (textDone >= players.length)
					bot.sendMessage(message.chat.id, text, options);
			}).catch(error => {
				textDone++;
				if (textDone >= players.length)
					bot.sendMessage(message.chat.id, text, options);
			});
		}
	});
}

function contest_group(message) {
	if (message.chat.id == r6italy_chatid) {
		// if (message.new_chat_members != undefined) {
			connection.query("SELECT 1 FROM contest_group WHERE account_id = " + message.from.id + " AND chat_id = '" + message.chat.id + "'", function (err, rows) {
				if (err) throw err;
				if (Object.keys(rows).length == 0){
					connection.query("INSERT INTO contest_group (account_id, chat_id) VALUES (" + message.from.id + ", '" + message.chat.id + "')", function (err, rows) {
						if (err) throw err;
					});
				}
			});
		// }
	}
}

function capture_url(message) {
	if (message.chat.id != r6italy_chatid)
		return;
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	var nick = "";
	if (message.from.username == undefined)
		nick = message.from.first_name;
	else
		nick = message.from.username;
	
	var options = {parse_mode: "HTML", disable_web_page_preview: true};

	if ((message.text != undefined) || (message.caption != undefined)) {
		var text = message.text;
		if (message.caption != undefined)
			text = message.caption;

		var nick = "";
		if (message.from.username == undefined)
			nick = message.from.first_name;
		else
			nick = message.from.username;

		var twitch = text.match(/twitch\.tv\/([a-zA-Z0-9_-]+)/gi);
		if (twitch != null) {
			bot.deleteMessage(message.chat.id, message.message_id);
			
			var default_text = nick + lang_twitch[lang] + twitch[0];
			
			var reg = /twitch\.tv\/([a-z]+)/gi;
			var username = reg.exec(text);
            console.log("Username not found (url " + text + ")");
			if (username != null) {
				var url = 'https://api.twitch.tv/kraken/users?login=' + username[1];
				var headers = {
				  "Accept": "application/vnd.twitchtv.v5+json",
				  "Client-ID": config.twitchtoken
				}

				fetch(url, {method: 'GET', headers: headers}).then((res) => { return res.json() }).then((json) => {
					var user_id = json.users[0]._id;
					var display_name = json.users[0].display_name;
					var user_name = json.users[0].name;
					
					if (user_id == undefined) {
                        console.log("User_id value not found (username " + username[1] + ")");
						bot.sendMessage(message.chat.id, default_text, options);
						return;
					}
					
					url = 'https://api.twitch.tv/kraken/streams/' + user_id;

					fetch(url, {method: 'GET', headers: headers}).then((res) => { return res.json() }).then((json) => {
						if (json.stream == undefined) {
                            console.log("Stream object not found (user_id " + user_id + ")");
							bot.sendMessage(message.chat.id, default_text, options);
							return;
						}
						var stream_title = json.stream.channel.status;						
						bot.sendMessage(message.chat.id, display_name + lang_twitch_live[lang] + "!\n" + stream_title + "\n\n<a href='http://www.twitch.tv/" + user_name.toLowerCase() + "'>" + lang_twitch_view[lang] + "</a>", options);
					});
				});
			} else
				bot.sendMessage(message.chat.id, default_text, options);
		}

		var youtube = text.match(/youtube\.com(\/channel|\/user)\/([a-zA-Z0-9-]+)/gi);
		if (youtube != null) {
			bot.deleteMessage(message.chat.id, message.message_id);

			bot.sendMessage(message.chat.id, nick + lang_youtube[lang] + youtube[0], options);
		}
	}
}

function capture_reddit(message) {
	if (message.chat.id != r6italy_chatid)
		return;
	
	if (message.text == undefined)
		return;
	
	var lang = "en";
	if (message.from.language_code != undefined){
		if (validLang.indexOf(message.from.language_code) != -1)
			lang = message.from.language_code;
	}
	
	var found = /https:\/\/www.reddit\.com\/r\//i.test(message.text);
	if (found == false)
		return;
	
	var url = message.text;
	
	request({
		uri: url + ".json",
	}, function(error, response, body) {
		if (body == undefined) {
			console.log(url + ".json with undefined body");
			return;
		}
		var resp = JSON.parse(body);
		
		var data = resp[0]["data"]["children"][0]["data"];
		var title = data["title"];
		var author = data["author"];
		var media = data["media"];
		if (media == null)
			return;
		var video_url = media["reddit_video"]["fallback_url"];
		var audio_url = video_url.split("DASH_")[0] + "audio";
		
		console.log("New reddit video found, parsing... " + message.text);
		
		const downloadFile = (url, dest, callback) => {
			const file = fs.createWriteStream(dest);
			const req = https.get(url, (res) => {
				if (res.statusCode !== 200)
					return callback('File not found');
				const len = parseInt(res.headers['content-length'], 10);
				let dowloaded = 0;
				res.pipe(file);
				res.on('data', (chunk) => {
					dowloaded += chunk.length;
				}).on('end', () => {
					file.end();
					callback(null);
				}).on('error', (err) => {
					callback(err.message);
				})
			}).on('error', (err) => {
				fs.unlink(dest);
				callback(err.message);
			});
		}
		
		var fileVideoPath = "r6tmp/tmp.mp4";
		var fileAudioPath = "r6tmp/tmp.mp3";
		var outputFilePath = "r6tmp/res.mp4";
		
		downloadFile(video_url, fileVideoPath, (err) => {
			if (err) {
				console.log(err);
			} else {
				downloadFile(audio_url, fileAudioPath, (err) => {
					if (err) {
						console.log(err);
					} else {
						var command = ffmpeg().addInput(fileVideoPath).addInput(fileAudioPath).outputOptions([
							'-vcodec h264',
							'-acodec mp2',
							'-vf scale=1280:-1',
							'-crf 25'
						]).on('error', function(err) {
							console.log('Error: ' + err.message);
						}).on('end', function() {
							bot.deleteMessage(message.chat.id, message.message_id);
							bot.sendVideo(message.chat.id, outputFilePath, {caption: title + "\n" + lang_reddit[lang] + author}).then(function (data) {
								fs.unlink(fileVideoPath, function (err) {
									if (err) throw err;
								}); 
								fs.unlink(fileAudioPath, function (err) {
									if (err) throw err;
								});
								fs.unlink(outputFilePath, function (err) {
									if (err) throw err;
								});
							});
							console.log("Reddit video published");
						}).save(outputFilePath);
					}
				});
			}
		});
	});
}

function capture_parse(message) {
	if (message.chat.id != r6italy_chatid)
		return;
	
	var options = {parse_mode: "HTML"};

	var nick = "";
	var nick_warn = "";
	if (message.from.username == undefined) {
		nick = message.from.first_name;
		nick_warn = "\nPer essere contattato più facilmente, imposta un username su Telegram, puoi farlo dalle Impostazioni."
	} else
		nick = message.from.username;

	var res = parse(message);
	if (res == "platform")
		bot.sendMessage(message.chat.id, nick + ", specifica la piattaforma ed invia nuovamente il reclutamento!", options);
	if (res == "duplicate")
		bot.sendMessage(message.chat.id, nick + ", hai appena postato un reclutamento, riprova tra un po' di tempo!", options);
	if (res == "ok") {
		var iKeys = [];
		iKeys.push([{
			text: "Vai al Canale 🔰",
			url: "https://t.me/joinchat/AAAAAE8VVBZcHbmaF3JuLw"
		}]);
		var opt =	{
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: iKeys
			}
		};

		bot.sendMessage(message.chat.id, nick + ", il tuo reclutamento è stato postato automaticamente nel <b>Canale Reclutamenti</b>!" + nick_warn, opt);

		connection.query("INSERT INTO recruit_history (account_id, chat_id) VALUES (" + message.from.id + ", '" + message.chat.id + "')", function (err, rows) {
			if (err) throw err;
		});
	}
}

function roundTwoDecimal(value) {
	return parseFloat(value).toFixed(2);
}

function decodeMatchResult(value, lang) {
	if (value == 1)
		return "<b>" + lang_history_result_win[lang] + "</b>";
	else if (value == 2)
		return lang_history_result_lose[lang];
	else
		return value;
}

function parse(message, force = 0){
	if ((message.text == undefined) && (message.caption == undefined))
		return;

	var text = message.text;
	if (message.caption != undefined)
		text = message.caption;

	var text = text.replace(/[^a-zA-Z0-9\-_\s\.,]/g, " ");
	var author;
	if (message.from.username != undefined)
		author = "@" + message.from.username;
	else if (message.from.first_name != undefined)
		author = message.from.first_name;
	
	var response = "";

	if ((text.search(/recluto|recluta|reclutiamo|cerchiamo|provini|provino|requisiti|cerc[o|a] player/gmi) == -1) && (force == 0))
		return;

	var clanNameFound = "";
	var clanName = text.match(/^clan [\w ]+$|^team [\w ]+$/gmi);
	if (clanName != null)
		clanNameFound = " " + jsUcall(clanName[0].replace(/\s+/g, ' '));
	else {
		var team = text.search(/team/gmi);
		var clan = text.search(/clan/gmi);
		if ((team != -1) || (clan != -1)) {
			if ((team != -1) && (clan != -1))
				response += "<b>Tipo gruppo</b>: Team e Clan\n";
			else if (team != -1)
				response += "<b>Tipo gruppo</b>: Team\n";
			else
				response += "<b>Tipo gruppo</b>: Clan\n";
		}
	}
	var header = "🔰 <b>Reclutamento" + clanNameFound + "</b> 🔰\n";
	var age = text.match(/(\d){2} anni|età (\d){2}|(\d){2} in su|(\d){2} in poi|(\s[1-3][0-9]\s){1}/gmi);
	if (age != null)
		response += "<b>Età</b>: " + age[0].trim() + "\n";
	var rank = text.match(/(platino|oro|argento|bronzo|rame) (\d){1}|(platino|oro|argento|bronzo|rame)(\d){1}|(platino|oro|argento|bronzo|rame|diamante|campione)/gmi);
	if (rank != null) {
		for (var i = 0; i < rank.length; i++)
			rank[i] = jsUcfirst(rank[i].toLowerCase());
		rank = uniq(rank);
		response += "<b>Rango</b>: " + rank.join(", ") + "\n";
	}
	var miss_plat = 0;
	var platform = text.match(/pc|ps4|xbox/gmi);
	if (platform != null) {
		for (var i = 0; i < platform.length; i++)
			platform[i] = jsUcfirst(platform[i].toLowerCase());
		platform = uniq(platform);
		response += "<b>Piattaforma</b>: " + platform.join(", ") + "\n";
	} else
		miss_plat = 1;
	var rateo = text.match(/((\d)\.(\d))|((\d)\,(\d))/gmi);
	if (rateo != null)
		response += "<b>Rateo</b>: " + rateo[0].trim() + "\n";
	else {
		var regexp = RegExp('([0-9]) di kd', 'gmi');
		var rateo = regexp.exec(text);
		if (rateo != null)
			response += "<b>Rateo U/M</b>: " + rateo[1].trim() + "\n";
	}
	var regexp = RegExp('livello ([0-9]+)|lv ([0-9]+)', 'gmi');
	var lev = regexp.exec(text);
	if (lev != null){
		if (lev[1] != undefined)
			response += "<b>Livello</b>: " + lev[1].trim() + "\n";
		else if (lev[2] != undefined)
			response += "<b>Livello</b>: " + lev[2].trim() + "\n";
	}
	var competitive = text.search(/competitivo|esl|cw|go4|ladder|g4g/gmi);
	if (competitive != -1) {
		var competitive_more = text.match(/esl|cw|go4|ladder|g4g/gmi);
		if (competitive_more != null) {
			for (var i = 0; i < competitive_more.length; i++)
				competitive_more[i] = jsUcfirst(competitive_more[i].toLowerCase());
			competitive_more = uniq(competitive_more);
			response += "<b>Competitivo</b>: " + competitive_more.join(", ") + "\n";
		} else
			response += "<b>Competitivo</b>: Sì\n";
	}
	var audition = text.search(/provino|provini/gmi);
	if (audition != -1)
		response += "<b>Provino</b>: Sì\n";
	var training = text.search(/allenament/gmi);
	if (training != -1) {
		var weekly = text.search(/settimana/gmi);
		var daily = text.search(/giornaliero/gmi);
		if (weekly != -1)
			response += "<b>Allenamenti</b>: Settimanali\n";
		else if (daily != -1)
			response += "<b>Allenamenti</b>: Giornalieri\n";
		else
			response += "<b>Allenamenti</b>: Sì\n";
	}
	var regex = new RegExp(/instagram|twitter|sito web|discord|whatsapp|telegram/gmi);
	var social = text.search(regex);
	if (social != -1) {
		var social_more = text.match(regex);
		if (social_more != null) {
			for (var i = 0; i < social_more.length; i++)
				social_more[i] = jsUcfirst(social_more[i].toLowerCase());
			social_more = uniq(social_more);
			response += "<b>Social</b>: " + social_more.join(", ") + "\n";
		}
	}
	
	var regex = new RegExp(/igl|entry|fragger|support|breacher|roamer|anchor/gmi);
	var role = text.search(regex);
	if (role != -1) {
		var role_more = text.match(regex);
		if (role_more != null) {
			for (var i = 0; i < role_more.length; i++)
				role_more[i] = jsUcfirst(role_more[i].toLowerCase());
			role_more = uniq(role_more);
			response += "<b>Ruoli</b>: " + role_more.join(", ") + "\n";
		}
	}

	if (response == "") {
		// console.log("Response empty");
		return;
	}
	
	bot.deleteMessage(message.chat.id, message.message_id);
	
	var check = connection_sync.query("SELECT account_id, chat_id FROM recruit_history ORDER BY id DESC");
	if ((Object.keys(check).length == 0) || (check[0].account_id != message.from.id) || (check[0].chat_id != message.chat.id)) {
		// continue...
	} else
		return "duplicate";

	if (miss_plat == 1)
		return "platform";

	response += "\n<i>Contattare</i> " + author;
	
	bot.sendMessage(-1001326797846, header + response, html);
	return "ok";
}

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
	} else
		resp = itemOrig;
	return resp;
}

function mapRank(rank, lang, top_pos = 0){
	var rank_text = "";
	if (rank == 0)
		rank_text = lang_season_not_ranked[lang];
	else if (rank < 1200)
		rank_text = lang_rank_copper5[lang];
	else if ((rank >= 1200) && (rank < 1300))
		rank_text = lang_rank_copper4[lang];
	else if ((rank >= 1300) && (rank < 1400))
		rank_text = lang_rank_copper3[lang];
	else if ((rank >= 1400) && (rank < 1500))
		rank_text = lang_rank_copper2[lang];
	else if ((rank >= 1500) && (rank < 1600))
		rank_text = lang_rank_copper1[lang];

	else if ((rank >= 1600) && (rank < 1700))
		rank_text = lang_rank_bronze5[lang];
	else if ((rank >= 1700) && (rank < 1800))
		rank_text = lang_rank_bronze4[lang];
	else if ((rank >= 1800) && (rank < 1900))
		rank_text = lang_rank_bronze3[lang];
	else if ((rank >= 1900) && (rank < 2000))
		rank_text = lang_rank_bronze2[lang];
	else if ((rank >= 2000) && (rank < 2100))
		rank_text = lang_rank_bronze1[lang];

	else if ((rank >= 2100) && (rank < 2200))
		rank_text = lang_rank_silver5[lang];
	else if ((rank >= 2200) && (rank < 2300))
		rank_text = lang_rank_silver4[lang];
	else if ((rank >= 2300) && (rank < 2400))
		rank_text = lang_rank_silver3[lang];
	else if ((rank >= 2400) && (rank < 2500))
		rank_text = lang_rank_silver2[lang];
	else if ((rank >= 2500) && (rank < 2600))
		rank_text = lang_rank_silver1[lang];

	else if ((rank >= 2600) && (rank < 2800))
		rank_text = lang_rank_gold3[lang];
	else if ((rank >= 2800) && (rank < 3000))
		rank_text = lang_rank_gold2[lang];
	else if ((rank >= 3000) && (rank < 3200))
		rank_text = lang_rank_gold1[lang];

	else if ((rank >= 3200) && (rank < 3600))
		rank_text = lang_rank_platinum3[lang];
	else if ((rank >= 3600) && (rank < 4000))
		rank_text = lang_rank_platinum2[lang];
	else if ((rank >= 4000) && (rank < 4400))
		rank_text = lang_rank_platinum1[lang];

	else if ((rank >= 4400) && (rank < 5000))
		rank_text = lang_rank_diamond[lang];
	else
		rank_text = lang_rank_champion[lang];

	if (top_pos > 0)
		rank_text += " #" + top_pos;

	return rank_text;
}

function sortSeasons(seasonArray){
	var text = "";
	seasonArray = seasonArray.reverse();
	for(i = 0; i < seasonArray.length; i++){
		if (seasonArray[i] != undefined)
			text += seasonArray[i];
	}
	return text;
}

function getData(response, lang){
	var text = "<b>" + lang_username[lang] + "</b>: " + response.username + "\n" +
		"<b>" + lang_platform[lang] + "</b>: " + decodePlatform(response.platform) + "\n" +
		"<b>" + lang_level[lang] + "</b>: " + response.level + "\n" +
		"<b>" + lang_xp[lang] + "</b>: " + formatNumber(response.xp, lang) + "\n" +
		"\n<b>" + lang_title_ranked[lang] + "</b>:\n" +
		"<b>" + lang_ranked_plays[lang] + "</b>: " + formatNumber(response.ranked_plays, lang) + "\n" +
		"<b>" + lang_ranked_win[lang] + "</b>: " + formatNumber(response.ranked_wins, lang) + "\n" +
		"<b>" + lang_ranked_losses[lang] + "</b>: " + formatNumber(response.ranked_losses, lang) + "\n" +
		"<b>" + lang_ranked_wl[lang] + "</b>: " + formatDecimal(response.ranked_wl, lang) + "\n" +
		"<b>" + lang_ranked_kills[lang] + "</b>: " + formatNumber(response.ranked_kills, lang) + "\n" +
		"<b>" + lang_ranked_deaths[lang] + "</b>: " + formatNumber(response.ranked_deaths, lang) + "\n" +
		"<b>" + lang_ranked_kd[lang] + "</b>: " + formatDecimal(response.ranked_kd, lang) + "\n" +
		"<b>" + lang_ranked_playtime[lang] + "</b>: " + toTime(response.ranked_playtime, lang) + " (" + toTime(response.ranked_playtime, lang, true) + ")\n" +
		"\n<b>" + lang_title_casual[lang] + "</b>:\n" +
		"<b>" + lang_casual_plays[lang] + "</b>: " + formatNumber(response.casual_plays, lang) + "\n" +
		"<b>" + lang_casual_win[lang] + "</b>: " + formatNumber(response.casual_wins, lang) + "\n" +
		"<b>" + lang_casual_losses[lang] + "</b>: " + formatNumber(response.casual_losses, lang) + "\n" +
		"<b>" + lang_casual_wl[lang] + "</b>: " + formatDecimal(response.casual_wl, lang) + "\n" +
		"<b>" + lang_casual_kills[lang] + "</b>: " + formatNumber(response.casual_kills, lang) + "\n" +
		"<b>" + lang_casual_deaths[lang] + "</b>: " + formatNumber(response.casual_deaths, lang) + "\n" +
		"<b>" + lang_casual_kd[lang] + "</b>: " + formatDecimal(response.casual_kd, lang) + "\n" +
		"<b>" + lang_casual_playtime[lang] + "</b>: " + toTime(response.casual_playtime, lang) + " (" + toTime(response.casual_playtime, lang, true) + ")\n" +
		"\n<b>" + lang_title_general[lang] + "</b>:\n" +
		"<b>" + lang_revives[lang] + "</b>: " + formatNumber(response.revives, lang) + "\n" +
		"<b>" + lang_suicides[lang] + "</b>: " + formatNumber(response.suicides, lang) + "\n" +
		"<b>" + lang_reinforcements[lang] + "</b>: " + formatNumber(response.reinforcements_deployed, lang) + "\n" +
		"<b>" + lang_barricades[lang] + "</b>: " + formatNumber(response.barricades_built, lang) + "\n" +
		"<b>" + lang_bullets_hit[lang] + "</b>: " + formatNumber(response.bullets_hit, lang) + "\n" +
		"<b>" + lang_headshots[lang] + "</b>: " + formatNumber(response.headshots, lang) + "\n" +
		"<b>" + lang_melee_kills[lang] + "</b>: " + formatNumber(response.melee_kills, lang) + "\n" +
		"<b>" + lang_penetration_kills[lang] + "</b>: " + formatNumber(response.penetration_kills, lang) + "\n" +
		"<b>" + lang_assists[lang] + "</b>: " + formatNumber(response.assists, lang) + "\n" +
		"\n<b>" + lang_title_season[lang] + "</b>:\n" +
		"<b>" + lang_season_mmr[lang] + "</b>: " + formatNumber(Math.round(response.season_mmr), lang) + " (" + mapRank(Math.round(response.season_mmr), lang, response.top_rank_position) + ")\n" +
		"<b>" + lang_season_max_mmr[lang] + "</b>: " + formatNumber(Math.round(response.season_max_mmr), lang) + " (" + mapRank(Math.round(response.season_max_mmr), lang, response.top_rank_position) + ")\n" +
		"\n<b>" + lang_title_mode[lang] + "</b>:\n" +
		"<b>" + lang_mode_secure[lang] + "</b>: " + formatNumber(response.mode_secure, lang) + " " + lang_points[lang] + "\n" +
		"<b>" + lang_mode_hostage[lang] + "</b>: " + formatNumber(response.mode_hostage, lang) + " " + lang_points[lang] + "\n" +
		"<b>" + lang_mode_bomb[lang] + "</b>: " + formatNumber(response.mode_bomb, lang) + " " + lang_points[lang] + "\n"; // a capo finale

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
	var most_melee = 0;
	var most_melee_name = "";
	var most_headshot = 0;
	var most_headshot_name = "";
	var most_dbno = 0;
	var most_dbno_name = "";

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
		if (response[operators[i]].operatorpvp_meleekills > most_melee){
			most_melee = response[operators[i]].operatorpvp_meleekills;
			most_melee_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_headshot > most_headshot){
			most_headshot = response[operators[i]].operatorpvp_headshot;
			most_headshot_name = operators[i];
		}
		if (response[operators[i]].operatorpvp_dbno > most_dbno){
			most_dbno = response[operators[i]].operatorpvp_dbno;
			most_dbno_name = operators[i];
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
	most_melee_name = jsUcfirst(most_melee_name);
	most_headshot_name = jsUcfirst(most_headshot_name);
	most_dbno_name = jsUcfirst(most_dbno_name);

	return [most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name, most_melee, most_melee_name, most_headshot, most_headshot_name, most_dbno, most_dbno_name];
}

function getOperatorsText(most_played, most_played_name, most_wins, most_wins_name, most_losses, most_losses_name, most_kills, most_kills_name, most_deaths, most_deaths_name, most_playtime, most_playtime_name, most_kd, most_kd_name, most_wl, most_wl_name, most_meleekills, most_meleekills_name, most_headshot, most_headshot_name, most_dbno, most_dbno_name, lang){
	return "\n<b>" + lang_title_operators[lang] + "</b>:\n" +
		"<b>" + lang_op_kd[lang] + "</b>: " + most_kd_name + " (" + formatDecimal(most_kd, lang) + ")\n" +
		"<b>" + lang_op_wl[lang] + "</b>: " + most_wl_name + " (" + formatDecimal(most_wl, lang) + ")\n" +
		"<b>" + lang_op_plays[lang] + "</b>: " + most_played_name + " (" + formatNumber(most_played, lang) + ")\n" +
		"<b>" + lang_op_wins[lang] + "</b>: " + most_wins_name + " (" + formatNumber(most_wins, lang) + ")\n" +
		"<b>" + lang_op_losses[lang] + "</b>: " + most_losses_name + " (" + formatNumber(most_losses, lang) + ")\n" +
		"<b>" + lang_op_kills[lang] + "</b>: " + most_kills_name + " (" + formatNumber(most_kills, lang) + ")\n" +
		"<b>" + lang_op_deaths[lang] + "</b>: " + most_deaths_name + " (" + formatNumber(most_deaths, lang) + ")\n" +
		"<b>" + lang_op_playtime[lang] + "</b>: " + most_playtime_name + " (" + toTime(most_playtime, lang, true) + ")\n" +
		"<b>" + lang_op_meleekills[lang] + "</b>: " + most_meleekills_name + " (" + formatNumber(most_meleekills, lang) + ")\n" +
		"<b>" + lang_op_headshot[lang] + "</b>: " + most_headshot_name + " (" + formatNumber(most_headshot, lang) + ")\n" +
		"<b>" + lang_op_dbno[lang] + "</b>: " + most_dbno_name + " (" + formatNumber(most_dbno, lang) + ")";
}

function printInline(query_id, response, lang){
	bot.answerInlineQuery(query_id, [{
		id: '0',
		type: 'article',
		title: lang_inline_userinfo[lang],
		description: lang_inline_userfound[lang],
		message_text: shortStats(response, lang) + "\n\n" + lang_inline_infos[lang],
		parse_mode: "HTML"
	}]);
}

function shortStats(response, lang) {
	return "<b>" + response.username + "</b> (Lv " + response.level + " - " + decodePlatform(response.platform) + ")\n\n" +
		"<b>" + lang_inline_season[lang] + "</b>: " + mapRank(Math.round(response.season_mmr), lang, response.top_rank_position) + " (" + Math.round(response.season_mmr) + ")\n" + 
		"<b>" + lang_inline_ranked_kd[lang] + "</b>: " + formatDecimal(response.ranked_kd, lang) + "\n" +
		"<b>" + lang_inline_ranked_playtime[lang] + "</b>: " + toTime(response.ranked_playtime, lang, true) + "\n" +
		"<b>" + lang_inline_casual_kd[lang] + "</b>: " + formatDecimal(response.casual_kd, lang) + "\n" +
		"<b>" + lang_inline_casual_playtime[lang] + "</b>: " + toTime(response.casual_playtime, lang, true) + "\n" +
		"<b>" + lang_inline_total_kills[lang] + "</b>: " + formatNumber(response.ranked_kills + response.casual_kills, lang) + "\n" +
		"<b>" + lang_inline_total_deaths[lang] + "</b>: " + formatNumber(response.ranked_deaths + response.casual_deaths, lang) + "\n" +
		"<b>" + lang_inline_total_wins[lang] + "</b>: " + formatNumber(response.ranked_wins + response.casual_wins, lang) + "\n" +
		"<b>" + lang_inline_total_losses[lang] + "</b>: " + formatNumber(response.ranked_losses + response.casual_losses, lang) + "\n" +
		"<b>" + lang_inline_best_operator[lang] + "</b>: " + response.operator_max_wl_name + " (" + formatDecimal(response.operator_max_wl, lang) + ")";
}

function saveData(responseStats, responseOps, activeLog){
	var ops = getOperators(responseOps);

	if (responseStats.profile_id == undefined){
		console.log(getNow("it") + " Data undefined for " + responseStats.username + ", flagged with undefined_track (user not exists)");
		console.log(responseStats);
		connection.query('UPDATE user SET undefined_track = 1 WHERE default_username = "' + responseStats.username + '"', function (err, rows) {
			if (err) throw err;
		});
	} else {
        connection.query('UPDATE user SET daily_report_sent = 0 WHERE default_username = "' + responseStats.username + '"', function (err, rows) {
			if (err) throw err;
		});
		connection.query('INSERT INTO player_history VALUES (DEFAULT, "' + 
                         responseStats.profile_id + '", "' +
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
						 responseStats.last_match_skill_stdev_change + ',' +
						 responseStats.last_match_mmr_change + ',' +
						 responseStats.last_match_skill_mean_change + ',' +
						 responseStats.last_match_result + ',' +
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
						 responseStats.top_rank_position + ',' +
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
						 ops[10] + ',"' +
						 ops[17] + '",' +
						 ops[16] + ',"' +
						 ops[19] + '",' +
						 ops[18] + ',"' +
						 ops[21] + '",' +
						 ops[20] + ',' +
						 'NOW())', function (err, rows) {
			if (err) throw err;
			if (activeLog == 1)
				console.log(getNow("it") + " Saved user data for " + responseStats.username);
		});
	}
}

function numToRank(num, lang, mmr = -1){
	var rankIt = [
		"Rame V", "Rame IV", "Rame III", "Rame II", "Rame I",
		"Bronzo V", "Bronzo IV", "Bronzo III", "Bronzo II", "Bronzo I",
		"Argento V", "Argento IV", "Argento III", "Argento II", "Argento I",
		"Oro III", "Oro II", "Oro I",
		"Platino III", "Platino II", "Platino I", "Diamante", "Campione"
	];
	var rankEn = [
		"Copper V", "Copper IV", "Copper III", "Copper II", "Copper I",
		"Bronze V", "Bronze IV", "Bronze III", "Bronze II", "Bronze I",
		"Silver V", "Silver IV", "Silver III", "Silver II", "Silver I",
		"Gold III", "Gold II", "Gold I",
		"Platinum III", "Platinum II", "Platinum I", "Diamond", "Champion"
	];

	if ((mmr == 0) || (num == 0))
		return lang_season_not_ranked[lang];

	if (lang == "it")
		return rankIt[num-1];
	else
		return rankEn[num-1];
}

function decodePlatform(platform){
	platform = platform.toLowerCase();
	if ((platform == "uplay") || (platform == "pc"))
		return "PC";
	else if ((platform == "psn") || (platform == "ps4"))
		return "PS4";
	else if ((platform == "xbl") || (platform == "xboxone"))
		return "Xbox One";
}

function updateChatId(from_id, chat_id) {
	if (chat_id < 0){
		connection.query('UPDATE user SET last_chat_id = "' + chat_id + '" WHERE account_id = ' + from_id, function (err, rows, fields) {
			if (err) throw err;
		});
	}
}

function updateUsername(from_id, username) {
	if (username != undefined){
		connection.query('UPDATE user SET last_username = "' + username + '" WHERE account_id = ' + from_id, function (err, rows, fields) {
			if (err) throw err;
		});
	}
}

function reportDailyProgress() {
	var query = "SELECT account_id, default_username, default_platform, lang FROM user WHERE daily_report = 1 AND daily_report_sent = 0 AND default_username IS NOT NULL AND default_platform IS NOT NULL";
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
	var player = connection_sync.query('SELECT username, platform, ranked_wl, ranked_kd, season_mmr FROM player_history WHERE username = "' + username + '" AND platform = "' + platform + '" AND insert_date BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY) AND CURRENT_DATE ORDER BY id DESC');
	if (Object.keys(player).length > 1){
		var lastId = Object.keys(player).length-1;
		report_head = "\n<b>" + player[0].username + "</b> " + lang_on[lang] + " " + decodePlatform(player[0].platform) + ":\n";
		report_line = "";
		report_line += calculateSym(lang_operator_wlratio[lang], player[0].ranked_wl, player[lastId].ranked_wl, 1, lang);
		report_line += calculateSym(lang_operator_kdratio[lang], player[0].ranked_kd, player[lastId].ranked_kd, 1, lang);
		report_line += calculateSym(lang_season_mmr[lang], player[0].season_mmr, player[lastId].season_mmr, 0, lang);
		if (report_line != "") {
			console.log("Daily report sent for user " + username + " on " + platform);
			bot.sendMessage(account_id, report + report_head + report_line, html);
            
            connection.query("UPDATE user SET daily_report_sent = 1 WHERE account_id = '" + account_id + "'", function (err, rows, fields) {
                if (err) throw err;
            });
		}
	}
}

function reportProgress(chat_id) {
	var query = "";
	if (chat_id != -1)
		query = "SELECT last_chat_id, lang FROM user WHERE last_chat_id = '" + chat_id + "' GROUP BY last_chat_id";
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
		interval = lang_report_header_week[lang] + "\n";
	} else if (reportType == 2) {
		intervalDays = 30;
		interval = lang_report_header_month[lang] + "\n";
	}
	var report = "<b>" + interval + "</b>\n";
	var cnt = 0;

	var lastId;
	var player;
	
	var most_xp = 0;
	var username_most_xp = "";
	var platform_most_xp = "";
	var most_ranked_plays = 0;
	var username_ranked_plays = "";
	var platform_ranked_plays = "";
	var most_ranked_wins = 0;
	var username_most_ranked_wins = "";
	var platform_most_ranked_wins = "";
	var most_ranked_losses = 0;
	var username_most_ranked_losses = "";
	var platform_most_ranked_losses = "";
	var most_ranked_kills = 0;
	var username_most_ranked_kills = "";
	var platform_most_ranked_kills = "";
	var most_ranked_deaths = 0;
	var username_most_ranked_deaths = "";
	var platform_most_ranked_deaths = "";
	var most_ranked_wl = 0;
	var username_most_ranked_wl = "";
	var platform_most_ranked_wl = "";
	var most_ranked_kd = 0;
	var username_most_ranked_kd = "";
	var platform_most_ranked_kd = "";
	var most_season_mmr = 0;
	var username_most_season_mmr = "";
	var platform_most_season_mmr = "";
	var most_headshots = 0;
	var username_most_headshots = "";
	var platform_most_headshots = "";
	
	var player_list = connection_sync.query('SELECT default_username, default_platform FROM user WHERE default_username IS NOT NULL AND default_platform IS NOT NULL AND last_chat_id = "' + last_chat_id + '"');
	for (var i = 0, len = Object.keys(player_list).length; i < len; i++) {
		player = connection_sync.query('SELECT username, platform, xp, ranked_plays, ranked_wins, ranked_losses, ranked_wl, ranked_kills, ranked_deaths, ranked_kd, season_mmr, headshots FROM player_history WHERE username = "' + player_list[i].default_username + '" AND platform = "' + player_list[i].default_platform + '" AND insert_date BETWEEN DATE_SUB(CURRENT_DATE, INTERVAL ' + intervalDays + ' DAY) AND CURRENT_DATE ORDER BY id DESC');
		if (Object.keys(player).length > 1) {
			var lastId = Object.keys(player).length-1;
			if (player[0].xp > player[lastId].xp) {
				var value = player[0].xp-player[lastId].xp;
				if (value > most_xp) {
					most_xp = value;
					username_most_xp = player[0].username;
					platform_most_xp = player[0].platform;
				}
			}
			if (player[0].ranked_plays > player[lastId].ranked_plays) {
				var value = player[0].ranked_plays-player[lastId].ranked_plays;
				if (value > most_ranked_plays) {
					most_ranked_plays = value;
					username_most_ranked_plays = player[0].username;
					platform_most_ranked_plays = player[0].platform;
				}
			}
			if (player[0].ranked_wins > player[lastId].ranked_wins) {
				var value = player[0].ranked_wins-player[lastId].ranked_wins;
				if (value > most_ranked_plays) {
					most_ranked_wins = value;
					username_most_ranked_wins = player[0].username;
					platform_most_ranked_wins = player[0].platform;
				}
			}
			if (player[0].ranked_losses > player[lastId].ranked_losses) {
				var value = player[0].ranked_losses-player[lastId].ranked_losses;
				if (value > most_ranked_losses) {
					most_ranked_losses = value;
					username_most_ranked_losses = player[0].username;
					platform_most_ranked_losses = player[0].platform;
				}
			}
			if (player[0].ranked_wl > player[lastId].ranked_wl) {
				var value = player[0].ranked_wl-player[lastId].ranked_wl;
				if (value > most_ranked_wl) {
					most_ranked_wl = value;
					username_most_ranked_wl = player[0].username;
					platform_most_ranked_wl = player[0].platform;
				}
			}
			if (player[0].ranked_kills > player[lastId].ranked_kills) {
				var value = player[0].ranked_kills-player[lastId].ranked_kills;
				if (value > most_ranked_kills) {
					most_ranked_kills = value;
					username_most_ranked_kills = player[0].username;
					platform_most_ranked_kills = player[0].platform;
				}
			}
			if (player[0].ranked_deaths > player[lastId].ranked_deaths) {
				var value = player[0].ranked_deaths-player[lastId].ranked_deaths;
				if (value > most_ranked_deaths) {
					most_ranked_deaths = value;
					username_most_ranked_deaths = player[0].username;
					platform_most_ranked_deaths = player[0].platform;
				}
			}
			if (player[0].ranked_kd > player[lastId].ranked_kd) {
				var value = player[0].ranked_kd-player[lastId].ranked_kd;
				if (value > most_ranked_kd) {
					most_ranked_kd = value;
					username_most_ranked_kd = player[0].username;
					platform_most_ranked_kd = player[0].platform;
				}
			}
			if (player[0].season_mmr > player[lastId].season_mmr) {
				var value = player[0].season_mmr-player[lastId].season_mmr;
				if (value > most_season_mmr) {
					most_season_mmr = value;
					username_most_season_mmr = player[0].username;
					platform_most_season_mmr = player[0].platform;
				}
			}
			if (player[0].headshots > player[lastId].headshots) {
				var value = player[0].headshots-player[lastId].headshots;
				if (value > most_headshots) {
					most_headshots = value;
					username_most_headshots = player[0].username;
					platform_most_headshots = player[0].platform;
				}
			}
		}
	}
	
	var report_line = "";
	if (most_xp > 0)
		report_line += "<b>" + lang_xp[lang] + "</b>: " + username_most_xp + " " + lang_on[lang] + " " + platform_most_xp + " (+" + formatNumber(most_xp, lang) + ")\n";
	if (most_ranked_plays > 0)
		report_line += "<b>" + lang_ranked_plays[lang] + "</b>: " + username_most_ranked_plays + " " + lang_on[lang] + " " + platform_most_ranked_plays + " (+" + formatNumber(most_ranked_plays, lang) + ")\n";
	if (most_ranked_wins > 0)
		report_line += "<b>" + lang_ranked_wins[lang] + "</b>: " + username_most_ranked_wins + " " + lang_on[lang] + " " + platform_most_ranked_wins + " (+" + formatNumber(most_ranked_wins, lang) + ")\n";
	if (most_ranked_losses > 0)
		report_line += "<b>" + lang_ranked_losses[lang] + "</b>: " + username_most_ranked_losses + " " + lang_on[lang] + " " + platform_most_ranked_losses + " (+" + formatNumber(most_ranked_losses, lang) + ")\n";
	if (most_ranked_wl > 0)
		report_line += "<b>" + lang_ranked_wl[lang] + "</b>: " + username_most_ranked_wl + " " + lang_on[lang] + " " + platform_most_ranked_wl + " (+" + formatDecimal(most_ranked_wl, lang) + ")\n";
	if (most_ranked_kills > 0)
		report_line += "<b>" + lang_ranked_kills[lang] + "</b>: " + username_most_ranked_kills + " " + lang_on[lang] + " " + platform_most_ranked_kills + " (+" + formatNumber(most_ranked_kills, lang) + ")\n";
	if (most_ranked_deaths > 0)
		report_line += "<b>" + lang_ranked_deaths[lang] + "</b>: " + username_most_ranked_deaths + " " + lang_on[lang] + " " + platform_most_ranked_deaths + " (+" + formatNumber(most_ranked_deaths, lang) + ")\n";
	if (most_ranked_kd > 0)
		report_line += "<b>" + lang_ranked_kd[lang] + "</b>: " + username_most_ranked_kd + " " + lang_on[lang] + " " + platform_most_ranked_kd + " (+" + formatDecimal(most_ranked_kd, lang) + ")\n";
	if (most_season_mmr > 0)
		report_line += "<b>" + lang_season_mmr[lang] + "</b>: " + username_most_season_mmr + " " + lang_on[lang] + " " + platform_most_season_mmr + " (+" + formatNumber(most_season_mmr, lang) + ")\n";
	if (most_headshots > 0)
		report_line += "<b>" + lang_headshots[lang] + "</b>: " + username_most_headshots + " " + lang_on[lang] + " " + platform_most_headshots + " (+" + formatNumber(most_headshots, lang) + ")\n";
	
	if (report_line != "") {
		bot.sendMessage(last_chat_id, report + report_line, html);
		console.log("Weekly/Monthly report sent for group " + last_chat_id);
	} else
		console.log("No data report for group " + last_chat_id);
}

function calculateSym(text, first, last, float, lang) {
	if (first == last)
		return "";
	var sym = "⬇";
	if (first > last)
		sym = "⬆";
	if (float == 1) {
		last = formatDecimal(parseFloat(last), lang);
		first = formatDecimal(parseFloat(first), lang);
	} else {
		last = Math.round(parseFloat(last));
		first = Math.round(parseFloat(first));
	}
	return "<i>" + text + "</i>: " + last + " -> " + first + " " + sym + "\n";
}

function checkTeam() {
	connection.query('SELECT id FROM team WHERE DATEDIFF(CURDATE(), CAST(tag_date As date)) > 15 OR DATEDIFF(CURDATE(), CAST(stats_date As date)) > 15', function (err, rows, fields) {
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
	if (api_disabled == 1) {
		console.log("Autotrack skipped cause api disabled");
		return;
	}
	api_overloaded = 0;
	connection.query("SELECT region, default_username, default_platform FROM user WHERE default_username IS NOT NULL AND default_platform IS NOT NULL AND undefined_track = 0 ORDER BY last_force_update DESC, last_update ASC", function (err, rows, fields) {
		if (err) throw err;

		if (Object.keys(rows).length > 0){
			console.log("Found " + Object.keys(rows).length + " users to check");
			rows.forEach(setAutoTrack);
		}else
			console.log("No users found");
	});
}

function setAutoTrack(element, index, array) {
	var region = element.region;
	var username = element.default_username;
	var platform = element.default_platform;
	
	if (api_overloaded == 1) {
		console.log(getNow("it") + " " + username + " on " + platform + " skipped cause overload");
		return;
	}

	r6.stats(username, platform, -1, region, 0).then(response => {

		var responseStats = response;

		connection.query('SELECT ranked_playtime, casual_playtime FROM player_history WHERE platform = "' + response.platform + '" AND username = "' + response.username + '" ORDER BY id DESC', function (err, rows) {
			if (err) throw err;

			var toSave = 0;
			if (Object.keys(rows).length == 0) {
				toSave = 1;
				console.log(getNow("it") + " " + username + " on " + platform + " created");
			} else if ((rows[0].ranked_playtime < responseStats.ranked_playtime) || (rows[0].casual_playtime < responseStats.casual_playtime)) {
				toSave = 1;
				console.log(getNow("it") + " " + username + " on " + platform + " updated");
			}

			if (toSave == 1) {
				r6.stats(username, platform, -1, region, 1).then(response => {
					var responseOps = response;
					if (toSave == 1)
						saveData(responseStats, responseOps, 0);
				});
			}
		});
	}).catch(error => {
		if (error.indexOf("overloaded") != -1)
			api_overloaded = 1;
		console.log(error);
		console.log(getNow("it") + " Autotrack for " + username + " on " + platform + " not found");
	});
};

function stripContent(text) {
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

function compare(val1, val2, format = "", lang = defaultLang, inverted = 0) {
	var res = "";
	var formattedVal1 = val1;
	var formattedVal2 = val2;

	if (format == "number"){
		formattedVal1 = formatNumber(formattedVal1, lang);
		formattedVal2 = formatNumber(formattedVal2, lang);
	}else if (format == "perc"){
		formattedVal1 = formatNumber(formattedVal1, lang) + "%";
		formattedVal2 = formatNumber(formattedVal2, lang) + "%";
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

function formatNumber(num, lang) {
	var char = ",";
	if (lang == "it")
		char = ".";
	return ("" + num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, function ($1) {
		return $1 + char;
	});
}

function formatDecimal(num, lang) {
	var startChar = ",";
	var endChar = ".";
	if (lang == "it") {
		startChar = /\./;
		endChar = ",";
	}
	
	return parseFloat(num).toFixed(3).replaceAll(startChar, endChar);
}

function toTime(seconds, lang = defaultLang, onlyHours = false) {
	if (onlyHours == true)
		return formatNumber(humanizeDuration(seconds*1000, { language: lang, units: ['h'], round: true }), lang);
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
