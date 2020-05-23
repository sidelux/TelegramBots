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

var validLang = ["en", "it"];
var defaultLang = "it";
var lang_add_bot = [];
var lang_already_linked = [];
var lang_link_done = [];
var lang_link_done_group = [];
var lang_link_admin = [];
var lang_start_private = [];
var lang_already_validated = [];
var lang_welcome_changed = [];
var lang_go_private = [];
var lang_start = [];

var lang_config_private = [];
var lang_add_group = [];
var lang_add_btn = [];
var lang_no_group = [];
var lang_select_group = [];

var lang_only_group = [];
var lang_reply = [];
var lang_not_conf = [];
var lang_user_validated = [];
var lang_user_validated_2 = [];

var lang_only_private = [];
var lang_group_not_exists = [];
var lang_actions = [];
var lang_complete = [];
var lang_action_btn = [];
var lang_action_propic = [];
var lang_action_username = [];
var lang_action_captcha = [];
var lang_action_lang = [];
var lang_action_recent = [];
var lang_welcome = [];

var lang_changed = [];
var lang_error_info = [];
var lang_error_auth = [];
var lang_action_complete = [];
var lang_error_propic = [];
var lang_error_username = [];
var lang_error_captcha = [];
var lang_error_lang = [];
var lang_error_recent = [];
var lang_menu = [];
var lang_delete = [];
var lang_not_set = [];
var lang_welcome_text = [];
var lang_deleted = [];
var lang_confirm_delete = [];
var lang_unlink = [];
var lang_unlinked = [];
var lang_action_first = [];
var lang_unmute = [];
var lang_automute = [];
var lang_action_enabled = [];
var lang_action_disabled = [];
var lang_totalblock = [];
var lang_totalblock_on = [];
var lang_totalblock_off = [];
var lang_button = [];
var lang_propic = [];
var lang_username = [];
var lang_captcha = [];
var lang_lang_mandatory = [];
var lang_lang_check = [];
var lang_recent = [];
var lang_unlink = [];
var lang_welcome_message = [];
var lang_manage = [];
var lang_disableall = [];
var lang_until_date = [];
var lang_only_until = [];
var lang_help = [];
var lang_help_private = [];

var lang_complete = [];
var lang_complete_group = [];

lang_add_bot["it"] = "Aggiungi il bot ad un gruppo per avviare l'associazione.";
lang_add_bot["en"] = "Add bot to a group to start link.";
lang_already_linked["it"] = "Questo gruppo è stato già associato ad un utente.";
lang_already_linked["en"] = "This group is already linked with a user.";
lang_link_done["it"] = "Hai associato il gruppo <b>%s</b>, ora impostalo come amministratore in modo che possa agire sugli utenti.\nDopo di che, usa <b>/config</b> per configurarlo.";
lang_link_done["en"] = "You have successfully linked the group <b>%s</b>, now promote as administrator as can do thing to users.\nAfter it, use <b>/config</config> to configure it.";
lang_link_done_group["it"] = "<b>%s</b> hai completato l'associazione con questo gruppo, ora continua la configurazione in privato.";
lang_link_done_group["en"] = "<b>%s</b> you have completed group link, now configure in private chat.";
lang_link_admin["it"] = "Puoi associare il bot ad un gruppo solo se sei amministratore di quest'ultimo.";
lang_link_admin["en"] = "You can link bot to a group only if your are an administrator.";
lang_start_private["it"] = "%s, avvia il bot in privato cliccando sul pulsante sottostante e segui le istruzioni per validarti ed essere smutato in questo gruppo!";
lang_start_private["en"] = "%s, start the bot in private chat by clicking button below and follow istructions to validate yourself and be unmuted in this group!";
lang_already_validated["it"] = "Validazione già eseguita in questo gruppo, accesso consentito.";
lang_already_validated["en"] = "Already validated in this group, access granted.";
lang_welcome_changed["it"] = "Messaggio di benvenuto impostato!\nPuoi continuare ad impostare il bot tramite i pulsanti del messaggio precedente.";
lang_welcome_changed["en"] = "Welcome message changed!\nYou can continue to setting the bot by buttons in the previous message.";
lang_go_private["it"] = "Vai in privato 👀";
lang_go_private["en"] = "Go in private chat 👀";
lang_start["it"] = "Avvia ✅";
lang_start["en"] = "Start ✅";

lang_config_private["it"] = "La configurazione può essere effettuata solamente in chat privata.";
lang_config_private["en"] = "You can only config bot via private chat.";
lang_add_group["it"] = "Aggiungi ad un gruppo 👥";
lang_add_group["en"] = "Add to group 👥";
lang_add_btn["it"] = "Per associare un gruppo utilizza il pulsante qui sotto e seleziona la chat.";
lang_add_btn["en"] = "To link a group use the button below and select a chat.";

lang_no_group["it"] = "Nessun gruppo associato al tuo account, utilizza /new per associarne uno nuovo.";
lang_no_group["en"] = "No group linked to your account, use /new to link a new one.";
lang_select_group["it"] = "Seleziona il gruppo da gestire.\nPotrai attivare o disattivare il bot, aggiungerne validazioni ed altro.";
lang_select_group["en"] = "Select a group to manage.\nYou'll can enable or disable bot, add validations and other.";

lang_only_group["it"] = "Questo comando può essere utilizzato solo in un gruppo.";
lang_only_group["en"] = "This command can be used only in a group."
lang_reply["it"] = "Questo comando va utilizzato in risposta all'utente richiesto o ad un suo messaggio inoltrato.";
lang_reply["en"] = "This command can be used only in reply of user requested or his forwarded message.";
lang_not_conf["it"] = "Questo gruppo non è stato configurato con il bot, utilizza prima il comando /new per collegarlo.";
lang_not_conf["en"] = "This group is not configured with the bot, use the command /new first to link it.";
lang_user_validated["it"] = "L'utente è stato memorizzato e validato con successo.";
lang_user_validated["en"] = "User saved and validated successfully.";
lang_user_validated_2["it"] = "L'utente è stato validato con successo.";
lang_user_validated_2["en"] = "User validated successfully.";

