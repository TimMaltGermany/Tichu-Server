import {
    CardColors,
    NormalCardRanks,
    NUMBER_CARDS,
    SpecialCardRanks
} from "../Ranks";
import PlayerModel from "./PlayerModel";

const pino = require('pino');

export enum CardState {
    ON_HAND = 'on hand',
    ON_TABLE_TO_BE_PLAYED = 'on table to be played',
    ON_TABLE_PLAYED = 'on table played',
    OFF_TABLE = 'off table'
}

export function get_cards(): Map<string, CardModel> {
    const cards = new Map<string, CardModel>();

    SpecialCardRanks.forEach((rank_name,rank) => {
        cards.set(rank_name, new CardModel(rank_name, rank));
    });

    for (const color in CardColors) {
        NormalCardRanks.forEach( (rank_name, rank) =>  {
            const name = color + '_' + rank;
            cards.set(name, new CardModel(name, rank, color));
        });
    }
    return cards;
}


export default class CardModel {
    static logger = pino({ level: process.env.LOG_LEVEL || 'info' });

    readonly name : string;
    readonly color: string | undefined;
    readonly rank : number;
    private x : number = -10;
    private y : number = -10;
    private is_selected = false;
    private is_to_be_played = false;
    private _state = CardState.OFF_TABLE;
    private owner: string = CardState.OFF_TABLE;
    is_visible = false;

    constructor(name: string,
                card_rank: number,
                card_color?: string) {
        this.name = name;
        this.color = card_color;
        this.rank = card_rank;
    }

    reset() {
        this.x = -10;
        this.y = -10;
        this.is_selected = false;
        this.is_to_be_played = false;
        this._state = CardState.OFF_TABLE;
        this.owner =  CardState.OFF_TABLE;
        this.is_visible = false;
    }

    /*
    def init_from_dict(self, atts):
        this.x = atts['x']
    this.y = atts['y']
    this.valid_x = atts['valid_x']
    this.valid_y = atts['valid_y']
    this.is_selected = atts['is_selected']
    this.is_to_be_played = atts['is_to_be_played']
    this._state = atts['_state']
    this.set_owner(atts['_owner'])
    this.is_visible = atts['is_visible']

    def set_position(self, coordinates, is_valid):
        this.x = coordinates[0]
    this.y = coordinates[1]
    if is_valid:
        this.valid_x = coordinates[0]
    this.valid_y = coordinates[1]
*/

    /*
    def get_position(self):
    return this.x, this.y
*/
    setOwner(owner: PlayerModel) {
        if (owner.id != this.owner) {
            CardModel.logger.debug("Moving card %s from player %s to %s.", this.name, this.owner, owner.id);
            this.owner = owner.id;
        }
    }

    setOwnerAsTable(cardState: CardState) {
        this.owner = cardState;
    }

    get_owner()  : string | undefined {
        return this.owner;
    }


    set_state(state: CardState){
        this._state = state;
    }

    get_state() : CardState {
        return this._state;
    }

    /*
   def set_is_selected(self, is_selected):
       this.is_selected = is_selected
   if not is_selected:
       this.x = this.valid_x
   this.y = this.valid_y

   def set_play(self, is_to_be_played: bool):
       """called when user moves the card into staging area"""
   # if is_to_be_played:
   #    print(this.name + " is to be played: " + str(is_to_be_played))
   this.is_to_be_played = is_to_be_played
*/
}