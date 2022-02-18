import PlayerModel, {Phase, PlayerStatus} from "./PlayerModel";
import CardModel, {CardState, get_cards} from "./CardModel";

import {NUMBER_CARDS, NUMBER_CARDS_PER_PLAYER, NUMBER_PLAYERS, SpecialCardRanks, WINNING_SCORE} from "../Ranks";
import {shuffle} from "../utils";
import {Announced} from "../enums/Announced";


const pino = require('pino');

const uuid = require('uuid');

/**
 * a table has exactly 4 players in two teams of 2 players each
 */
export default class TableModel {

    static logger = pino({level: process.env.LOG_LEVEL || 'info'});

    private tableId: string = "/" + uuid.v4();
    private _seats: PlayerModel[] = new Array<PlayerModel>(NUMBER_PLAYERS);
    private cards: Map<string, CardModel> = get_cards();

    private _team1?: string = undefined;
    private _team2?: string = undefined;

    private state: Phase = Phase.GAME_STATE_NEW;
    private highest_trick_owner: PlayerModel | undefined = undefined;
    // list of tuples with (player, set(card_ids)) on server
    private current_trick: string[][] = [];
    private game_scores: Map<string, number>[] = [];
    // list of players with information about their state
    // private player_data: Table = Table();
    private trick_to_animate: number[] | undefined = undefined;

    isFull(): boolean {
        for (let seat of this._seats) {
            if (seat == undefined || !seat.connected) {
                return false;
            }
        }
        return true;
    }

    get id(): string {
        return this.tableId;
    }

    getState(): Phase {
        return this.state;
    }

    getPlayerById(id: string): PlayerModel | undefined {
        for (let player of this._seats) {
            if (player != undefined && player.id == id) {
                return player;
            }
        }
        return undefined;
    }

    getPlayerBySeat(seat: number): PlayerModel | undefined {
        for (let player of this._seats) {
            if (player != undefined && player.seat == seat) {
                return player;
            }
        }
        return undefined;
    }


    getPlayers(): PlayerModel[] {
        return this._seats;
    }

    getPlayer(player: PlayerModel): PlayerModel | undefined {
        for (let seat of this._seats) {
            if (seat != undefined && seat.id == player.id) {
                return seat;
            }
        }
        return undefined;
    }

    getDisconnectedPlayerByNameAndTeam(player: PlayerModel): PlayerModel | undefined {
        for (let seat of this._seats) {
            if (seat != undefined && !seat.connected && seat.name == player.name
                && seat.team == player.team) {
                return seat;
            }
        }
        return undefined;
    }

    playerJoins(player: PlayerModel): boolean {

        // first check if we already know about this person
        let tablePlayer = this.getPlayer(player)
        if (tablePlayer == undefined) {
            tablePlayer = this.getDisconnectedPlayerByNameAndTeam(player);
        }
        if (tablePlayer != undefined) {
            TableModel.logger.info("Welcome back %s (%s@%s)", player.name, player.team, this.tableId);
            tablePlayer.connected = true;
            player.connected = tablePlayer.connected;
            player.team = tablePlayer.team;
            player.seat = tablePlayer.seat;
            tablePlayer.id = player.id;
            return true;
        }

        if (this.isFull()) {
            TableModel.logger.warn("Sorry buddy, but the table is already full");
            return false;
        }

        // find empty seat for this player / team combination
        // make sure that there are exactly 2 teams with 2 players in each team
        let playerOk = true;
        if (this._seats[0] == undefined) {
            this._seats[0] = player;
            player.seat = 0;
            this._team1 = player.team;
        } else if (this._seats[2] == undefined && player.team == this._team1) {
            this._seats[2] = player;
            player.seat = 2;
        } else if (this._seats[1] == undefined) {
            this._seats[1] = player;
            player.seat = 1;
            if (player.team == this._team1) {
                TableModel.logger.warn("Team (%s) has already two players. " +
                    "Player %s will be assigned dummy team name 'TEAM_DUMMY'",
                    this._team1, player.name);
                player.team = 'TEAM_DUMMY';
            }
            this._team2 = player.team;
        } else if (this._seats[3] == undefined && player.team == this._team2) {
            this._seats[3] = player;
            player.seat = 3;
        } else {
            // team name probably incorrect or 3 players in a single team...
            // assign seat at position 2 or 3
            if (this._seats[3] == undefined) {
                TableModel.logger.warn("There are already 2 teams (%s and %s), player %s will be assigned to: %s.",
                    this._team1, this._team2, player.name, this._team2);
                this._seats[3] = player;
                player.team = this._team2!;
                player.seat = 3;
            } else if (this._seats[2] == undefined) {
                TableModel.logger.warn("There are already 2 teams (%s and %s), player %s will be assigned to: %s.",
                    this._team1, this._team2, player.name, this._team1);
                this._seats[2] = player;
                player.team = this._team1!;
                player.seat = 2;
            }
        }
        if (playerOk) {
            player.connected = true;
            TableModel.logger.info("Player %s joined the game (%s, %d)", player.name, player.team, player.seat);
        }
        if (player.team == this._team1 && this._seats[0] != undefined && this._seats[2] != undefined) {
            TableModel.logger.info("Team 1 (%s) is complete!", this._team1);
        }
        if (player.team == this._team2 && this._seats[1] != undefined && this._seats[3] != undefined) {
            TableModel.logger.info("Team 2 (%s) is complete!", this._team2)
        }
        return playerOk;
    }

