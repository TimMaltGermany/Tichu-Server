import CardModel from "./CardModel";
import {Announced} from "../enums/Announced";

export enum PlayerStatus {
    PASSIVE = "PASSIVE",
    DONE = "DONE",
    ACTIVE = "ACTIVE",
}

export enum Phase {
    GAME_STATE_NEW = 'new',
    GAME_STATE_2_GRAND_TICHU = 'grosses_tichu',
    GAME_STATE_3_SCHUPFEN = 'schupfen',
    GAME_STATE_5_PLAY = 'spiel',
    GAME_STATE_6_END = 'ende'
}

export default class PlayerModel {
    id: string;
    readonly name: string;
    team: string;
    seat: number;
    connected: boolean = false;
    announced: Announced = Announced.NOTHING;
    private tricks: any[] = [];
    phase: Phase = Phase.GAME_STATE_NEW;
    personal_game_status: PlayerStatus = PlayerStatus.PASSIVE;
    has_passed: boolean = false;
    // first player to finish his hand has rank 1, ...
    private rank: number = -99;
    cards: CardModel[] = [];
    
    constructor(player_id: string, name: string, team_name: string, seat_no: number) {
        this.id = player_id;
        // _sid = None
        this.name = name;
        this.team = team_name;
        this.seat = seat_no;
    }

    reset() {
        this.announced = Announced.NOTHING;
        this.tricks = [];
        this.phase =  Phase.GAME_STATE_NEW;
        this.personal_game_status = PlayerStatus.PASSIVE;
        this.has_passed = false;
        this.rank = -99;
        this.cards = [];
    }

    static fromJson(id: string, player: IPlayerDict) : PlayerModel {
        // @ts-ignore
        return new PlayerModel(id, player['name'] as string, player['team'], player['seat']);
    }

    public equals(other: PlayerModel) : boolean {
        if (this.id != other.id) {
            return false;
        }
        if (this.name != other.name) {
            return false;
        }
        if (this.team != other.team) {
            return false;
        }
        if (this.seat != other.seat) {
            return false;
        }
        if (this.connected != other.connected) {
            return false;
        }
        if (this.announced != other.announced) {
            return false;
        }
        if (this.tricks != other.tricks) {
            return false;
        }
        if (this.phase != other.phase) {
            return false;
        }
        if (this.personal_game_status != other.personal_game_status) {
            return false;
        }
        if (this.has_passed != other.has_passed) {
            return false;
        }
        if (this.rank != other.rank) {
            return false;
        }
        return this.cards == other.cards;

    }

    setStatus(status: PlayerStatus, game_phase: Phase) {
        if (this.personal_game_status != PlayerStatus.DONE) {
            // can't move back from done to any other state
            this.personal_game_status = status;
        }
        this.phase = game_phase;
    }

    setCards(cards: CardModel[]) {
        this.cards = [];
        cards.forEach(c => this.cards.push(c));
    }

    addCard(card: CardModel) {
        this.cards.push(card);
    }

    removeCard(card: CardModel) {
        this.cards = this.cards.filter((c) => c.name != card.name);
    }

    showAllCards() {
        this.cards.forEach(c => c.is_visible = true);
    }

    resetHasPassed() {
        this.has_passed = this.personal_game_status == PlayerStatus.DONE;
    }

    addScore(card: CardModel) {
        // TODO
    }

    isDone() : boolean {
      return this.phase != Phase.GAME_STATE_NEW && this.cards.length == 0;
    }

    setRank(rank: number) {
        if (this.rank < 0) {
           this.rank = rank;
        }
    }

    getRank(): number {
        return this.rank;
    }
}

export interface IPlayerDict {
    name: string,
    team: string,
    seat: number,
}
