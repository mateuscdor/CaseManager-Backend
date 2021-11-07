export interface ITask {
    id: string;
    taskType: string;
    messageType: string;
    timeToPay: string;
    timeToResponse: string;
    amount: number;
    state: string;
    progress: number;
};