lang_only_private["it"] = "Il bot può essere avviato solamente in chat privata.";
lang_only_private["en"] = "Bot can be started only in private chat.";
lang_group_not_exists["it"] = "Il gruppo per l'accesso non esiste.";
lang_group_not_exists["en"] = "The group does not exists.";
lang_actions["it"] = "Il gruppo al quale hai effettuato l'accesso richiede <b>%s</b> diverse azioni da essere completate prima di poter scrivere al suo interno.\nUna volta completate sarai automaticamente smutato dal gruppo.";
lang_actions["en"] = "The group you requested access needs <b>%s</b> different actions to be completed before you can write inside.\nOnce completed you will be automatically unmuted from the group.";
lang_complete["it"] = "🔐 Completa";
lang_complete["en"] = "🔐 Complete";
lang_action_btn["it"] = "Clicca il pulsante sottostante per completare questa azione.";
lang_action_btn["en"] = "Click the button below to complete this action.";
lang_action_propic["it"] = "Se hai impostato l'immagine del profilo, clicca il pulsante sottostante per completare questa azione.";
lang_action_propic["en"] = "If you have a profile pic, click the button below to complete this action.";
lang_action_username["it"] = "Se hai impostato l'username, clicca il pulsante sottostante per completare questa azione.";
lang_action_username["en"] = "If you have a username, click the button below to complete this action.";
lang_action_captcha["it"] = 'Clicca il pulsante corrispondente al captcha per poter continuare e completare questa azione.';
lang_action_captcha["en"] = 'Click the button relative to captcha content to complete this action.';
lang_action_lang["it"] = "Verrà controllata la tua lingua impostata, clicca il pulsante sottostante per completare questa azione.";
lang_action_lang["en"] = "Bot will check your language, click the button below to complete this action.";
lang_action_recent["it"] = "Verrà controllata la data creazione del tuo account, clicca il pulsante sottostante per completare questa azione.";
lang_action_recent["en"] = "Bot will check your account creation date, click the button below to complete this action.";
lang_welcome["it"] = "Benvenuto in *Authorizator*!\n\nPuoi collegare un nuovo gruppo con il comando /new ed entrare nella gestione con il comando /config.\n\n%g gruppi collegati, %u utenti autorizzati\n_Ultimo aggiornamento: %d_";
lang_welcome["en"] = "Welcome in *Authorizator*!\n\nYou can link a new group using /new command and go to manage view with /config.\n\n%g linked groups, %u authorized users\n_Last update: %d_";

