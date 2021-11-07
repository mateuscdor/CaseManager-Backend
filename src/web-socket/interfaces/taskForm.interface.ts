import { ICase } from "../../interfaces/CaseMoongose.interface";

export interface ITaskform {
    taskType: string;
    CasesToSendWsp: ICase[];
    messageType: string;
    sendTo: string;
    timeToPay: string;
    timeToResponse: string;
}