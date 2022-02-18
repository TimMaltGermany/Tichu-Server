import TableModel from "../../models/TableModel";
import PlayerModel, {Phase, PlayerStatus} from "../../models/PlayerModel";

test('Table should be initially empty', () => {
    let tableModel = new TableModel();
    expect(tableModel.isFull()).toBe(false);
});

test('Adding players to table - two proper teams', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", -1);
    let p2t2 = new PlayerModel("id2", "name2", "team2", -1);
    let p4t2 = new PlayerModel("id4", "name4", "team2", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.seat).toBe(0);

    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p3t1.seat).toBe(2);

    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t2.seat).toBe(1);

    expect(tableModel.playerJoins(p4t2)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p4t2.seat).toBe(3);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.playerJoins(new PlayerModel("id12", "name1", "team1", -1))).toBe(false);
});

test('Adding players to table - two proper teams (different order)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", -1);
    let p2t2 = new PlayerModel("id2", "name2", "team2", -1);
    let p4t2 = new PlayerModel("id4", "name4", "team2", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.seat).toBe(0);

    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t2.seat).toBe(1);

    expect(tableModel.playerJoins(p4t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p4t2.seat).toBe(3);

    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p3t1.seat).toBe(2);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
});

test('Adding players to table - disconnect, reconnect)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", -1);
    let p2t2 = new PlayerModel("id2", "name2", "team2", -1);
    let p4t2 = new PlayerModel("id4", "name4", "team2", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.playerJoins(p4t2)).toBe(true);
    expect(tableModel.playerJoins(p3t1)).toBe(true);

    tableModel.disablePlayer(p1t1.id);
    let p1t1a = new PlayerModel("id1a", "name1", "team1", -1);
    expect(tableModel.playerJoins(p1t1a)).toBe(true);

    expect(tableModel.isFull()).toBe(true);
    expect(p1t1.seat).toBe(0);

});

test('Adding players to table - two proper teams (all want same team)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p2t1 = new PlayerModel("id2", "name2", "team1", -1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", -1);
    let p4t1 = new PlayerModel("id4", "name4", "team1", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.seat).toBe(0);
    expect(p1t1.team).toBe('team1');

    expect(tableModel.playerJoins(p2t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t1.seat).toBe(2);
    expect(p2t1.team).toBe('team1');

    expect(tableModel.playerJoins(p4t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p4t1.seat).toBe(1);
    expect(p4t1.team).toBe('TEAM_DUMMY');

    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p3t1.seat).toBe(3);
    expect(p3t1.team).toBe('TEAM_DUMMY');

    expect(tableModel.playerJoins(p1t1)).toBe(true);
});

test('Adding players to table - two proper teams (three want same team)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p2t2 = new PlayerModel("id2", "name2", "team2", -1);
    let p3t2 = new PlayerModel("id3", "name3", "team2", -1);
    let p4t2 = new PlayerModel("id4", "name4", "team2", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.seat).toBe(0);
    expect(p1t1.team).toBe('team1');

    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t2.seat).toBe(1);
    expect(p2t2.team).toBe('team2');

    expect(tableModel.playerJoins(p3t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p3t2.seat).toBe(3);
    expect(p3t2.team).toBe('team2');

    expect(tableModel.playerJoins(p4t2)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p4t2.seat).toBe(2);
    expect(p4t2.team).toBe('team1');

    expect(tableModel.playerJoins(p4t2)).toBe(true);
});

test('Adding players to table - two proper teams (three want same team 1)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p2t1 = new PlayerModel("id2", "name2", "team1", -1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", -1);
    let p4t2 = new PlayerModel("id4", "name4", "team2", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.seat).toBe(0);
    expect(p1t1.team).toBe('team1');

    expect(tableModel.playerJoins(p2t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t1.seat).toBe(2);
    expect(p2t1.team).toBe('team1');

    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p3t1.seat).toBe(1);
    expect(p3t1.team).toBe('TEAM_DUMMY');

    expect(tableModel.playerJoins(p4t2)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p4t2.seat).toBe(3);
    expect(p4t2.team).toBe('TEAM_DUMMY');

    expect(tableModel.playerJoins(p4t2)).toBe(true);
});

