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
var cron = require('node-cron');

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

const useWebhook = true;

var bot = new TelegramBot(token, {
    polling: !useWebhook,
    request: {
        family: 4
    }
});
var app = express();

var path = "/sidetools/bot" + token;
var port = 25010;
if (useWebhook)
    bot.setWebHook('https://fenixweb.net:8443' + path).then(r => console.log('Webhook set:', r));

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

var nabbiChatId = "-5019539386";

var originalText1 = "Ci sei per giocare oggi? 👀";
var originalText2 = "Ci sarai all'allenamento di stasera? 🔥";
var originalText3 = "Ci sarai per giocare questa settimana? 🤔";

cron.schedule('0 17 * * *', () => {
    sendPartecipation(nabbiChatId, 0, null);
});

cron.schedule('0 10 * * 1', () => {
    connection.query("DELETE FROM partecipation WHERE weekly = 1", function (err, rows) {
        if (err) throw err;
        sendWeeklyPartecipation(nabbiChatId, 0, null);
    });
});

cron.schedule('50 23 * * *', () => {
    fillWeeklyPartecipation(nabbiChatId);
});

function fillWeeklyPartecipation(chat_id) {
    let now = new Date();
    var dayofweek = now.getDay();
    connection.query("SELECT id FROM partecipation WHERE weekly = 1 AND chat_id = -461536160", function (err, rows) {
        if (err) throw err;
        var partecipation_id = rows[0].id;
        connection.query("SELECT partecipation_id, user_id, username, response FROM partecipation_user WHERE dayofweek = " + dayofweek + " AND partecipation_id = " + partecipation_id, function (err, rows) {
            if (err) throw err;
            for (var i = 0; i < Object.keys(rows).length; i++) {
                connection.query("SELECT 1 FROM partecipation_user WHERE add_date LIKE '" + now_day + "%' AND user_id = " + rows[i].user_id + " AND partecipation_id = " + partecipation_id, function (err, rows) {
                    if (err) throw err;
                    if (Object.keys(rows).length == 0) {
                        connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response) VALUES (" + partecipation_id + ", " + rows[i].user_id + ", '" + rows[i].username + "', '" + rows[i].response + "')", function (err, rows) {
                            if (err) throw err;
                        });
                    }
                });
            }
        });
    });
}

function sendWeeklyPartecipation(chat_id, from_command, message_id) {
    let now = new Date();
    let now_day = now.getFullYear() + "-" + addZero(now.getMonth()+1) + "-" + addZero(now.getDate());
    var poll_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM partecipation WHERE weekly = 1 AND add_date LIKE '" + now_day + "%' AND chat_id = '" + chat_id + "'")[0].cnt;
    
    if (poll_cnt > 0) {
        bot.sendMessage(chat_id, "Oggi è stato già pubblicato un sondaggio settimanale!");
        return;
    }
    
    var partecipation_id = connection_sync.query("SELECT MAX(id)+1 As new_id FROM partecipation")[0].new_id;
    if (partecipation_id == null)
        partecipation_id = 1;

    var iKeys = [];
    var days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
    var daysn = [1, 2, 3, 4, 5, 6, 0];

    iKeys.push([{
        text: "🌟",
        callback_data: "null"
    },{
        text: "✅",
        callback_data: partecipation_id + ":partecipationw:yes:-1"
    },{
        text: "🤔",
        callback_data: partecipation_id + ":partecipationw:maybe:-1"
    },{
        text: "❌",
        callback_data: partecipation_id + ":partecipationw:no:-1"
    }]);

    for (var i = 0; i < days.length; i++) {
        iKeys.push([{
            text: days[i],
            callback_data: "null"
        },{
            text: "✅",
            callback_data: partecipation_id + ":partecipationw:yes:" + daysn[i]
        },{
            text: "🤔",
            callback_data: partecipation_id + ":partecipationw:maybe:" + daysn[i]
        },{
            text: "❌",
            callback_data: partecipation_id + ":partecipationw:no:" + daysn[i]
        }]);
    }

    if (from_command == 1) 
        bot.deleteMessage(chat_id, message_id);
        
    bot.sendMessage(chat_id, originalText3, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: iKeys
        }
    }).then(function (msg) {
        connection.query("INSERT INTO partecipation (chat_id, message_id, weekly) VALUES (" + msg.chat.id + ", " + msg.message_id + ", 1)", function (err, rows) {
            if (err) throw err;
        });
        setTimeout(() => {
            bot.unpinAllChatMessages(msg.chat.id).then(function (data) {
                setTimeout(() => {
                    bot.pinChatMessage(msg.chat.id, msg.message_id, {disable_notification: true});
                }, 2000);
            });
        }, 2000);
    });
}

