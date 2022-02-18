import PlayerModel from "../../models/PlayerModel";
import CardModel, {get_cards} from "../../models/CardModel";
import {CardColors, NormalCardRanks, NUMBER_CARDS} from "../../Ranks";

test('constructor settings', () => {
    let cardModel = new CardModel("card1", 12, "red");
    expect(cardModel.name).toBe('card1');
    expect(cardModel.rank).toBe(12);
    expect(cardModel.color).toBe("red");
});

test('create all 54 cards', () => {
    let cardModel = get_cards();

    expect(cardModel.size).toBe(NUMBER_CARDS);
    cardModel.forEach((card, name) =>
        expect(cardModel.get(name)!.name).toBe(name));
    let ranksForColors = new Map<string, Set<number>>();
    for (const cardColor in CardColors) {
        ranksForColors.set(cardColor, new Set<number>());
    }
    // each rank must be seen for each color
    let phoenixFound = false;
    let mahjongFound = false;
    let drakeFound = false;
    let dogsFound = false;
    cardModel.forEach((card, _) => {
        if (card.color != undefined) {
            ranksForColors.get(card.color!)!.add(card.rank);
        } else if (card.rank == 0) {
            phoenixFound = true;
        }else if (card.rank == 1) {
            mahjongFound = true;
        }else if (card.rank == 15) {
            drakeFound = true;
        }else if (card.rank == 99) {
            dogsFound = true;
        }
    });
    ranksForColors.forEach((ranks, _) => {
            expect(ranks.size).toBe(NormalCardRanks.size);
            NormalCardRanks.forEach((_, rank) => {
                expect(ranks.has(rank)).toBe(true);
            });
        });

    expect(phoenixFound).toBe(true);
    expect(mahjongFound).toBe(true);
    expect(drakeFound).toBe(true);
    expect(dogsFound).toBe(true);

});


test('converting to json and back should return equal object', () => {
    let playerModel = new PlayerModel("id3", "name3", "team1", -1);

    expect(PlayerModel.fromJson("id3", playerModel)).toStrictEqual(playerModel);
});
