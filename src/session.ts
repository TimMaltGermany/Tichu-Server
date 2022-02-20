'use strict';

import {IncomingMessage} from 'http';
import {Socket} from 'net';
import * as WebSocket from 'ws';
import {Data} from 'ws';
import {Commands} from "./commands";
import PlayerModel, {IPlayerDict, Phase, PlayerStatus} from "./models/PlayerModel";
import TableModel from "./models/TableModel";
import {Announced, fromAnnouncementString} from "./enums/Announced";

const session = require('express-session');
const express = require('express');
const http = require('http');
const uuid = require('uuid');

const pino = require('pino');

const app = express();
const connections = new Map<string, WebSocket>();
const userIds = new Set<string>();

let testUsers = [["Knut", "Darmstadt"], ["Andrea", "Bonn"], ["Bettina", "Darmstadt"]];
// let testUsers = [["Andrea", "Bonn"], ["Bettina", "Darmstadt"]];

//
// run with tsc;node dist/server/session.js
//
const sessionParser = session({
    saveUninitialized: false,
    secret: '$eCuRiTy',
    resave: false
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));
app.use(sessionParser);

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// @ts-ignore
app.post('/login', function (req, res) {
    //
    // "Log in" user and set userId to session.
    //
    const id = uuid.v4();
    logger.info(`Updating session for user ${id}`);
    req.session.userId = id;
    // TODO - check login credentials
    //TODO - check whether user is already in the map
    userIds.add(id);
    res.send({result: 'OK', message: 'Session updated', token: id, table: table.id});
});

// @ts-ignore
app.delete('/logout', function (request, response) {
    userIds.delete(request.session.userId);
    const ws = connections.get(request.session.userId);

    logger.info('Destroying session');
    request.session.destroy(function () {
        if (ws) ws.close();

        response.send({result: 'OK', message: 'Session destroyed'});
    });
});

//
// Create an HTTP server.
//
const server = http.createServer(app);
const table = new TableModel();

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocket.Server({clientTracking: false, noServer: true});

server.on('upgrade', function (request: IncomingMessage, socket: Socket, head: Buffer) {
    logger.info('Parsing session from request...');
    let userId = "";
    if (typeof request.url === "string") {
        //console.log(request.url);
        userId = request.url.substring(request.url.indexOf("=") + 1)
        //console.log(userId);
    }


    if (userId == "" || !userIds.has(userId)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        logger.warn('Session invalid!');
        return;
    }

    if (table.isFull(true)) {
        socket.write('HTTP/1.1 501 Table full\r\n\r\n');
        socket.destroy();
        logger.error('Max number players exceeded!');
        return;
    }

    logger.info(`Player is connected!`);

    wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, userId, request);
    });

});

wss.on('connection', function (ws: WebSocket, userId: string, request: IncomingMessage) {
    // const userId = request.session.userId;

    connections.set(userId, ws);

    ws.on('message', function (message: Data) {

        const messageObj = JSON.parse(message as string);
        logger.info(`Received message from user ${userId}:`);
        logger.info(messageObj);

        const cmd = messageObj['cmd'];
        const data = messageObj['data'];

        switch (cmd) {
            case Commands.REGISTER_PLAYER:
                const player: PlayerModel = handle_register_player(userId, data);
                if (testUsers.length > 0) {
                    testUsers = testUsers.filter(p => p[0] != player.name);
                    testUsers.forEach(p => handle_register_player(p[0], {name: p[0], team: p[1], seat: -1}));
                }
                break;
            case Commands.DEAL:
                handle_deal_new_game();
                break;
            case Commands.ANNOUNCE:
                handle_announce(userId, data['value']);
                if (testUsers.length > 0) {
                    testUsers.forEach(p => handle_announce(p[0], data['value']));
                    if (table.getPlayerById(userId)?.announced != null) {
                        schupf_test_player(testUsers[0][0]);
                    }
                }
                break;
            case Commands.SCHUPFEN_FINISHED:
                if (testUsers.length > 0) {
                    if (table.getPlayerById(userId)?.announced == null) {
                        schupf_test_player(testUsers[0][0]);
                    }
                }
                handle_player_schupfed(userId, data['cards']);
                if (testUsers.length > 1) {
                    for (let i=1; i<testUsers.length; i++) {
                        schupf_test_player(testUsers[i][0]);
                    }
                }
                break;
            case Commands.TURN_FINISHED:
                const nextSeat = handle_player_finished_turn(userId, data['cards']);

                if (nextSeat && testUsers.length > 0) {
                    const nextPlayer = table.getPlayerBySeat(nextSeat);
                    turn_test_player(nextPlayer!.id, data['cards'].length);
                }
                break;
            default:
                //simply return message, in the future, ignore
                ws.send(JSON.stringify(message));
        }


    });

    ws.on('close', function () {
        logger.info(`user ${userId} lost connection`);
        table.disablePlayer(userId);
        userIds.delete(userId);
        connections.delete(userId);
    });
});

