import socketio, { Socket } from "socket.io";

import { MessageType, WAConnection } from '@adiwajshing/baileys';

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
import { UsersWspStates } from '../controllers/whatsapp.controller';

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
    const WhatsappConnection = UsersWspStates.find(e => e.userID === userID)?.wsp
    /* Nueva tarea recibida */
    Socket.on('create new task', async task => {
        if (task.taskType === 'Verificar numeros en Wsp') {
            const verified = await verifyWsp(task.phones, userID)
            io.to(Socket.id).emit('Phones Verified', verified);
        } else {
            const newTask = await CreateNewTask(task, userID, UserFullName, Socket, io, WhatsappConnection!);
            tasks.push({
                socketID: Socket.id,
                userID,
                task: newTask!
            });
            io.to(Socket.id).emit('new task created', newTask);
        };
    });
    io.to(Socket.id).emit('tasks', tasks.filter(f => f.userID === userID).map(e => e.task));
};

async function CreateNewTask(TaskForm: ITaskform, UserID: string,UserFullName:string, Socket: Socket, io: socketio.Server, WhatsappConnection: WAConnection) {
    if (TaskForm.taskType === 'Enviar Mensajes de Whatsapp') {
        const Cases: ICase[] = TaskForm.CasesToSendWsp;
        const amount = Cases.length;
        const task: ITask = {
            id: uuidv4(),
            UserFullName,
            taskType: TaskForm.taskType,
            amount: amount,
            messageType: TaskForm.messageType,
            state: 'Incompleto',
            progress: 0,
            options : TaskForm.options,
            timeToPay: TaskForm.timeToPay,
            timeToResponse: TaskForm.timeToResponse
        };

        SendMessages(Cases, task, UserID, Socket, io, WhatsappConnection);
        return task;
    };

};

async function SendMessages(cases: ICase[], form: ITask, UserID: string, Socket: Socket, io: socketio.Server, Whatsapp: WAConnection) {
    const messagesSent: any[] = [];
    const messagesNotSent: any[] = [];
    const messages = ConvertToMessages(cases, form);

    for await (const [index, Case] of messages.entries()) {
        spinner.start();

        spinner.text = `Enviando un mensaje a: ${chalk.yellow(`${Case.titular} al ${Case.celular}, del tipo : ${Case.messageType}`)}`;
        spinner.color = 'yellow';
        try {
            const sentMessage = await Whatsapp.sendMessage(`549${Case.celular}@s.whatsapp.net`, Case.message, MessageType.text);
            // const sentMessage = await Whatsapp.sendMessage(`5491124222118@s.whatsapp.net`, Case.message, MessageType.text);
            // const testPromise = new Promise<any>((resolve) => {
            //     setTimeout(() => {
            //         return resolve('se termino')
            //     }, 500);
            // });
            // await testPromise;
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

        let taskProgress = (index / messages.length) * 100;
        let taskIndex = tasks.findIndex(i => i.userID === UserID && i.task.id === form.id);
        tasks[taskIndex].task.progress = taskProgress;

        io.to(tasks[taskIndex].socketID).emit('current task progress',
            { id: form.id, taskProgress: tasks[taskIndex].task.progress.toLocaleString('es-ar', { maximumFractionDigits: 0 }), state: 'en curso' });
        tasks[taskIndex].task.state = 'en curso';

        if (index + 1 === messages.length) {
            tasks[taskIndex].task.state = 'completado';
            tasks[taskIndex].task.progress = 100;
            io.to(tasks[taskIndex].socketID).emit('current task progress', { id: form.id, taskProgress: 100, state: 'completado' });
            spinner.succeed('Todos los mensajes han sido enviados');
        };
    };
};

function ConvertToMessages(Cases: ICase[], form: ITask) {
    const MESSAGES: any[] = [];

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
                    if(cel.tipo === 'M') {
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
                    }
                });
            }
        })
    })

    return MESSAGES
};

async function verifyWsp(cellphones: any[], userID: string) {
    const Whatsapp = UsersWspStates.find(e => e.userID === userID)!.wsp
    console.log(Whatsapp.state)
    const cellphonesVerified: any[] = [];
    for await (const cellphone of cellphones) {
        try {
            const cellphoneVerified = await Whatsapp.isOnWhatsApp(`549${cellphone.numero}@s.whatsapp.net`);
            if (cellphoneVerified) {
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