lang_changed["it"] = "Lingua modificata!";
lang_changed["en"] = "Language changed!";
lang_error_info["it"] = 'Errore info gruppo.';
lang_error_info["en"] = 'Group info error.';
lang_error_auth["it"] = 'Non sei autorizzato a gestire questo gruppo.';
lang_error_auth["en"] = 'You are not authorized to manage this group.';
lang_action_complete["it"] = "Azione completata ✅";
lang_action_complete["en"] = "Action completed ✅";
lang_error_propic["it"] = "Immagine del profilo non impostata! Accesso negato.";
lang_error_propic["en"] = "Profile picture not set! Access denied.";
lang_error_username["it"] = "Username non impostato! Accesso negato.";
lang_error_username["en"] = "Username not set! Access denied.";
lang_error_captcha["it"] = "Captcha non corrispondente! Accesso negato.";
lang_error_captcha["en"] = "Invalid captcha! Access denied.";
lang_error_lang["it"] = "Lingua non corrispondente! Accesso negato.";
lang_error_lang["en"] = "Invalid language! Access denied.";
lang_error_recent["it"] = 'Account troppo recente! Accesso negato.';
lang_error_recent["en"] = 'Account too new! Access denied.';
lang_menu["it"] = "🔙 Menu";
lang_menu["en"] = "🔙 Menu";
lang_delete["it"] = "🚫 Cancella";
lang_delete["en"] = "🚫 Delete";
lang_not_set["it"] = "<i>Non impostato</i>";
lang_not_set["en"] = "<i>Not set</i>";
lang_welcome_text["it"] = "Invia il testo che vorresti utilizzare all'ingresso degli utenti nel tuo gruppo.\nPuoi usare anche {user}, che verrà sostituito dal nome in caso mancasse.\nPuoi usare anche l'html.\n\nMessaggio di benvenuto attuale:\n";
lang_welcome_text["en"] = "Send the welcome text for new group users.\nYou can also use {user}, that will be replaced with first name in case of empty.\nYou can also use html.\n\nActual welcome text:\n";
lang_deleted["it"] = "Messaggio di benvenuto cancellato!";
lang_deleted["en"] = "Welcome message deleted!";
lang_confirm_delete["it"] = "Conferma cancellazione";
lang_confirm_delete["en"] = "Confirm delete";
lang_unlink["it"] = "Se sei veramente sicuro di scollegare il gruppo, premi il pulsante sotto, ricorda che anche tutti gli utenti che hanno effettuato la validazione dovranno rieffettuarla se il bot verrà reinserito.";
lang_unlink["en"] = "If you are really sure to unlink this group, click the button below, remember that all the user that has been complete the validation must do it again if the bot will be added again.";
lang_unlinked["it"] = "Gruppo scollegato con successo!";
lang_unlinked["en"] = "Group unlinked correctly!";
lang_action_first["it"] = 'Attiva prima almeno un metodo di validazione!';
lang_action_first["en"] = 'Active at least one validation method first!';
lang_unmute["it"] = 'Disattiva prima il mute automatico!';
lang_unmute["en"] = 'Disable automatic mute first!';
lang_automute["it"] = "Mute automatico";
lang_automute["en"] = "Automatic mute";
lang_action_enabled["it"] = "abilitato!";
lang_action_enabled["en"] = "enabled!";
lang_action_disabled["it"] = "disabilitato!";
lang_action_disabled["en"] = "disabled!";
lang_totalblock["it"] = "Blocco totale";
lang_totalblock["en"] = "Total block";
lang_totalblock_on["it"] = "E' stato attivato il *blocco totale*! Solo gli amministratori possono scrivere nel gruppo.";
lang_totalblock_on["en"] = "*Total block* has been enabled! Only administrators can write in the group.";
lang_totalblock_off["it"] = "E' stato disattivato il *blocco totale*! Tutti possono tornare a scrivere nel gruppo.";
lang_totalblock_off["en"] = "*Total block* has been disabled! All users can be write in the group.";
lang_button["it"] = "Pulsante";
lang_button["en"] = "Button";
lang_propic["it"] = "Immagine profilo obbligatoria";
lang_propic["en"] = "Mandatory profile pic";
lang_username["it"] = "Username obbligatorio";
lang_username["en"] = "Mandatory username";
lang_captcha["it"] = "Captcha";
lang_captcha["en"] = "Captcha";
lang_lang_mandatory["it"] = 'Imposta la lingua del tuo client!';
lang_lang_mandatory["en"] = 'Set the client language!';
lang_lang_check["it"] = 'Controllo lingua';
lang_lang_check["en"] = 'Language check';
lang_recent["it"] = 'Account recente';
lang_recent["en"] = 'Recent account';
lang_unlink["it"] = "Scollega gruppo";
lang_unlink["en"] = "Unlink group";
lang_welcome_message["it"] = "Messaggio di benvenuto";
lang_welcome_message["en"] = "Welcome message";
lang_manage["it"] = "Gestione del gruppo <b>%s</b>\nSeleziona le funzionalità di verifica di attivare o disattivare quando un utente accede al gruppo.\nRicorda al termine della configurazione di attivare il <i>Mute automatico</i> per permettere al bot di funzionare correttamente.\n\n<b>Spiegazione validazioni:</b>\n- <b>Pulsante</b>: Richiede la sola pressione di un pulsante, utile per bloccare l'accesso ai bot\n- <b>Immagine profilo obbligatoria</b>: Obbliga ad impostarne una per procedere\n- <b>Username obbligatorio</b>: Obbliga ad impostarne uno per procedere\n- <b>Captcha</b>: Richiede la scelta di un pulsante tra 5 corrispondente all'immagine per procedere\n- <b>Lingua</b>: Richiede che l'utente debba avere la lingua del client impostata sulla stessa del gestore del bot\n- <b>Account recente</b>: Richiede che l'account di telegram sia stato creato almeno un mese prima dell'accesso (funzionalità sperimentale)\n- <b>Mute temporaneo</b>: In alternativa alle validazioni, il mute temporaneo smuta automaticamente dopo 12 ore dall'ingresso, utile per le entrate in massa o multiple dello stesso utente\n- <b>Blocco totale</b>: Cancella tutti i messaggi degli utenti e consente solo agli amministratori di scrivere nel gruppo, utile per le emergenze\n\nPer qualsiasi problema, utilizza il comando <b>/unlock</b> nel gruppo per consentire accesso ad un utente forzatamente.\nRicorda di impostare il gruppo come <b>supergruppo</b> ed il bot come <b>amministratore</b>!";
lang_manage["en"] = "Manage group <b>%s</b>\nSelect the verify functions to enable or disable when a user enter the group.\nRemember that at the end of condifuration you must active <i>Automatic mute</i> to allow bot to work correctly.\n\n<b>Validations:</b>\n- <b>Button</b>: Ask only a button click, useful for avoid bots\n- <b>Mandatory profile picture</b>: Need a profile pic to go next\n- <b>Mandatory username</b>: Need an username to go next\n- <b>Captcha</b>: Need a click to one of five buttons that meets captcha content\n- <b>Language</b>: Need that user has same language as bot configurator\n- <b>Recent account</b>: Need that telegram account must be created at lest 1 month before now (experimental)\n- <b>Temporary mute</b>: Alternatively to validations, temporary mute unmute automatically after 12 hours, useful for avoid mass access and multi account from same person\n- <b>Total block</b>: Delete all users messages and allow only administrator to write in the group, useful for emergencies\n\nFor every trouble, use the command <b>/unlock</b> inside a group to allow a single user access manually.\nRemember to set group as <b>supergroup</b> and bot as <b>administrator</b>!";
lang_disableall["it"] = "Disabilita le validazioni per attivare il mute temporaneo."
lang_disableall["en"] = "Disable validations to enable temporary mute."
lang_until_date["it"] = "Mute temporaneo (12h)";
lang_until_date["en"] = "Temporary mute (12h)";
lang_only_until["it"] = "Disattiva prima il mute temporaneo!";
lang_only_until["en"] = "Disable temporary mute first!";
lang_help["it"] = "<b>A cosa serve questo bot?</b>\nQuesto bot serve a limitare l'accesso agli utenti bot (e perchè no, anche agli altri) tramite diversi metodi di verifica, i metodi al momento supportati sono i seguenti: pulsante, immagine profilo obbligatoria, username obbligatorio, captcha, lingua del client, account recente. Appena l'utente accede al gruppo verrà immediatamente mutato e smutato solamente quando avrà completato tutti i metodi di verifica abilitati in chat privata.\n\nE' possibile attivare il mute automatico oppure il mute temporaneo in alternativa ai vari metodi di validazione, in questo modo potrà scrivere automaticamente dopo tot tempo senza effettuare alcuna azione.\n\nE' possibile infine attivare il blocco totale per cancellare tutti i messaggi che vengono scritti tranne quelli degli admin ed è possibile sbloccare manualmente un utente con il comando apposito. Maggiori dettagli durante la configurazione del bot.";
lang_help["en"] = "<b>What this bot can do?</b>\nThis bot can limit user bot access (and also normal users, why not) using different verification methods, methods actually supported are: button, mandatory profile picture, mandatory username, captcha, client language, recent account. When user access the group it will be immediately muted and unmuted only when will have completed all mandatory specified verification methods in private chat.\n\nIs possibile to use automatic mute or temporary mute to automatically unmute a user after a fixed time without making actions.\n\nAt the end, is possibile to active total block to automatically delete all messages except admin messages and is possibile to unlock manually a user with a command. More infos during bot configuration.";
lang_help_private["it"] = "Questo comando può essere utilizzato solo in privato.";
lang_help_private["en"] = "This command can be used only in private mode.";