//
// Start the server.
//
server.listen(7001, function () {
    console.log('Listening on http://localhost:7001');
});

function turn_test_player(playerId: string, numCards: number) {
    if (testUsers.filter((v, ix, a) => v[0] == playerId).length > 0) {
        const data : string[] = [];
        let currentTricks = table.getCurrentTrick();
        console.log("No current tricks: " + currentTricks.length);
        if (currentTricks.length == 0 || Math.random() < 0.9) {
            const p: PlayerModel = table.getPlayerById(playerId)!;
            if (currentTricks.length > 0) {
                let highestTrick = currentTricks[currentTricks.length - 1];
                let highestCard = highestTrick[highestTrick.length-1];
                console.log("Highest card: " + highestCard.name);
                let higherCards = p.cards.filter(p2 => p2.rank > highestCard.rank);
                if (higherCards.length > 0) {
                    data[0] = higherCards[Math.floor(Math.random() * higherCards.length)].name;
                }
            } else {
                console.log("Playing  " + Math.max(1, numCards) + " random cards");
                for (let ix = 0; ix < Math.max(1, numCards); ix++) {
                    data[ix] = p.cards[ix].name;
                }
            }
        }
        const nextSeat = handle_player_finished_turn(playerId, data);
        if (nextSeat) {
            const nextPlayer = table.getPlayerBySeat(nextSeat);
            turn_test_player(nextPlayer!.id, numCards);
        }
    }
}


function schupf_test_player(playerId: string) {
    const p: PlayerModel = table.getPlayerById(playerId)!;
    if (p.phase == Phase.GAME_STATE_3_SCHUPFEN) {
        logger.info(`TestPlayer ${playerId} is in phase ${p.phase}`);
        const s1 = String((p.seat + 3) % 4);

        const message = "{\"data\":{\"cards\":[{\"seat\":" + s1 + ", \"card\": \"" + p.cards[0].name + "\"}," +
            "{\"seat\":" + String((p.seat + 1) % 4) + ", \"card\": \"" + p.cards[1].name + "\"}," +
            "{\"seat\":" + String((p.seat + 2) % 4) + ", \"card\": \"" + p.cards[2].name + "\"}]}}";
        const messageObj = JSON.parse(message as string);
        handle_player_schupfed(playerId, messageObj['data']['cards']);
    }
}

function handle_deal_new_game() {
    logger.info(`dealing new game`);
    connections.forEach((value: WebSocket, key: string) => {
        if (value.readyState === WebSocket.OPEN) {
            value.send(JSON.stringify({
                'cmd': Commands.DEAL
            }));
        } else {
            logger.warn(`client ${key} not ready`);
        }
    });

    table.dealNewGame();
    update_clients();
}

function update_clients() {
    connections.forEach((value: WebSocket, key: string) => {
        if (value.readyState === WebSocket.OPEN) {
            table.getPlayers().forEach(p => {
                value.send(JSON.stringify({
                    'cmd': Commands.PLAYER_UPDATE,
                    'userID': p.id,
                    'player': p
                }));
            });
            value.send(JSON.stringify({
                    'cmd': Commands.UPDATE_GAME_STATE,
                    'cards': table.getCurrentTrick()
            }));
        } else {
            logger.warn(`client ${key} not ready`);
        }
    });
}

