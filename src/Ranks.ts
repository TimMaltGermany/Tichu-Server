export const NUMBER_PLAYERS = 4
export const NUMBER_CARDS = 56
export const NUMBER_CARDS_PER_PLAYER = 14

export enum CardColors {
    RED = 'red',
    GREEN = 'green',
    BLUE = 'blue',
    BLACK = 'black'
}

export const WINNING_SCORE : number = 1000;

// export let NormalCardRanks = [2,3,4,5,6,7,8,9,10,11,12,13,14];
// export let SpecialCardRanks = [0, 1, 15, 99];
// export let CardRanks = NormalCardRanks.concat(SpecialCardRanks);

export let NormalCardRanks = new Map([
    [2, "Two"],
    [3, "Three"],
    [4, "Four"],
    [5, "Five"],
    [6, "Six"],
    [7, "Seven"],
    [8, "Eight"],
    [9, "Nine"],
    [10, "Ten"],
    [11, "Jack"],
    [12, "Queen"],
    [13, "King"],
    [14, "Ace"]
]);

export let SpecialCardRanks = new Map([
    [0, "PHOENIX"],
    [1, "MAHJONG"],
    [15, "DRAKE"],
    [-99, "DOGS"]
]);

export let CardRanks = new Map([...Array.from(NormalCardRanks.entries()), ...Array.from(SpecialCardRanks.entries())]);