lang_complete["it"] = "Hai <b>completato</b> correttamente tutte le azioni richieste!\nSei stato smutato dal gruppo.";
lang_complete["en"] = "You have <b>completed</b> correctly all requested actions!\nYou have been unmuted from the group.";
lang_complete_group["it"] = "L'utente <b>%s</b> ha completato correttamente tutte le azioni richieste!\nDi conseguenza è stato smutato dal gruppo.";
lang_complete_group["en"] = "User <b>%s</b> has completed all requested actions!\nThen has been unmuted from the group.";

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

	var lang = defaultLang;
	
	// Configurazione
	if (message.new_chat_members != undefined) {
		if (message.new_chat_member.username == "authorizatorbot"){
			if (message.chat.id > 0){
				bot.sendMessage(message.from.id, lang_add_bot[lang]);
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
							console.log("Group not found")
							return;
						}
						var user_id = rows[0].id;
						connection.query('SELECT 1 FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
							if (err) throw err;
							if (Object.keys(rows).length > 0) {
								bot.sendMessage(message.from.id, lang_already_linked[lang]);
								return;
							}

							connection.query('INSERT INTO user_group (user_id, group_chat_id, group_title) VALUES (' + user_id + ', "' + message.chat.id + '", "' + message.chat.title + '")', function (err, rows, fields) {
								if (err) throw err;
								bot.sendMessage(message.from.id, lang_link_done[lang].replace("%s", message.chat.title), html);
								var iKeys = [];
								iKeys.push([{
									text: lang_go_private[lang],
									url: "https://telegram.me/authorizatorbot"
								}]);
								bot.sendMessage(message.chat.id, lang_link_done_group[lang].replace("%s", message.from.username), {
									parse_mode: 'HTML',
									reply_markup: {
										inline_keyboard: iKeys
									}
								});
							});
						});
					});
				} else {
					bot.sendMessage(message.from.id, lang_link_admin[lang]);
					return;
				}
			});
		} else if (message.new_chat_member.is_bot == false){
			var rows = connection_sync.query('SELECT id FROM user WHERE account_id = ' + message.from.id);
			var current_id;
			if (Object.keys(rows).length == 0) {
				var rows = connection_sync.query('SELECT MAX(id) As mx FROM user');
				current_id = rows[0].mx+1;
				connection_sync.query('INSERT INTO user (id, account_id) VALUES (' + current_id + ', ' + message.from.id + ')');
			} else
				current_id = rows[0].id;

			var rows = connection_sync.query('SELECT 1 FROM user_validated WHERE user_id = ' + current_id);
			if (Object.keys(rows).length == 0)
				connection_sync.query('INSERT INTO user_validated (user_id, group_chat_id) VALUES (' + current_id + ', "' + message.chat.id + '")');

			connection.query('SELECT active, welcome_msg, until_date FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0){
					console.log("Group not found");
					return;
				}

				var active = rows[0].active;
				var welcome_msg = rows[0].welcome_msg;
				var until_date = rows[0].until_date;
				if (active == 1){
					connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
						if (err) throw err;
						var user_id = rows[0].id;
						connection.query('SELECT validated FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
							if (err) throw err;
							if (rows[0].validated == 0){
								var options;
								if (until_date == 1) {
									var time = Math.round((Date.now()+ms("12h"))/1000);
									options = {can_send_messages: false, can_send_media_messages: false, can_send_other_messages: false, can_add_web_page_previews: false, until_date: time};
								} else
									options = {can_send_messages: false, can_send_media_messages: false, can_send_other_messages: false, can_add_web_page_previews: false};
								bot.restrictChatMember(message.chat.id, message.new_chat_member.id, options).then(function (data) {
									if (data == true){
										// mutato
										var iKeys = [];
										iKeys.push([{
											text: lang_start[lang],
											url: "https://telegram.me/authorizatorbot?start=" + message.chat.id
										}]);
										if (welcome_msg == null)
											welcome_msg = lang_start_private[lang].replace("%s", message.from.username);

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
								bot.sendMessage(message.chat.id, lang_already_validated[lang]);
							}
						});
					});
				} else
					console.log("Check not activated");
			});
		}
	} else {
		connection.query('SELECT 1 FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				connection.query('INSERT INTO user (account_id) VALUES (' + message.from.id + ')', function (err, rows, fields) {
					if (err) throw err;
				});
			}
		});
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
						bot.sendMessage(message.chat.id, lang_welcome_changed[lang]);
					});
				});
			}
		});
	} else {
		connection.query('SELECT lockall FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0)
				return;
			
			bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
				if ((data.status != "creator") && (data.status != "administrator")) {
					if (rows[0].lockall == 1){
						bot.deleteMessage(message.chat.id, message.message_id).then(function (result) {
							if (result != true)
								console.log("Error deleting message " + message.chat.id + " " + message.message_id);
						})
					}
				}
			});
		});
	}
});

