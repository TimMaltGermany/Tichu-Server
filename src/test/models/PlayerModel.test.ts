import PlayerModel from "../../models/PlayerModel";
import {Announced} from "../../enums/Announced";

test('constructor settings', () => {
    let playerModel = new PlayerModel("id1", "n1", "t1", 99);
    expect(playerModel.id).toBe('id1');
    expect(playerModel.name).toBe('n1');
    expect(playerModel.team).toBe('t1');
    expect(playerModel.seat).toBe(99);
});


test('equals / reset', () => {
    let playerModel1 = new PlayerModel("id1", "n1", "t1", 99);
    let playerModel2 = new PlayerModel("id1", "n1", "t1", 99);
    expect(playerModel1).toStrictEqual(playerModel2);
    playerModel2.reset();
    expect(playerModel1).toStrictEqual(playerModel2);
});

test('reset', () => {
    let playerModel = new PlayerModel("id1", "n1", "t1", 99);
    playerModel.announced = Announced.TICHU;
    playerModel.reset();
    expect(playerModel.announced).toBe(Announced.NOTHING);
});


test('converting to json and back should return equal object', () => {
    let playerModel = new PlayerModel("id3", "name3", "team1", -1);

    expect(PlayerModel.fromJson("id3", playerModel)).toStrictEqual(playerModel);
});
