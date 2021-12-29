import socketio, { Socket } from "socket.io";

import { WASocket , delay} from '@adiwajshing/baileys-md';

import { PaymentPlanModel } from '../MessageModels/paymentPlan.model';
import { definitionPayModel } from '../MessageModels/definitionPay.model';
import { PresentationModel } from '../MessageModels/presentation.model';

import ora from 'ora';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

import { ITask } from "web-socket/interfaces/task.interface";
import { ITaskform } from "web-socket/interfaces/taskForm.interface";
import { ICase } from "interfaces/CaseMoongose.interface";

/* whatsapp */
import { getUser } from '../services/whatsappConn.service';

type task = {
    socketID: string;
    userID: string;
    task: ITask
};


let tasks: task[] = [];
const spinner = ora();

export function TaskControllers(
    Socket: Socket,
    io: socketio.Server,
    userID: string,
    UserFullName: string) {
    /* Actualizando el socketID de las tareas de cada usuario */
    tasks = tasks.map(e => {
        if (e.userID === userID) {
            return {
                ...e,
                socketID: Socket.id
            };
        };
        return e
    });
    const WhatsappConnection = getUser(userID)!.wsp
    /* Nueva tarea recibida */
    Socket.on('create new task', async task => {
        if (task.taskType === 'Verificar numeros en Wsp') {
            const verified = await verifyWsp(task.phones, userID)
            io.to(Socket.id).emit('Phones Verified', verified);
        } else {
            const newTask = CreateNewTask(task, userID, UserFullName, Socket, io, WhatsappConnection!);
            tasks.push({
                socketID: Socket.id,
                userID,
                task: newTask!
            });
            io.to(Socket.id).emit('new task created', newTask);
        };
    });
    io.to(Socket.id).emit('tasks', tasks.filter(f => f.userID === userID).map(e => e.task));

    Socket.on('delete Task', taskID => {
        console.log(taskID);
        tasks = tasks.filter(e => e.task.id !== taskID);
        io.to(Socket.id).emit('tasks', tasks.filter(f => f.userID === userID).map(e => e.task));
    });
};

function CreateNewTask(TaskForm: ITaskform, UserID: string, UserFullName: string, Socket: Socket, io: socketio.Server, WhatsappConnection: WASocket) {
    if (TaskForm.taskType === 'Enviar Mensajes de Whatsapp') {
        const Cases: ICase[] = TaskForm.CasesToSendWsp;
        const amount = Cases.length;
        const task: ITask = {
            id: uuidv4(),
            UserFullName,
            taskType: TaskForm.taskType,
            amount,
            messageType: TaskForm.messageType,
            state: 'Incompleto',
            progress: 0,
            options: TaskForm.options,
            timeToPay: TaskForm.timeToPay,
            timeToResponse: TaskForm.timeToResponse,
            details: {
                DontHaveCellphone: [],
            }
        };

        SendMessages(Cases, task, UserID, Socket, io, WhatsappConnection);
        return task;
    };

};