function sendPartecipation(chat_id, from_command, message_id) {
    let now = new Date();
    let now_day = now.getFullYear() + "-" + addZero(now.getMonth()+1) + "-" + addZero(now.getDate());
    var poll_cnt = connection_sync.query("SELECT COUNT(id) As cnt FROM partecipation WHERE weekly = 0 AND add_date LIKE '" + now_day + "%' AND chat_id = '" + chat_id + "'")[0].cnt;
    
    if (poll_cnt > 0) {
        console.log("Sondaggio già pubblicato");
        if (from_command == 1) bot.sendMessage(chat_id, "Oggi è stato già pubblicato un sondaggio!");
        return;
    }
    
    var partecipation_id = connection_sync.query("SELECT MAX(id)+1 As new_id FROM partecipation")[0].new_id;
    if (partecipation_id == null)
        partecipation_id = 1;
        
    if (chat_id == nabbiChatId) {
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
            text: "21:00",
            callback_data: partecipation_id + ":partecipation:2100"
        },{
            text: "21:15",
            callback_data: partecipation_id + ":partecipation:2115"
        },{
            text: "21:30",
            callback_data: partecipation_id + ":partecipation:2130"
        }],[{
            text: "21:45",
            callback_data: partecipation_id + ":partecipation:2145"
        },{
            text: "22:00",
            callback_data: partecipation_id + ":partecipation:2200"
        }]);

        if (from_command == 1) 
            bot.deleteMessage(chat_id, message_id);
            
        bot.sendMessage(chat_id, originalText1, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: iKeys
            }
        }).then(function (msg) {
            connection.query("INSERT INTO partecipation (chat_id, message_id) VALUES (" + msg.chat.id + ", " + msg.message_id + ")", function (err, rows) {
                if (err) throw err;
                var insertId = rows.insertId;
                printPartecipations(msg.chat.id, msg.message_id, null, insertId);
                console.log("Sondaggio pubblicato");
            });
            setTimeout(() => {
                bot.unpinAllChatMessages(msg.chat.id).then(function (data) {
                    setTimeout(() => {
                        bot.pinChatMessage(msg.chat.id, msg.message_id, {disable_notification: true});
                    }, 2000);
                });
            }, 2000);
        });
    } else if (chat_id == "-1001865921442") {
        var iKeys = [];
        iKeys.push([{
            text: "Sì",
            callback_data: partecipation_id + ":partecipation:yes"
        },{
            text: "No",
            callback_data: partecipation_id + ":partecipation:no"
        }],[{
            text: "21:00",
            callback_data: partecipation_id + ":partecipation:2100"
        },{
            text: "21:15",
            callback_data: partecipation_id + ":partecipation:2115"
        },{
            text: "21:30",
            callback_data: partecipation_id + ":partecipation:2130"
        }],[{
            text: "21:45",
            callback_data: partecipation_id + ":partecipation:2145"
        },{
            text: "22:00",
            callback_data: partecipation_id + ":partecipation:2200"
        }]);

        if (from_command == 1) 
            bot.deleteMessage(chat_id, message_id);
            
        bot.sendMessage(chat_id, originalText2, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: iKeys
            }
        }).then(function (msg) {
            connection.query("INSERT INTO partecipation (chat_id, message_id) VALUES (" + msg.chat.id + ", " + msg.message_id + ")", function (err, rows) {
                if (err) throw err;
                console.log("Sondaggio pubblicato");
            });
            setTimeout(() => {
                bot.pinChatMessage(msg.chat.id, msg.message_id, {disable_notification: false});
            }, 2000);
        });
    }
}

bot.onText(/^\/presenze$|^\/presenze@sidetoolsbot$/i, function (message) {
    console.log(getNow("it") + " " + message.chat.id + " - " + message.from.username + " - " + message.text);
    sendPartecipation(message.chat.id, 1, message.message_id);
});

bot.onText(/^\/presenzesett$|^\/presenzesett@sidetoolsbot$/i, function (message) {
    console.log(getNow("it") + " " + message.from.username + " - " + message.text);
    sendWeeklyPartecipation(message.chat.id, 1, message.message_id);
});

bot.onText(/^\/chatid/i, function (message) {
    bot.sendMessage(message.chat.id, message.chat.id);
});