    disablePlayer(userId: string) {
        let tablePlayer = this.getPlayerById(userId);
        if (tablePlayer != undefined) {
            tablePlayer.connected = false;
        }
    }

    // one player requested that new cards are dealt - we assume it is ok for all of them for now
    dealNewGame() {

        let card_assignments = shuffle([...Array(NUMBER_CARDS).keys()]);
        let cardArray = new Array<CardModel>(NUMBER_CARDS);
        let ix = 0;
        this.cards.forEach((card, _) => {
            card.reset();
            cardArray[ix++] = card;
        });

        this._seats.forEach(p => {
            p.reset();
            p.setStatus(PlayerStatus.PASSIVE, Phase.GAME_STATE_2_GRAND_TICHU);
        });

        ix = 0;
        let num_visible = 0;
        this._seats.forEach(p => {
            const cards_for_player: CardModel[] = [];
            for (let j = 0; j < NUMBER_CARDS_PER_PLAYER; j++) {
                const card = cardArray[card_assignments[ix + j]];
                card.reset();
                card.setOwner(p);
                card.set_state(CardState.ON_HAND);
                if (j < 8) {
                    num_visible += 1;
                }
                card.is_visible = (j < 8);
                cards_for_player.push(card);
            }
            // should be done by the client
            // this._set_initial_card_position(cards_for_player);
            p.setCards(cards_for_player);
            ix += NUMBER_CARDS_PER_PLAYER;
        });


        // self.logger.debug("Number visible cards after dealing: %d", num_visible)
        this.state = Phase.GAME_STATE_2_GRAND_TICHU;
        this.highest_trick_owner = undefined;
        this.current_trick = [];
        this.trick_to_animate = undefined;

        if (this.isGameSetOver(false)) {
            this.game_scores = [];
        }
    }

    isGameSetOver(save_scores: boolean): boolean {
        let winningTeam = undefined;
        let maxScore = 0;
        this.get_total_score().forEach((score, team) => {
            if (score > WINNING_SCORE && score > maxScore) {
                maxScore = score;
                winningTeam = team;
            }
        });

        if (maxScore > WINNING_SCORE) {
            TableModel.logger.info("Team %s won!", winningTeam);
            if (save_scores) {
                // load previous scores and combine
                /*
            t = time.time()
            // TODO - write to DB
            filename = 'game_scores.json'
            if (os.path.isfile(filename)) {
                with open(filename, 'r') as f:
                    old_scores = json.loads(f.read())
            } else {
                old_scores = {}
                }
            old_scores[t] = self.game_scores
            // save score
            str_scores = json.dumps(old_scores)
            with open(filename, 'w') as f:
                f.write(str_scores)
            }
             */
            }
            return true;
        }
        return false;
    }

    get_total_score(): Map<string, number> {
        const total_score: Map<string, number> = new Map();
        this.game_scores.forEach(game_score => {
            game_score.forEach((score, team) => {
                if (total_score.has(team)) {
                    total_score.set(team, total_score.get(team)! + score);
                } else {
                    total_score.set(team, score);
                }
            })
        })
        return total_score;
    }

    add_score(game_score: Map<string, number>) {
        TableModel.logger.info("Game score: %s", JSON.stringify(Object.fromEntries(game_score)));
        this.game_scores.push(new Map(game_score));
        TableModel.logger.info(game_score);
    }

    findCard(cardName: string | undefined): CardModel | undefined {
        if (cardName != null) {
            let match = this.cards.get(cardName!);
            if (match != null) {
                return match;
            }
        }
        TableModel.logger.error("Card %s not found!", cardName);
        return undefined;
    }