bot.onText(/^\/help/, function (message) {
	connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		var lang = rows[0].lang;
		
		if (message.chat.id < 0){
			bot.sendMessage(message.chat.id, lang_help_private[lang]);
			return;
		}

		bot.sendMessage(message.chat.id, lang_help[lang], html);
	});
});

bot.onText(/^\/new/, function (message) {
	connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		var lang = rows[0].lang;
		
		if (message.chat.id < 0){
			bot.sendMessage(message.chat.id, lang_config_private[lang]);
			return;
		}
		var iKeys = [];
		iKeys.push([{
			text: lang_add_group[lang],
			url: "https://telegram.me/authorizatorbot?startgroup="
		}]);

		bot.sendMessage(message.chat.id, lang_add_btn[lang], {
			parse_mode: 'Markdown',
			reply_markup: {
				inline_keyboard: iKeys
			}
		});
	});
});

bot.onText(/^\/config$/, function (message) {
	connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		var lang = rows[0].lang;
		
		if (message.chat.id < 0){
			bot.sendMessage(message.chat.id, lang_config_private[lang]);
			return;
		}
		connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			var user_id = rows[0].id;
			var lang = rows[0].lang;
			connection.query('SELECT group_chat_id, group_title FROM user_group WHERE user_id = ' + user_id, function (err, rows, fields) {
				if (err) throw err;

				if (Object.keys(rows).length == 0){
					bot.sendMessage(message.chat.id, lang_no_group[lang]);
					return;
				}

				var iKeys = [];
				for (var i = 0, len = Object.keys(rows).length; i < len; i++) {
					iKeys.push([{
						text: rows[i].group_title,
						callback_data: "manage:" + rows[i].group_chat_id
					}]);
				}

				if (lang == "it") {
					iKeys.push([{
						text: "🇺🇸 English 🇺🇸",
						callback_data: "chlang:en"
					}]);
				} else {
					iKeys.push([{
						text: "🇮🇹 Italiano 🇮🇹",
						callback_data: "chlang:it"
					}]);
				}

				bot.sendMessage(message.chat.id, lang_select_group[lang], {
					parse_mode: 'Markdown',
					reply_markup: {
						inline_keyboard: iKeys
					}
				});
			});
		});
	});
});

bot.onText(/^\/unlock$/, function (message) {
	connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		var lang = rows[0].lang;
		
		if (message.chat.id > 0){
			bot.sendMessage(message.chat.id, lang_only_group[lang]);
			return;
		}

		if (message.reply_to_message == undefined){
			bot.sendMessage(message.chat.id, lang_reply[lang]);
			return;
		}

		var account_id = message.reply_to_message.from.id;

		connection.query('SELECT 1 FROM user_group WHERE group_chat_id = "' + message.chat.id + '"', function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				bot.sendMessage(message.chat.id, lang_not_conf[lang]);
				return;
			}

			connection.query('SELECT id FROM user WHERE account_id = "' + user + '"', function (err, rows, fields) {
				if (err) throw err;

				if (Object.keys(rows).length == 0) {
					connection.query('INSERT INTO user (account_id) VALUES (' + account_id + ')', function (err, rows, fields) {
						if (err) throw err;
						var current_id = rows.insertId;
						connection.query('INSERT INTO user_validated (user_id, group_chat_id, validated) VALUES (' + current_id + ', "' + message.chat.id + '", 1)', function (err, rows, fields) {
							if (err) throw err;
							bot.sendMessage(message.chat.id, lang_user_validated[lang]);
						});
					});
				}

				var current_id = rows[0].id;

				connection.query('SELECT 1 FROM user_validated WHERE user_id = ' + current_id, function (err, rows, fields) {
					if (err) throw err;

					if (Object.keys(rows).length == 0) {
						connection.query('INSERT INTO user_validated (user_id, group_chat_id, validated) VALUES (' + current_id + ', "' + message.chat.id + '", 1)', function (err, rows, fields) {
							if (err) throw err;
							bot.sendMessage(message.chat.id, lang_user_validated[lang]);
						});
					}

					connection.query('UPDATE user_validated SET validated = 1 WHERE user_id = ' + current_id, function (err, rows, fields) {
						if (err) throw err;
						bot.sendMessage(message.chat.id, lang_user_validated_2[lang]);
					});
				});
			});
		});
	});
});