bot.onText(/^\/partecipanti (.+)|^\/partecipanti/i, function (message, match) {
    if ((message.chat.id != nabbiChatId) && (message.chat.id != "-1001865921442"))
        return;

    bot.getChatMember(message.chat.id, message.from.id).then(function (data) {
        if ((data.status != 'creator') && (data.status != 'administrator')) {
            bot.sendMessage(message.chat.id, "Non hai i permessi per usare questo comando!");
            return;
        }

        if (match[1] == undefined) {
            bot.sendMessage(message.chat.id, "Manca il numero partecipanti!");
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

bot.onText(/^\/stats/i, function (message, match) {
    var text = "Partecipazioni in questo gruppo:";
    connection.query("SELECT COUNT(id) As cnt FROM partecipation WHERE chat_id = '" + message.chat.id + "'", function (err, rows) {
        if (err) throw err;

        var total_group = rows[0].cnt;

        connection.query("SELECT U.response, U.time FROM partecipation_user U, partecipation P WHERE U.partecipation_id = P.id AND U.user_id = '" + message.from.id + "' AND P.chat_id = '" + message.chat.id + "'", function (err, rows) {
            if (err) throw err;
            if (Object.keys(rows).length == 0) {
                bot.sendMessage(message.chat.id, "Nessuna partecipazione alle votazioni in questo gruppo.");
                return;
            }
            
            // Variabili aggiornate per le statistiche con il nuovo orario
            var yes = 0;
            var maybe = 0;
            var no = 0;
            var time2100 = 0;
            var time2115 = 0;
            var time2130 = 0;
            var time2145 = 0;
            var time2200 = 0;
            var total = 0;
            var total_h = 0;
            
            for (var i = 0; i < Object.keys(rows).length; i++) {
                if (rows[i].response == "yes")
                    yes++;
                else if (rows[i].response == "no")
                    no++;
                else if (rows[i].response == "maybe")
                    maybe++;
                    
                if (rows[i].time == "2100")
                    time2100++;
                else if (rows[i].time == "2115")
                    time2115++;
                else if (rows[i].time == "2130")
                    time2130++;
                else if (rows[i].time == "2145")
                    time2145++;
                else if (rows[i].time == "2200")
                    time2200++;
                total++;
                if (rows[i].time != null)
                    total_h++;
            }
            
            var perc2100 = 0;
            if (total_h > 0)
                perc2100 = Math.round((time2100/total_h)*100);
            var perc2115 = 0;
            if (total_h > 0)
                perc2115 = Math.round((time2115/total_h)*100);
            var perc2130 = 0;
            if (total_h > 0)
                perc2130 = Math.round((time2130/total_h)*100);
            var perc2145 = 0;
            if (total_h > 0)
                perc2145 = Math.round((time2145/total_h)*100);
            var perc2200 = 0;
            if (total_h > 0)
                perc2200 = Math.round((time2200/total_h)*100);

            text += "\n\n*Totali*: " + total + " su " + total_group + "\n*Totali con orario*: " + total_h + "\n\n*Sì*: " + yes + " (" +  Math.round((yes/total)*100) + "%)\n*Forse*: " + maybe + " (" + Math.round((maybe/total)*100) + "%)\n*No*: " + no + " (" +  Math.round((no/total)*100) + "%)\n\n*21:00*: " + time2100 + " (" +  perc2100 + "%)\n*21:15*: " + time2115 + " (" +  perc2115 + "%)\n*21:30*: " + time2130 + " (" +  perc2130 + "%)\n*21:45*: " + time2145 + " (" +  perc2145 + "%)\n*22:00*: " + time2200 + " (" +  perc2200 + "%)";
            bot.sendMessage(message.chat.id, text, {parse_mode: "markdown"});
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
    let weekday = split[3];
    var username = "";
    if (message.from.username == undefined)
        username = message.from.first_name;
    else
        username = "@" + message.from.username;
    let user_id = message.from.id;
    // Accetta solo i valori generati dai pulsanti del bot (finiscono nelle query)
    if (!/^\d+$/.test(id) || !/^(yes|no|maybe|games|talk|\d{4})$/.test(param) || (weekday !== undefined && !/^-?\d$/.test(weekday))) {
        bot.answerCallbackQuery(message.id, {text: "Pulsante non valido"});
        return;
    }
    if (fun == "partecipation") {
        connection.query("SELECT add_date FROM partecipation WHERE id = " + id, function (err, rows) {
            if (err) throw err;
            if (Object.keys(rows).length == 0) {
                bot.answerCallbackQuery(message.id, {text: "Sondaggio non trovato!"});
                return;
            }
            let add_date = new Date(Date.parse(rows[0].add_date));
            let now = new Date();
            if (add_date.getFullYear() + "-" + (add_date.getMonth()+1) + "-" + add_date.getDate() != now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate()) {
                bot.answerCallbackQuery(message.id, {text: "Sondaggio scaduto!"});
                return;
            }
            connection.query("SELECT id, user_id, response, time, event FROM partecipation_user WHERE partecipation_id = " + id + " AND user_id = " + user_id, function (err, rows) {
                if (err) throw err;
                if (Object.keys(rows).length == 0) {
                    if ((param == "games") || (param == "talk")) {
                        connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response, event) VALUES (" + id + ", " + user_id + ", " + connection.escape(username) + ", 'yes', '" + param + "')", function (err, rows) {
                            if (err) throw err;
                            printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                        });
                    } else if (isNaN(param)) {  // yes/no
                        connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response) VALUES (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "')", function (err, rows) {
                            if (err) throw err;
                            printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                        });
                    } else {    // time
                        connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response, time) VALUES (" + id + ", " + user_id + ", " + connection.escape(username) + ", 'yes', '" + param + "')", function (err, rows) {
                            if (err) throw err;
                            printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                        });
                    }
                    bot.answerCallbackQuery(message.id, {text: "Ok!"});
                } else {
                    let partecipation_user_id = rows[0].id;
                    let response = rows[0].response;
                    let time = rows[0].time;
                    let eventParam = rows[0].event;
                    if (response == param) {
                        bot.answerCallbackQuery(message.id, {text: "Hai già votato questa opzione!"});
                    } else if (param == eventParam) {
                        connection.query("UPDATE partecipation_user SET event = NULL WHERE id = " + partecipation_user_id, function (err, rows) {
                            if (err) throw err;
                            printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                        });
                    } else if ((param == "games") || (param == "talk")) {
                            connection.query("UPDATE partecipation_user SET event = '" + param + "' WHERE id = " + partecipation_user_id, function (err, rows) {
                                if (err) throw err;
                                printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                            });
                    } else if (time == param) {
                        connection.query("UPDATE partecipation_user SET time = NULL WHERE id = " + partecipation_user_id, function (err, rows) {
                            if (err) throw err;
                            printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                        });
                        bot.answerCallbackQuery(message.id, {text: "Orario rimosso!"});
                    } else {
                        if (isNaN(param)) {
                            connection.query("UPDATE partecipation_user SET response = '" + param + "' WHERE id = " + partecipation_user_id, function (err, rows) {
                                if (err) throw err;
                                printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                            });
                        } else {
                            connection.query("UPDATE partecipation_user SET time = '" + param + "' WHERE id = " + partecipation_user_id, function (err, rows) {
                                if (err) throw err;
                                printPartecipations(message.message.chat.id, message.message.message_id, message.id, id);
                            });
                        }
                        bot.answerCallbackQuery(message.id, {text: "Ok!"});
                    }
                }
            });
        });
    } else if (fun == "partecipationw") {
        connection.query("SELECT add_date FROM partecipation WHERE id = " + id, function (err, rows) {
            if (err) throw err;
            if (Object.keys(rows).length == 0) {
                bot.answerCallbackQuery(message.id, {text: "Sondaggio non trovato!"});
                return;
            }
            let add_date = new Date(Date.parse(rows[0].add_date));
            let now = new Date();
            if (add_date.getFullYear() + "-" + (add_date.getMonth()+1) + "-" + add_date.getDate() != now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate()) {
                bot.answerCallbackQuery(message.id, {text: "Sondaggio scaduto!"});
                return;
            }

            if (weekday == "-1") {
                connection.query("DELETE FROM partecipation_user WHERE user_id = " + user_id, function (err, rows) {
                    if (err) throw err;
                    connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response, dayofweek) VALUES (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 0), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 1), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 2), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 3), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 4), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 5), (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', 6)", function (err, rows) {
                        if (err) throw err;
                        printPartecipationsWeekly(message, id);
                    });
                    bot.answerCallbackQuery(message.id, {text: "Ok!"});
                });
                return;
            }

            connection.query("SELECT id, user_id, response, time, dayofweek FROM partecipation_user WHERE partecipation_id = " + id + " AND user_id = " + user_id + " AND dayofweek = " + weekday, function (err, rows) {
                if (err) throw err;
                if (Object.keys(rows).length == 0) {
                    connection.query("INSERT INTO partecipation_user (partecipation_id, user_id, username, response, dayofweek) VALUES (" + id + ", " + user_id + ", " + connection.escape(username) + ", '" + param + "', " + weekday + ")", function (err, rows) {
                        if (err) throw err;
                        printPartecipationsWeekly(message, id);
                    });
                    bot.answerCallbackQuery(message.id, {text: "Ok!"});
                } else {
                    let partecipation_user_id = rows[0].id;
                    let response = rows[0].response;
                    let dayofweek = rows[0].dayofweek;
                    if ((response == param) && (dayofweek == weekday)) {
                        bot.answerCallbackQuery(message.id, {text: "Hai già votato questa opzione!"});
                    } else if (dayofweek == weekday) {
                        connection.query("UPDATE partecipation_user SET response = '" + param + "' WHERE id = " + partecipation_user_id + " AND dayofweek = " + weekday, function (err, rows) {
                            if (err) throw err;
                            printPartecipationsWeekly(message, id);
                        });
                        bot.answerCallbackQuery(message.id, {text: "Ok!"});
                    }
                }
            });
        });
    }
});