    checkAllPlayersInPhase(phase: Phase) {
        let allPlayersInPhase = true;
        this._seats.forEach(player => {
            if (player?.phase != phase) {
                allPlayersInPhase = false;
            }
        });
        return allPlayersInPhase;
    }

    setStartPlayer(start_player: string | undefined) {
        if (start_player == null) {
            // very first trick - owner of Mahjong starts
            // set start player depending on who has the mahjong
            start_player = this.cards.get(SpecialCardRanks.get(1)!)!.get_owner();
            TableModel.logger.info("%s will start the game", start_player);
        }
        if (start_player != null) {
            this.highest_trick_owner = this.getPlayerById(start_player!);
            //TableModel.logger.info("%s will start new trick", this.highest_trick_owner?.id);
            this.highest_trick_owner?.setStatus(PlayerStatus.ACTIVE, Phase.GAME_STATE_5_PLAY);
        } else {
            TableModel.logger.info("No start player found ...")
            this.highest_trick_owner = undefined;
        }
        this.resetPlayersPassedInfo();
    }

    resetPlayersPassedInfo() {
        this._seats.forEach(player => {
            player.resetHasPassed();
        });
    }

    checkIfAllPlayersPassed(): boolean {
        return this._seats.filter(player => {
            return player.has_passed;
        }).length == NUMBER_PLAYERS;
    }

    private checkIfTrickFinished() {
        return this._seats.filter(player => {
            return (player.has_passed || player.isDone());
        }).length >= 3;
    }


    finishTurn(userId: string, cards: string[]): number | undefined {
        const player = this.getPlayerById(userId);
        let currentSeat = player!.seat;
        if (cards == null || cards.length == 0) {
            TableModel.logger.info(`Player ${userId} passed.`);
            player!.has_passed = true;
        } else if (cards.length == 1 && cards[0] == SpecialCardRanks.get(-99)) {
            TableModel.logger.info(`Player ${userId} has played the DOGS.`);
            this.resetPlayersPassedInfo();
            let cardModel = this.findCard(cards[0]);
            cardModel!.is_visible = true;
            cardModel!.setOwnerAsTable(CardState.ON_TABLE_PLAYED);
            cardModel!.set_state(CardState.ON_TABLE_PLAYED);
            //self.play_sound('bark')
            // simply pretend the next player played something ...
            currentSeat = (currentSeat + 1) % 4;
        } else {
            // active player may not be who has played (bomb)
            this.current_trick.push(cards);
            this.resetPlayersPassedInfo();
            const l = cards.length;
            TableModel.logger.info(`Player ${userId} played ${l} cards.`);
            this.highest_trick_owner = player!;

            //game_state.finish_turn_part1(n.player_id, n.value, self.send_game_state_to_clients)

            //if self._active_player == n.player_id:
            //trick_was_finished_with = _game_state.finish_turn_part2(n.player_id, self.send_game_state_to_clients)

            //if trick_was_finished_with == SpecialCards.DRAKE:
            // send request to client
            //p = _game_state.get_player_data(_game_state.highest_trick_owner)
            //emit(constants.CMD.ASSIGN_DRAKE,
            //    {constants.JSON_PLAYER_ID: _game_state.highest_trick_owner},
            //room=_game_state.get_table_id() + str(p.seat_no)

            cards.forEach((cardName: any) => {
                let cardModel = this.findCard(cardName);
                if (cardModel != null) {
                    player?.removeCard(cardModel!);
                    cardModel!.is_visible = true;
                    TableModel.logger.info("Playing card: %s", cardModel!.name);
                    cardModel!.setOwnerAsTable(CardState.ON_TABLE_PLAYED);
                    cardModel!.set_state(CardState.ON_TABLE_PLAYED);
                }
            });
        }
        this.checkIfPlayerIsDone(player!);
        const isEndOfGame = this.isGameOver();
        const nextSeat = isEndOfGame? undefined : this.selectNextActivePlayer(currentSeat);

        if (isEndOfGame || this.checkIfTrickFinished()) {
            if (this.highest_trick_owner) {
                this.finishTrick(this.highest_trick_owner!, isEndOfGame);
            } else {
                TableModel.logger.info("Inconsistent state - all players passed on empty trick.");
            }
        }
        return nextSeat;
    }