bot.onText(/^\/start$|^\/start@authorizatorbot|^\/start (.+)/, function (message, match) {
	var lang = defaultLang;
	if (message.chat.id < 0){
		bot.sendMessage(message.chat.id, lang_only_private[lang]);
		return;
	}

	if (match[1] != undefined){
		var group_chat_id = match[1];
		connection.query('SELECT id FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
			if (err) throw err;
			var user_id = rows[0].id;
			connection.query('SELECT button, propic, username, captcha, lang, recent FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
				if (err) throw err;
				if (Object.keys(rows).length == 0) {
					bot.sendMessage(message.chat.id, lang_group_not_exists[lang]);
					return;
				}

				var button_req = rows[0].button;
				var propic_req = rows[0].propic;
				var username_req = rows[0].username;
				var captcha_req = rows[0].captcha;
				var lang_req = rows[0].lang;
				var recent_req = rows[0].lang;

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
				if (recent_req == 1)
					reqN++;

				connection.query('SELECT button, propic, username, captcha, lang, recent FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
					if (err) throw err;

					if (Object.keys(rows).length == 0) {
						console.log("Error user_validated not found");
						return;
					}

					// Validazione utente

					var button = rows[0].button;
					var propic = rows[0].propic;
					var username = rows[0].username;
					var captcha = rows[0].captcha;
					var lang = rows[0].lang;
					var recent = rows[0].lang;

					bot.sendMessage(message.chat.id, lang_actions[lang].replace("%s", reqN), html);

					if ((button == 0) && (button_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: lang_complete[lang],
							callback_data: "button_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, lang_action_btn[lang], {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}

					if ((propic == 0) && (propic_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: lang_complete[lang],
							callback_data: "propic_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, lang_action_propic[lang], {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}

					if ((username == 0) && (username_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: lang_complete[lang],
							callback_data: "username_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, lang_action_username[lang], {
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
							caption: lang_action_captcha[lang],
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						};

						bot.sendPhoto(message.chat.id, Buffer.from(img.getBase64(), 'base64'), fileOpts);
					}

					if ((lang == 0) && (lang_req != null)){
						var iKeys = [];
						iKeys.push([{
							text: lang_complete[lang],
							callback_data: "lang_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, lang_action_lang[lang], {
							parse_mode: 'Markdown',
							reply_markup: {
								inline_keyboard: iKeys
							}
						});
					}
					
					if ((recent == 0) && (recent_req == 1)){
						var iKeys = [];
						iKeys.push([{
							text: lang_complete[lang],
							callback_data: "recent_val:" + group_chat_id
						}]);

						bot.sendMessage(message.chat.id, lang_action_recent[lang], {
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
					
					var text = lang_welcome[lang];					
					text = text.replace("%g", formatNumber(group_cnt));
					text = text.replace("%u", formatNumber(user_cnt));
					text = text.replace("%d", toDate("it", time));

					bot.sendMessage(message.chat.id, text, mark);
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
	connection.query('SELECT id, lang FROM user WHERE account_id = ' + message.from.id, function (err, rows, fields) {
		if (err) throw err;
		var user_id = rows[0].id;
		var user_lang = rows[0].lang;
		
		if (function_name == "chlang"){
			var newlang = group_chat_id;
			connection.query('UPDATE user SET lang = "' + newlang + '" WHERE account_id = ' + message.from.id, function (err, rows, fields) {
				if (err) throw err;
			});
			
			bot.editMessageText(lang_changed[newlang], {
				chat_id: message.message.chat.id,
				message_id: message.message.message_id,
				parse_mode: 'HTML'
			});
			
			bot.answerCallbackQuery(message.id);
			return;
		}
		
		connection.query('SELECT id, user_id, group_title, welcome_msg, lockall, active, button, propic, username, captcha, lang, recent, until_date FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
			if (err) throw err;
			if (Object.keys(rows).length == 0) {
				bot.answerCallbackQuery(message.id, {text: lang_error_info[user_lang]});
				return;
			}
			if ((rows[0].user_id != user_id) && (function_name == "manage")) {
				bot.answerCallbackQuery(message.id, {text: lang_error_auth[lang]});
				return;
			}

			var group_id = rows[0].id;
			var group_title = rows[0].group_title;
			var welcome_msg = rows[0].welcome_msg;
			var lockall = rows[0].lockall;
			var active = rows[0].active;
			var button = rows[0].button;
			var propic = rows[0].propic;
			var username = rows[0].username;
			var captcha = rows[0].captcha;
			var lang = rows[0].lang;
			var recent = rows[0].recent;
			var until_date = rows[0].until_date;

			if (function_name == "button_val") {
				connection.query('UPDATE user_validated SET button = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
					if (err) throw err;
					bot.editMessageText(lang_action_complete[user_lang], {
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
							bot.editMessageText(lang_action_complete[user_lang], {
								chat_id: message.message.chat.id,
								message_id: message.message.message_id,
								parse_mode: 'HTML'
							});
							checkComplete(message, user_id, group_chat_id);
							bot.answerCallbackQuery(message.id);
						});
					} else {
						bot.answerCallbackQuery(message.id, lang_error_propic[user_lang]);
					}
				});
			} else if (function_name == "username_val") {
				if (message.from.username != undefined){
					connection.query('UPDATE user_validated SET username = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageText(lang_action_complete[user_lang], {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, lang_error_username[user_lang]);
				}
			} else if (function_name == "captcha_val") {
				if (extra_param == "1"){
					connection.query('UPDATE user_validated SET captcha = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageCaption(lang_action_complete[user_lang], {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, lang_error_captcha[user_lang]);
				}
			} else if (function_name == "lang_val") {
				if (message.from.language_code == lang){
					connection.query('UPDATE user_validated SET lang = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageText(lang_action_complete[user_lang], {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, lang_error_lang[user_lang]);
				}
			} else if (function_name == "recent_val") {
				// calcolo creazione account
				// https://github.com/wjclub/telegram-bot-getids/blob/master/ages.json
				// 4 feb 19

				var ages = {
					"2768409"   : 1383264000000,
					"7679610"   : 1388448000000,
					"11538514"  : 1391212000000,
					"15835244"  : 1392940000000,
					"23646077"  : 1393459000000,
					"38015510"  : 1393632000000,
					"44634663"  : 1399334000000,
					"46145305"  : 1400198000000,
					"54845238"  : 1411257000000,
					"63263518"  : 1414454000000,
					"101260938" : 1425600000000,
					"101323197" : 1426204000000,
					"111220210" : 1429574000000,
					"103258382" : 1432771000000,
					"103151531" : 1433376000000,
					"116812045" : 1437696000000,
					"122600695" : 1437782000000,
					"109393468" : 1439078000000,
					"112594714" : 1439683000000,
					"124872445" : 1439856000000,
					"130029930" : 1441324000000,
					"125828524" : 1444003000000,
					"133909606" : 1444176000000,
					"157242073" : 1446768000000,
					"143445125" : 1448928000000,
					"148670295" : 1452211000000,
					"152079341" : 1453420000000,
					"171295414" : 1457481000000,
					"181783990" : 1460246000000,
					"222021233" : 1465344000000,
					"225034354" : 1466208000000,
					"278941742" : 1473465000000,
					"285253072" : 1476835000000,
					"294851037" : 1479600000000,
					"297621225" : 1481846000000,
					"328594461" : 1482969000000,
					"337808429" : 1487707000000,
					"341546272" : 1487782000000,
					"352940995" : 1487894000000,
					"369669043" : 1490918000000,
					"400169472" : 1501459000000,
					"805158066" : 1563208000000
				};

				const ids = Object.keys(ages)
				const nids = ids.map(e => parseInt(e))

				const minId = nids[0]
				const maxId = nids[nids.length - 1]

				const getDate = (id) => {
					if (id < minId)
						return [-1, new Date(ages[ids[0]])]
					else if (id > maxId)
						return [1, new Date(ages[ids[ids.length - 1]])]
					else {
						let lid = nids[0]
						for (let i = 0; i < ids.length; i++) {
							if (id <= nids[i]) {
								const uid = nids[i]
								const lage = ages[lid]
								const uage = ages[uid]

								const idratio = ((id - lid) / (uid - lid))
								const midDate = Math.floor((idratio * (uage - lage)) + lage)
								return [0, new Date(midDate)]
							} else
								lid = nids[i]
						}
					}
				}

				const getAge = (id) => {
					const d = getDate(id)
					return [
						d[0] < 0 ? '<' : d[0] > 0 ? '>' : '-',
						`${(d[1].getUTCMonth() + 1)}/${d[1].getUTCFullYear()}`
					]
				}
				
				// < più vecchio del
				// > più recente del
				// circa

				var res = getAge(message.message.from.id);
				
				var split = res[1].split("/");
				var date = new Date(split[1] + "-" + split[0] + "-01");
				var now = new Date();
				now.setMonth(now.getMonth() - 1);

				var acc_month = String(date.getMonth()+1) + date.getFullYear();
				var prev_month = String(now.getMonth()+1) + now.getFullYear();
				
				if (acc_month <= prev_month) {
					connection.query('UPDATE user_validated SET recent = 1 WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
						bot.editMessageText(lang_action_complete[user_lang], {
							chat_id: message.message.chat.id,
							message_id: message.message.message_id,
							parse_mode: 'HTML'
						});
						checkComplete(message, user_id, group_chat_id);
						bot.answerCallbackQuery(message.id);
					});
				} else {
					bot.answerCallbackQuery(message.id, {text: lang_error_recent[user_lang]});
				}
			} else {
				if (function_name == "welcome") {
					var iKeys = [];
					iKeys.push([{
						text: lang_menu[user_lang],
						callback_data: "clean:" + group_chat_id
					}]);
					if (welcome_msg != null) {
						iKeys.push([{
							text: lang_delete[user_lang],
							callback_data: "welcomedel:" + group_chat_id
						}]);
					}

					connection.query('UPDATE user SET edit_welcome_group = ' + group_id + ' WHERE id = ' + user_id, function (err, rows, fields) {
						if (err) throw err;
					});

					if (welcome_msg == null)
						welcome_msg = lang_not_set[user_lang];

					if (welcome_msg.length > 500)
						welcome_msg = striptags(welcome_msg).substr(0, 500) + "...";

					bot.editMessageText(lang_welcome_text[user_lang] + welcome_msg, {
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
						text: lang_menu[user_lang],
						callback_data: "clean:" + group_chat_id
					}]);

					connection.query('UPDATE user_group SET welcome_msg = NULL WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
					});

					bot.editMessageText(lang_deleted[user_lang], {
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
						text: lang_confirm_delete[user_lang],
						callback_data: "unlinkconf:" + group_chat_id
					}]);
					iKeys.push([{
						text: lang_menu[user_lang],
						callback_data: "manage:" + group_chat_id
					}]);

					bot.editMessageText(lang_unlink[user_lang], {
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
					connection.query('DELETE FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
					});
					connection.query('DELETE FROM user_validated WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
						if (err) throw err;
					});
					
					bot.editMessageText(lang_unlinked[user_lang], {
						chat_id: message.message.chat.id,
						message_id: message.message.message_id,
						parse_mode: 'HTML'
					});

					bot.answerCallbackQuery(message.id);
					return;
				} else if (function_name != "manage") {
					var param_value;
					if (function_name == "active"){
						if ((button == 0) && (propic == 0) && (username == 0) && (captcha == 0) && (lang == null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_action_first[user_lang]});
							return;
						}
						if (active == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_automute[user_lang] + " " + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_automute[user_lang] + " " + lang_action_enabled[user_lang]});
						}
						active = !active;
					} else if (function_name == "lockall"){
						if (lockall == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_totalblock[user_lang] + ' ' + lang_action_disabled[user_lang]});
							bot.sendMessage(group_chat_id, lang_totalblock_off[user_lang], mark);
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_totalblock[user_lang] + ' ' + lang_action_enabled[user_lang]});
							bot.sendMessage(group_chat_id, lang_totalblock_on[user_lang], mark);
						}
						lockall = !lockall;
					} else if (function_name == "button"){
						if ((active == 1) && (button == 1) && (propic == 0) && (username == 0) && (captcha == 0) && (lang == null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (button == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (button == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_button[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_button[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						button = !button;
					} else if (function_name == "propic"){
						if ((active == 1) && (button == 0) && (propic == 1) && (username == 0) && (captcha == 0) && (lang == null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (propic == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (propic == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_propic[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_propic[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						propic = !propic;
					} else if (function_name == "username"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 1) && (captcha == 0) && (lang == null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (username == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (username == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_username[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_username[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						username = !username;
					} else if (function_name == "captcha"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 0) && (captcha == 1) && (lang == null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (captcha == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (captcha == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_captcha[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_captcha[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						captcha = !captcha;
					} else if (function_name == "lang"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 0) && (captcha == 0) && (lang != null) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (lang == null)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (message.from.language_code == undefined){
							bot.answerCallbackQuery(message.id, {text: lang_lang_mandatory[user_lang]});
							return;
						}
						var langcode = message.from.language_code;
						if (lang != null){
							param_value = "NULL";
							lang = null;
							bot.answerCallbackQuery(message.id, {text: lang_lang_check[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = "'" + langcode + "'";
							lang = langcode;
							bot.answerCallbackQuery(message.id, {text: lang_lang_check[user_lang] + ' ' + lang_action_enabled[user_lang] + ' (' + langcode + ')!'});
						}
					} else if (function_name == "recent"){
						if ((active == 1) && (button == 0) && (propic == 0) && (username == 0) && (captcha == 0) && (lang == null) && (recent == 1)){
							bot.answerCallbackQuery(message.id, {text: lang_unmute[user_lang]});
							return;
						}
						if ((until_date == 1) && (recent == 0)){
							bot.answerCallbackQuery(message.id, {text: lang_only_until[user_lang]});
							return;
						}
						if (recent == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_recent[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_recent[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						recent = !recent;
					}  else if (function_name == "until_date"){
						if ((button == 1) || (propic == 1) || (username == 1) || (captcha == 1) || (lang != null) || (recent == 1)){
							bot.answerCallbackQuery(message.id, {text: lang_disableall[user_lang]});
							return;
						}
						if (until_date == 1){
							param_value = 0;
							bot.answerCallbackQuery(message.id, {text: lang_until_date[user_lang] + ' ' + lang_action_disabled[user_lang]});
						} else {
							param_value = 1;
							bot.answerCallbackQuery(message.id, {text: lang_until_date[user_lang] + ' ' + lang_action_enabled[user_lang]});
						}
						until_date = !until_date;
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
					text: "💬 " + lang_welcome_message[user_lang],
					callback_data: "welcome:" + group_chat_id
				}]);
				if (active == 1){
					iKeys.push([{
						text: "✅ " + lang_automute[user_lang],
						callback_data: "active:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_automute[user_lang],
						callback_data: "active:" + group_chat_id
					}]);
				}
				if (until_date == 1){
					iKeys.push([{
						text: "✅ " + lang_until_date[user_lang],
						callback_data: "until_date:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_until_date[user_lang],
						callback_data: "until_date:" + group_chat_id
					}]);
				}
				if (button == 1){
					iKeys.push([{
						text: "✅ " + lang_button[user_lang],
						callback_data: "button:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_button[user_lang],
						callback_data: "button:" + group_chat_id
					}]);
				}
				if (propic == 1){
					iKeys.push([{
						text: "✅ " + lang_propic[user_lang],
						callback_data: "propic:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_propic[user_lang],
						callback_data: "propic:" + group_chat_id
					}]);
				}
				if (username == 1){
					iKeys.push([{
						text: "✅ " + lang_username[user_lang],
						callback_data: "username:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_username[user_lang],
						callback_data: "username:" + group_chat_id
					}]);
				}
				if (captcha == 1){
					iKeys.push([{
						text: "✅ " + lang_captcha[user_lang],
						callback_data: "captcha:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_captcha[user_lang],
						callback_data: "captcha:" + group_chat_id
					}]);
				}
				if (lang != null){
					iKeys.push([{
						text: "✅ " + lang_lang_check[user_lang],
						callback_data: "lang:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_lang_check[user_lang],
						callback_data: "lang:" + group_chat_id
					}]);
				}
				if (recent == 1){
					iKeys.push([{
						text: "✅ " + lang_recent[user_lang],
						callback_data: "recent:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🚫 " + lang_recent[user_lang],
						callback_data: "recent:" + group_chat_id
					}]);
				}

				if (lockall == 1) {
					iKeys.push([{
						text: "🗑 " + lang_unlink[user_lang],
						callback_data: "unlink:" + group_chat_id
					}, {
						text: "✅ " + lang_totalblock[user_lang],
						callback_data: "lockall:" + group_chat_id
					}]);
				} else {
					iKeys.push([{
						text: "🗑 " + lang_unlink[user_lang],
						callback_data: "unlink:" + group_chat_id
					}, {
						text: "🚫 " + lang_totalblock[user_lang],
						callback_data: "lockall:" + group_chat_id
					}]);
				}

				bot.editMessageText(lang_manage[user_lang].replace("%s", group_title), {
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

// Functions

function checkComplete(message, user_id, group_chat_id){
	connection.query('SELECT active, button, propic, username, captcha, lang, recent FROM user_group WHERE group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
		if (err) throw err;
		var button_req = rows[0].button;
		var propic_req = rows[0].propic;
		var username_req = rows[0].username;
		var captcha_req = rows[0].captcha;
		var lang_req = rows[0].lang;
		var recent_req = rows[0].recent;
		
		connection.query('SELECT button, propic, username, captcha, lang, recent FROM user_validated WHERE user_id = ' + user_id + ' AND group_chat_id = "' + group_chat_id + '"', function (err, rows, fields) {
			if (err) throw err;
			var button = rows[0].button;
			var propic = rows[0].propic;
			var username = rows[0].username;
			var captcha = rows[0].captcha;
			var lang = rows[0].lang;
			var recent = rows[0].recent;

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
			if ((recent_req == 1) && (recent == 0))
				validated = 0;

			// Smuta l'utente
			if (validated == 1){
				var options = {can_send_messages: true, can_send_media_messages: true, can_send_other_messages: true, can_add_web_page_previews: true};
				bot.restrictChatMember(group_chat_id, message.from.id, options).then(function (data) {
					if (data == true){
						connection.query('UPDATE user_validated SET validated = 1 WHERE user_id = ' + user_id, function (err, rows, fields) {
							if (err) throw err;
							bot.sendMessage(message.message.chat.id, lang_complete[lang], html);
							bot.sendMessage(group_chat_id, lang_complete_group[lang].replace("%s", message.from.username), html);
						});
					}
				});
			}
		});
	});
}

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
		var datetime = "Language not specified";
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
		var datetime = "Language not specified";
	return datetime;
}