function printPartecipations(chat_id, message_id, inline_message_id, partecipation_id) {
    connection.query("SELECT partecipants FROM partecipation_chat WHERE chat_id = '" + chat_id + "'", function (err, rows) {
        if (err) throw err;
        var total_partecipants = -1;
        if (Object.keys(rows).length > 0)
            total_partecipants = rows[0].partecipants;
        connection.query("SELECT username, response, time, event FROM partecipation_user WHERE partecipation_id = " + partecipation_id, function (err, rows) {
            if (err) throw err;
            var voted_partecipations = Object.keys(rows).length;
            
            if (chat_id == nabbiChatId) {
                var newText = originalText1 + "\n\n";

                var currentDayOfWeek = new Date().getDay();
                var rows_week = connection_sync.query("SELECT username, response FROM partecipation_user WHERE dayofweek = " + currentDayOfWeek);

                var userTotalArray = [];
                for (var i = 0; i < Object.keys(rows).length; i++)
                    userTotalArray.push(rows[i].username);

                var c = 0;
                var partText = "";
                var userArray = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    if (rows[i].response == "yes") {
                        var time = "";
                        var event = "";
                        if (rows[i].time != null)
                            time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
                        if (rows[i].event == "games")
                            event = " 🎯";
                        else if (rows[i].event == "talk")
                            event = " 🗣️";
                        partText += rows[i].username + time + event + "\n";
                        userArray.push(rows[i].username);
                        c++;
                    }
                }
                for (var i = 0; i < Object.keys(rows_week).length; i++) {
                    if (rows_week[i].response == "yes") {
                        if ((userArray.indexOf(rows_week[i].username) == -1) && (userTotalArray.indexOf(rows_week[i].username) == -1)) {
                            partText += rows_week[i].username + " 📆\n";
                            c++;
                            voted_partecipations++;
                        }
                    }
                }
                if (c > 0)
                    newText += "Sì:\n" + partText + "\n";

                var c = 0;
                var partText = "";
                userArray = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    if (rows[i].response == "maybe") {
                        var time = "";
                        var event = "";
                        if (rows[i].time != null)
                            time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
                        if (rows[i].event == "games")
                            event = " 🎯";
                        else if (rows[i].event == "talk")
                            event = " 🗣️";
                        partText += rows[i].username + time + event + "\n";
                        userArray.push(rows[i].username);
                        c++;
                    }
                }
                for (var i = 0; i < Object.keys(rows_week).length; i++) {
                    if (rows_week[i].response == "maybe") {
                        if ((userArray.indexOf(rows_week[i].username) == -1) && (userTotalArray.indexOf(rows_week[i].username) == -1)) {
                            partText += rows_week[i].username + " 📆\n";
                            c++;
                            voted_partecipations++;
                        }
                    }
                }
                if (c > 0)
                    newText += "Forse:\n" + partText + "\n";

                var c = 0;
                var partText = "";
                userArray = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    if (rows[i].response == "no") {
                        var time = "";
                        var event = "";
                        if (rows[i].time != null)
                            time = " (" + rows[i].time.slice(0,2) + ":" + rows[i].time.slice(2) + ")";
                        if (rows[i].event == "games")
                            event = " 🎯";
                        else if (rows[i].event == "talk")
                            event = " 🗣️";
                        partText += rows[i].username + time + event + "\n";
                        userArray.push(rows[i].username);
                        c++;
                    }
                }
                for (var i = 0; i < Object.keys(rows_week).length; i++) {
                    if (rows_week[i].response == "no") {
                        if ((userArray.indexOf(rows_week[i].username) == -1) && (userTotalArray.indexOf(rows_week[i].username) == -1)) {
                            partText += rows_week[i].username + " 📆\n";
                            c++;
                            voted_partecipations++;
                        }
                    }
                }
                if (c > 0)
                    newText += "No:\n" + partText + "\n";

                // Inline keyboard aggiornata con il layout richiesto e la rimozione dei bottoni "Solo"
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
                    text: "21:00",
                    callback_data: partecipation_id + ":partecipation:2100"
                },{
                    text: "21:15",
                    callback_data: partecipation_id + ":partecipation:2115"
                },{
                    text: "21:30",
                    callback_data: partecipation_id + ":partecipation:2130"
                }],[{
                    text: "21:45",
                    callback_data: partecipation_id + ":partecipation:2145"
                },{
                    text: "22:00",
                    callback_data: partecipation_id + ":partecipation:2200"
                }]);
            }

            if (total_partecipants != -1)
                newText += "Votanti: " + voted_partecipations + "/" + total_partecipants;

            bot.editMessageText(newText, {chat_id: chat_id, message_id: message_id, parse_mode: 'HTML', reply_markup: {inline_keyboard: iKeys}});
            if (inline_message_id != null) bot.answerCallbackQuery(inline_message_id, {text: "Ok!"});
        });
    });
}

