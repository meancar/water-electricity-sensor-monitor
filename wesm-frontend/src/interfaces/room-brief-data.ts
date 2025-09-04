export interface RoomBriefData {
    roomName?: string,
    elecPast?: number,
    elecCurrent?: number,
    waterPast?: number,
    waterCurrent?: number,
    elecDue?: number,
    waterDue?: number,
    totalDue?: number,
    paymentStatus: boolean
}