async function SendMessages(cases: ICase[], form: ITask, UserID: string, Socket: Socket, io: socketio.Server, Whatsapp: WASocket) {
    const messagesSent: any[] = [];
    const messagesNotSent: any[] = [];
    const messages = ConvertToMessages(cases, form);
    const realWS = getUser(UserID)!.wsp!
    for await (const [index, Case] of messages.MESSAGES.entries()) {
        spinner.start();

        spinner.text = `Enviando un mensaje a: ${chalk.yellow(`${Case.titular} al ${Case.celular}, del tipo : ${Case.messageType}`)}`;
        spinner.color = 'yellow';
        await delay(2000)
        try {
            const sentMessage = await realWS.sendMessage(`549${Case.celular}@s.whatsapp.net`, {text: Case.message});
            // const sentMessage = await realWS.sendMessage(`5491150393620@s.whatsapp.net`, {text: Case.message});
            const messageSuccess = {
                Titular: Case.titular,
                ident_tipo: Case.ident_tipo,
                ident_nro: Case.ident_nro,
                messageType: Case.messageType,
                celular: Case.celular,
                status: 'mensaje enviado exitosamente'
            };

            spinner.succeed(`Mensaje enviado a ${chalk.green(`${Case.titular} al ${Case.celular}`)}`);

            messagesSent.push(messageSuccess);
        } catch (error) {
            console.log(error);
            const messageNotSent = {
                Titular: Case.titular,
                ident_tipo: Case.ident_tipo,
                ident_nro: Case.ident_nro,
                messageType: Case.messageType,
                celular: Case.celular,
                status: 'El mensaje no se pudo enviar'
            };

            spinner.warn(`No se envio mensaje a ${chalk.red(`${Case.titular} al ${Case.celular}`)}`);
            messagesNotSent.push(messageNotSent);
        };

        let taskProgress = (index / messages.MESSAGES.length) * 100;
        let taskIndex = tasks.findIndex(i => i.userID === UserID && i.task.id === form.id);
        tasks[taskIndex].task.progress = taskProgress;


        io.to(tasks[taskIndex].socketID).emit('current task progress',
            {
                id: form.id,
                taskProgress: tasks[taskIndex].task.progress.toLocaleString('es-ar', { maximumFractionDigits: 0 }),
                state: 'en curso',
                details: { DontHaveCellphone: messages.dontHaveCellphone }
            });
        tasks[taskIndex].task.state = 'en curso';

        if (index + 1 === messages.MESSAGES.length) {
            tasks[taskIndex].task.state = 'completado';
            tasks[taskIndex].task.progress = 100;
            tasks[taskIndex].task.details = {
                DontHaveCellphone: messages.dontHaveCellphone,
            };

            io.to(tasks[taskIndex].socketID).emit('current task progress', { id: form.id, taskProgress: 100, state: 'completado', details: { DontHaveCellphone: messages.dontHaveCellphone } });
            spinner.succeed('Todos los mensajes han sido enviados');
        };
    };
};

function ConvertToMessages(Cases: ICase[], form: ITask) {
    const MESSAGES: any[] = [];
    const dontHaveCellphone: ICase[] = [];

    const MESSAGETYPES: any = {
        'Carta de Presentacion': (Debtor: ICase) => new PresentationModel(Debtor, form.UserFullName),
        'Carta de Oferta': (Debtor: ICase) => new PaymentPlanModel(Debtor, form),
        'Carta de Definicion': (Debtor: ICase) => new definitionPayModel(Debtor, form)
    };

    Cases.forEach(Case => {
        Case.productos.forEach(producto => {
            if (producto.acuerdo === 'No') {
                const MESSAGE = MESSAGETYPES[form.messageType](Case);

                Case.celulares.forEach(cel => {
                    if (cel.tipo === 'M') {
                        if (form.messageType === 'Carta de Oferta') {
                            const messageToSend = {
                                titular: Case.titular,
                                ident_tipo: Case.ident_tipo,
                                ident_nro: Case.ident_nro,
                                messageType: form.messageType,
                                celular: cel.numero,
                                message: MESSAGE.getMessage(),
                                paymentPlans: [... new Set(MESSAGE.getPaymentPlans())]
                            };
                            if (!MESSAGES.find(f => f.celular === cel.numero)) {
                                MESSAGES.push(messageToSend);
                            };
                        } else {
                            const messageToSend = {
                                titular: Case.titular,
                                ident_tipo: Case.ident_tipo,
                                ident_nro: Case.ident_nro,
                                messageType: form.messageType,
                                celular: cel.numero,
                                message: MESSAGE.getMessage(),
                            };
                            if (!MESSAGES.find(f => f.celular === cel.numero)) {
                                MESSAGES.push(messageToSend);
                            };
                        }
                    } else {
                        if (!dontHaveCellphone.find(e => e.ident_nro === Case.ident_nro)) {
                            dontHaveCellphone.push(Case);
                        }
                    }
                });
            }
        })
    })

    return {
        MESSAGES,
        dontHaveCellphone,
    };
};

async function verifyWsp(cellphones: any[], userID: string) {
    const Whatsapp = getUser(userID)!.wsp!
    // console.log(Whatsapp.state)
    const cellphonesVerified: any[] = [];
    for await (const cellphone of cellphones) {
        try {
            const [cellphoneVerified] = await Whatsapp!.onWhatsApp(`549${cellphone.numero}@s.whatsapp.net`);

            if (cellphoneVerified && cellphoneVerified.exists) {
                const obj = { ...cellphone, tipo: 'M' }
                cellphonesVerified.push(obj);
                console.log(cellphone);
            } else {
                const obj = { ...cellphone, tipo: 'F' };
                cellphonesVerified.push(obj)
                console.log(cellphone);
            }
        } catch (error) {
            console.log('ocurrio un error', error);
        }
    };
    return cellphonesVerified
}