    finishTrick(player: PlayerModel, isEndOfGame: boolean) {
        // TODO - ask for Drake assignment if highest
        const trick_winner_id = player.id;
        if (player && player.id != trick_winner_id) {
            TableModel.logger.info("Trick given from player %s to player %s", player.id, trick_winner_id);
        }
        TableModel.logger.info("Player %s takes the trick.", trick_winner_id);
        this.cards.forEach((card) => {
            if (card.get_owner() == CardState.ON_TABLE_PLAYED) {
                card.is_visible = isEndOfGame;
                card.setOwnerAsTable(CardState.OFF_TABLE);
                this.getPlayerById(trick_winner_id)?.addScore(card);
            }
        });

        if (!isEndOfGame) {
            if (player.personal_game_status != PlayerStatus.DONE) {
                player.setStatus(PlayerStatus.ACTIVE, Phase.GAME_STATE_5_PLAY);
            } else {
                TableModel.logger.info("Player %s is done!", player.id);
            }
            //TODO cards_to_animate = [_play for _trick in self._current_trick for _play in _trick[1]]
            // self._trick_to_animate = (cards_to_animate, trick_winner_id)
        }
        this.current_trick = [];
        this.highest_trick_owner = undefined;
        this.saveState();
    }

    selectNextActivePlayer(currentSeat: number) : number {
        this._seats.forEach((p) => p.setStatus(PlayerStatus.PASSIVE, Phase.GAME_STATE_5_PLAY));
        const nextSeat = (currentSeat + 1) % 4;
        if (!this._seats[nextSeat].isDone()) {
            this._seats[nextSeat].setStatus(PlayerStatus.ACTIVE, Phase.GAME_STATE_5_PLAY);
            return nextSeat;
        } else {
            return this.selectNextActivePlayer(nextSeat);
        }
    }

    getCurrentTrick(): CardModel[][] {
        return this.current_trick.map((trick) => {
            return trick.map((card) => {
                return this.findCard(card)!
            })
        })
    }

    private saveState() {
        // TODO - save game state to disc
    }

    private whoIsDone(): PlayerModel[] {
        return this._seats.filter(p => p.isDone()).sort((p1, p2) => {return p1.getRank() - p2.getRank()});
    }

    private isGameOver() : boolean {
        if (this.state != Phase.GAME_STATE_6_END) {
            const finishedPlayers = this.whoIsDone();
            if (finishedPlayers.length < 2) {
                return false;
            }
            if (finishedPlayers.length > 2 || finishedPlayers[0].team == finishedPlayers[1].team) {
                // game finished
                if (finishedPlayers[0].announced !== Announced.NOTHING) {
                    if (finishedPlayers[0].getRank() == 1) {
                        TableModel.logger.info("%s hat ihr/sein %s gewonnen!",
                            finishedPlayers[0].id, finishedPlayers[0].announced);
                    } else {
                        TableModel.logger.info("%s hat ihr/sein %s verloren!",
                            finishedPlayers[0].id, finishedPlayers[0].announced);
                    }
                }
                if (finishedPlayers[0].team == finishedPlayers[1].team) {
                    //  Doppelsieg !!!
                    TableModel.logger.info("Team %s (%s und %s) erreichten einen Doppelsieg!",
                        finishedPlayers[0].team, finishedPlayers[0].id, finishedPlayers[1].id)
                    this.state = Phase.GAME_STATE_6_END;
                } else if (finishedPlayers.length > 2) {
                    // normal win
                    if (finishedPlayers[0].team == finishedPlayers[2].team) {
                        TableModel.logger.info("Team %s (%s und %s) haben das Spiel zuerst beendet!",
                            finishedPlayers[0].team, finishedPlayers[0].id, finishedPlayers[2].id)
                    } else if (finishedPlayers[1].team == finishedPlayers[2].team) {
                        TableModel.logger.info("Team %s (%s und %s) haben das Spiel zuerst beendet!",
                            finishedPlayers[1].team, finishedPlayers[1].id, finishedPlayers[2].id)
                    }
                    this.state = Phase.GAME_STATE_6_END;
                }
            }
        }
        return this.state == Phase.GAME_STATE_6_END;
    }

    private checkIfPlayerIsDone(player: PlayerModel): boolean {
        if (player.isDone()) {
            let rank = 1
            this._seats.forEach(p => {
                if (p.isDone() && p.id != player.id) {
                    rank += 1;
                }
            });

            player.personal_game_status = PlayerStatus.DONE;
            TableModel.logger.info("Player %s finished with rank: %d", player.id, rank);
            player.setRank(rank);
            return true;
        } else {
            return false;
        }
    }
}