function handle_register_player(userId: string, playerData: IPlayerDict) {
    logger.info(`registering new player`);
    let player = PlayerModel.fromJson(userId, playerData);
    logger.info(player);
    if (table.playerJoins(player)) {

        logger.info(`informing clients about new player`);
        connections.forEach((value: WebSocket, key: string) => {
            if (value.readyState === WebSocket.OPEN) {
                value.send(JSON.stringify({
                    'cmd': Commands.REGISTER_PLAYER,
                    'userID': player.id,
                    'player': player
                }));
            } else {
                logger.warn(`client ${key} not ready`);
            }
        });

        logger.info(`informing new client ${player.id} about previously registered users`);
        let client = connections.get(player.id);
        if (client?.readyState === WebSocket.OPEN) {
            table.getPlayers().forEach((registered_player: PlayerModel) => {
                if (registered_player != undefined && userId != registered_player.id) {
                    logger.info(`informing new client ${player.id} about registered user ${registered_player.id}`);
                    client?.send(JSON.stringify({
                        'cmd': Commands.REGISTER_PLAYER,
                        'userID': registered_player.id,
                        'player': registered_player
                    }));
                }
            });
        } else {
            logger.warn(`client ${player.id} not ready`);
        }
        if (table.isFull(false)) {
            logger.info(`game ready to start`);
            connections.forEach((value: WebSocket, key: string) => {
                if (value.readyState === WebSocket.OPEN) {
                    value.send(JSON.stringify({
                        'cmd': Commands.START_GAME
                    }));
                } else {
                    logger.warn(`client ${key} not ready`);
                }
            });
        }
    }
    return player;
}

function handle_announce(userId: string, announcement: string) {
    const player = table.getPlayerById(userId);
    player!.announced = fromAnnouncementString(announcement);
    if (player!.announced != Announced.NOTHING) {
        logger.info(`Player ${userId} announced ${player!.announced}`);
    }
    if (player!.announced == Announced.GRAND_TICHU ||
        player!.announced == Announced.NOTHING) {
        if (player!.phase == Phase.GAME_STATE_2_GRAND_TICHU) {
            // remember announcement, rest of cards and change player status
            player!.showAllCards();
            // state change to schupfen
            player!.setStatus(PlayerStatus.PASSIVE, Phase.GAME_STATE_3_SCHUPFEN)
        }
    }

    update_clients();
}

export function handle_player_schupfed(userId: string, cards: Map<string, any>[]) {
    const player = table.getPlayerById(userId);
    const l = cards.length;
    logger.info(`Player ${userId} schupfed ${l} cards.`);

    cards.forEach((seatCardNameXY: any) => {
        //logger.info(`seatCardName: ${seatCardName}`);
        const cardName = seatCardNameXY['card'] as string;
        let cardModel = table.findCard(cardName);
        if (cardModel != null) {
            player?.removeCard(cardModel!);
            const seat = seatCardNameXY['seat'] as number;
            const otherPlayer = table.getPlayerBySeat(seat);
            if (otherPlayer) {
                logger.info("Moving card to player: %s at seat %d", otherPlayer.name, seat);
                cardModel!.setOwner(otherPlayer);
                const x = seatCardNameXY['x'] as number;
                const y = seatCardNameXY['y'] as number;
                cardModel!.setPosition(x, y);
                otherPlayer.addCard(cardModel!);
                cardModel!.is_visible = otherPlayer.phase == Phase.GAME_STATE_5_PLAY;
            }
        }
    });

    player!.setStatus(PlayerStatus.PASSIVE, Phase.GAME_STATE_5_PLAY)
    logger.info(`SCHUPFEN: Player ${userId} is in phase ${player!.phase}`);

    player!.showAllCards();

    // if all are ready, then set start player
    if (table.checkAllPlayersInPhase(Phase.GAME_STATE_5_PLAY)) {
        logger.info("Schupfen finished - the real game can start!")
        table.setStartPlayer(undefined);
    }
    update_clients();
}

export function handle_player_finished_turn(userId: string, cards: string[]) {
    const nextSeat = table.finishTurn(userId, cards);
    update_clients();
    return nextSeat;
}

