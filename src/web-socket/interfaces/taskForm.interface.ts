import { ICase } from "../../interfaces/CaseMoongose.interface";

export interface ITaskform {
    taskType: string;
    CasesToSendWsp: ICase[];
    messageType: string;
    sendTo: string;
    timeToPay: string;
    phones?: any[];
    options: {
        quitas: [{ condicion: number, valorQuita: number, SiNoCumple: number }],
        cuotas: [{ condicion: number, cantidadDeCuotas: number }]
    };
    timeToResponse: string;
}