export interface ITask {
    id: string;
    UserFullName: string;
    taskType: string;
    messageType: string;
    timeToPay: string;
    timeToResponse: string;
    options: {
        quitas: [{ condicion: number, valorQuita: number, SiNoCumple: number }],
        cuotas: [{ condicion: number, cantidadDeCuotas: number }]
    };
    amount: number;
    state: string;
    progress: number;
};