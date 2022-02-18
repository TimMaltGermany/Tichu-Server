import {handle_player_schupfed} from "../session";



test('handle_schupfen with proper data', () => {
    const message = "{\"data\":{\"cards\":[{\"seat\":3,\"card\":\"RED_3\"},{\"seat\":1,\"card\":\"BLACK_3\"},{\"seat\":2,\"card\":\"DOGS\"}]}}";
    const messageObj = JSON.parse(message as string);
    const data = messageObj['data'];


    handle_player_schupfed("userId", data['cards']);

});

