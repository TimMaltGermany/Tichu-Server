export enum Announced {
    NOTHING = "nothing",
    TICHU = "Tichu",
    GRAND_TICHU = "Grand Tichu"
}

export function fromAnnouncementString(announcement: string) : Announced {
    if (announcement == "Announced.GRAND_TICHU") {
        return Announced.GRAND_TICHU;
    } else if (announcement == "Announced.TICHU") {
        return Announced.TICHU;
    } else {
       return  Announced.NOTHING;
    }
}