function printPartecipationsWeekly(message, partecipation_id) {
    connection.query("SELECT partecipants FROM partecipation_chat WHERE chat_id = '" + message.message.chat.id + "'", function (err, rows) {
        if (err) throw err;
        var total_partecipants = -1;
        if (Object.keys(rows).length > 0)
            total_partecipants = rows[0].partecipants;
        connection.query("SELECT user_id, username, response FROM partecipation_user WHERE partecipation_id = " + partecipation_id + " GROUP BY user_id", function (err, rows) {
            if (err) throw err;
            var voted_partecipations = Object.keys(rows).length;
            
            var newText = originalText3 + "\n\n";

            var c = 0;
            var partText = "";
            for (var i = 0; i < Object.keys(rows).length; i++) {
                var user_votes = connection_sync.query("SELECT response, dayofweek FROM partecipation_user WHERE partecipation_id = " + partecipation_id + " AND user_id = " + rows[i].user_id + " ORDER BY dayofweek");
                var days = [1,2,3,4,5,6,0];
                var partVotes = "";
                for (var j = 0; j < days.length; j++) {
                    var found = 0;
                    for (var k = 0; k < Object.keys(user_votes).length; k++) {
                        if (days[j] == user_votes[k].dayofweek) {
                            if (user_votes[k].response == "yes")
                                partVotes += "✅ ";
                            else if (user_votes[k].response == "maybe")
                                partVotes += "🤔 ";
                            else if (user_votes[k].response == "no")
                                partVotes += "❌ ";
                            found = 1;
                        }
                    }
                    if (found == 0)
                        partVotes += "▢";
                }
                partText += rows[i].username + " " + partVotes + "\n";
                c++;
            }
            if (c > 0)
                newText += "Hanno selezionato:\n" + partText + "\n";

            var iKeys = [];
            var days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
            var daysn = [1, 2, 3, 4, 5, 6, 0];

            iKeys.push([{
                text: "🌟",
                callback_data: "null"
            },{
                text: "✅",
                callback_data: partecipation_id + ":partecipationw:yes:-1"
            },{
                text: "🤔",
                callback_data: partecipation_id + ":partecipationw:maybe:-1"
            },{
                text: "❌",
                callback_data: partecipation_id + ":partecipationw:no:-1"
            }]);

            for (var i = 0; i < days.length; i++) {
                iKeys.push([{
                    text: days[i],
                    callback_data: "null"
                },{
                    text: "✅",
                    callback_data: partecipation_id + ":partecipationw:yes:" + daysn[i]
                },{
                    text: "🤔",
                    callback_data: partecipation_id + ":partecipationw:maybe:" + daysn[i]
                },{
                    text: "❌",
                    callback_data: partecipation_id + ":partecipationw:no:" + daysn[i]
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
    } else {
        datetime = "Error";
    }
    
    if (obj == true) datetime = new Date(datetime);
    
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