test('Adding players to table - two proper teams (three want same team 1a)', () => {
    let tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", -1);
    let p2t2 = new PlayerModel("id2", "name2", "team2", -1);
    let p3t1 = new PlayerModel("id3a", "name3", "team1", -1);
    let p4t1 = new PlayerModel("id4a", "name4", "team1", -1);

    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(p1t1.seat).toBe(0);
    expect(tableModel.isFull()).toBe(false);
    expect(p1t1.team).toBe('team1');

    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p2t2.seat).toBe(1);
    expect(p2t2.team).toBe('team2');

    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.isFull()).toBe(false);
    expect(p3t1.seat).toBe(2);
    expect(p3t1.team).toBe('team1');

    expect(tableModel.playerJoins(p4t1)).toBe(true);
    expect(tableModel.isFull()).toBe(true);
    expect(p4t1.seat).toBe(3);
    expect(p4t1.team).toBe('team2');

    expect(tableModel.playerJoins(p4t1)).toBe(true);
});

test('selectNextActivePlayer', () => {
    const tableModel = new TableModel();
    let p1t1 = new PlayerModel("id1", "name1", "team1", 0);
    let p2t2 = new PlayerModel("id2", "name2", "team2", 1);
    let p3t1 = new PlayerModel("id3", "name3", "team1", 2);
    let p4t2 = new PlayerModel("id4", "name4", "team2", 3);
    expect(tableModel.playerJoins(p1t1)).toBe(true);
    expect(tableModel.playerJoins(p2t2)).toBe(true);
    expect(tableModel.playerJoins(p3t1)).toBe(true);
    expect(tableModel.playerJoins(p4t2)).toBe(true);
    tableModel.dealNewGame();
    expect(tableModel.selectNextActivePlayer(0)).toBe(1);
    expect(tableModel.selectNextActivePlayer(1)).toBe(2);
    expect(tableModel.selectNextActivePlayer(2)).toBe(3);
    expect(tableModel.selectNextActivePlayer(3)).toBe(0);

    // player 4 is done
    p4t2.setCards([]);
    p4t2.setStatus(PlayerStatus.DONE, Phase.GAME_STATE_5_PLAY);
    expect(tableModel.selectNextActivePlayer(2)).toBe(0);

    // player 3 is done
    p3t1.setCards([]);
    p3t1.setStatus(PlayerStatus.DONE, Phase.GAME_STATE_5_PLAY);
    expect(tableModel.selectNextActivePlayer(0)).toBe(1);
    expect(tableModel.selectNextActivePlayer(1)).toBe(0);

});


test('deal new game', () => {
    const tableModel = new TableModel();
    expect(tableModel.getState()).toStrictEqual(Phase.GAME_STATE_NEW);
    const scores = new Map([["team1", 10], ["team2", 20]]);

    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 10], ["team2", 20]]));
    tableModel.dealNewGame();
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 10], ["team2", 20]]));
    expect(tableModel.getState()).toStrictEqual(Phase.GAME_STATE_2_GRAND_TICHU);
    // expect(tableModel.highest_trick_owner).toStrictEqual(undefined);
    // expect(tableModel.current_trick).toStrictEqual([]);
    // expect(tableModel.trick_to_animate).toStrictEqual(undefined);
});

test('game scores - new game', () => {
    const tableModel = new TableModel();
    expect(tableModel.get_total_score()).toStrictEqual(new Map());
});

test('game scores - some games', () => {
    const tableModel = new TableModel();
    const scores = new Map([["team1", 10], ["team2", 20]]);

    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 10], ["team2", 20]]));
    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 20], ["team2", 40]]));
    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 30], ["team2", 60]]));
    expect(tableModel.isGameSetOver(false)).toBe(false);

    scores.clear();
    scores.set("team2", 200);
    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 30], ["team2", 260]]));
    expect(tableModel.isGameSetOver(false)).toBe(false);

    scores.clear();
    scores.set("team1", 400);
    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 430], ["team2", 260]]));
    expect(tableModel.isGameSetOver(false)).toBe(false);

    scores.clear();
    scores.set("team1", 600);
    scores.set("team2", 10);
    tableModel.add_score(scores);
    expect(tableModel.get_total_score()).toStrictEqual(new Map([["team1", 1030], ["team2", 270]]));
    expect(tableModel.isGameSetOver(false)).toBe(true);

});
