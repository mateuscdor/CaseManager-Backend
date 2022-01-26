import socketio, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { getUser } from '../whatsappConn.service';

import { ITask } from '../../interfaces/task.interface';
import { ITaskform } from '../../interfaces/taskForm.interface';
import { ICase } from '../../../interfaces/CaseMoongose.interface';

import { definitionPayModel } from '../../MessageModels/definitionPay.model';
import { PaymentPlanModel } from '../../MessageModels/paymentPlan.model';
import { PresentationModel } from '../../MessageModels/presentation.model';
import { delay } from '@adiwajshing/baileys-md';
import {
	addTask,
	AddUserForTasks,
	deleteTaskToUser,
	getTaskUser,
	informTaskComplete,
	SendTasks,
	updateDetails,
	updateTaskProgress
} from './taskUsers.service';


const taskTypes: any = {
	'Verificar numeros en Wsp': async (
		userID: string,
		socketID: string,
		io: socketio.Server,
		cellphones: any
	) => {
		const cellphonesVerified = await verifyWsp(cellphones, userID);
		io.to(socketID).emit('Phones Verified', cellphonesVerified);
	},
	'Enviar Mensajes de Whatsapp': (
		Cases: any[],
		Task: ITask,
		UserID: string,
		io: socketio.Server
	) => {
		sendMessagesToAll(Cases, Task, UserID, io);
	}
};

export const sendTasksToUser = (userID: string, io: socketio.Server) => {
	SendTasks(userID,io);
}

export const addTaskToUser = async (
	TaskForm: ITaskform,
	UserID: string,
	UserFullName: string,
	io: socketio.Server
) => {
	const user = getTaskUser(UserID)!;

	if (TaskForm.taskType === 'Verificar numeros en Wsp') {
		await taskTypes[TaskForm.taskType](UserID, user.socketID, io, TaskForm.phones!);
		return;
	}

	const Cases: ICase[] = TaskForm.CasesToSendWsp;
	const amount = Cases.length;
	const task: ITask = {
		id: uuidv4(),
		UserFullName,
		taskType: TaskForm.taskType,
		amount,
		messageType: TaskForm.messageType,
		state: 'en curso',
		progress: 0,
		options: TaskForm.options,
		timeToPay: TaskForm.timeToPay,
		timeToResponse: TaskForm.timeToResponse,
		details: {
			DontHaveCellphone: []
		}
	};
	addTask(UserID, task);
	// updateTaskState(UserID, task.id, 'En curso', io);
	io.to(user.socketID).emit('new task created', task);
	taskTypes[task.taskType](Cases, task, UserID, io);
};

export const addTaskUser = (userID:string, socketID: string) => {
	AddUserForTasks({userID,socketID, tasks: []})
}

export const deleteTask = (userID: string, taskID: string, io: socketio.Server) => {
	deleteTaskToUser(userID,taskID,io)
}

const updateUserTaskProgress = (
	userID: string,
	taskID: string,
	progress: number,
	io: socketio.Server
) => {
	updateTaskProgress(userID, taskID, progress, io);
};

const updateTaskState = (
	userID: string,
	taskID: string,
	state: string,
	io: socketio.Server
) => {
	try {
		updateTaskState(userID, taskID, state, io);
	} catch (error) {
		console.log(error);
	}
};
const updateTaskDetails = (
	userID: string,
	taskID: string,
	details: { DonHaveCellphone: any[]},
	io: socketio.Server
) => {
	updateDetails(
		userID,
		taskID,
		details,
		io
	);
};



const verifyWsp = async (cellphones: any[], userID: string) => {
	const { wsp } = getUser(userID)!;
	const cellphonesVerified: any[] = [];

	for await (const cellphone of cellphones) {
		try {
			const [cellphoneVerified] = await wsp!.onWhatsApp(
				`549${cellphone.numero}@s.whatsapp.net`
			);

			if (cellphoneVerified && cellphoneVerified.exists) {
				const obj = { ...cellphone, tipo: 'M' };
				cellphonesVerified.push(obj);
				console.log(cellphone);
			} else {
				const obj = { ...cellphone, tipo: 'F' };
				cellphonesVerified.push(obj);
				console.log(cellphone);
			}
		} catch (error) {
			console.log('ocurrio un error', error);
		}
	}
	return cellphonesVerified;
};

const sendMessagesToAll = async (
	Cases: any[],
	Task: ITask,
	UserID: string,
	io: socketio.Server
) => {
	const { wsp } = getUser(UserID)!;

	const messagesSent: any[] = [];
	const messagesNotSent: any[] = [];
	const messages = ConvertToMessages(Cases, Task);
	for await (const [index, Case] of messages.MESSAGES.entries()) {
		
		// spinner.start();

		// spinner.text = `Enviando un mensaje a: ${chalk.yellow(`${Case.titular} al ${Case.celular}, del tipo : ${Case.messageType}`)}`;
		// spinner.color = 'yellow';
		await delay(1000);
		
		try {
			const sentMessage = await wsp!.sendMessage(`549${Case.celular}@s.whatsapp.net`, {text: Case.message});
			// const sentMessage = await wsp!.sendMessage(`5491124222118@s.whatsapp.net`, {
			// 	text: Case.message
			// });
			// await delay(1000)
			const messageSuccess = {
				Titular: Case.titular,
				ident_tipo: Case.ident_tipo,
				ident_nro: Case.ident_nro,
				messageType: Case.messageType,
				celular: Case.celular,
				status: 'mensaje enviado exitosamente'
			};

			// spinner.succeed(`Mensaje enviado a ${chalk.green(`${Case.titular} al ${Case.celular}`)}`);

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

			// spinner.warn(`No se envio mensaje a ${chalk.red(`${Case.titular} al ${Case.celular}`)}`);
			messagesNotSent.push(messageNotSent);
		}
		

		let taskProgress = (index / messages.MESSAGES.length) * 100;
		updateUserTaskProgress(UserID, Task.id, taskProgress, io);

		// let taskIndex = tasks.findIndex(i => i.userID === UserID && i.task.id === form.id);
		// tasks[taskIndex].task.progress = taskProgress;

		// io.to(tasks[taskIndex].socketID).emit('current task progress',
		//     {
		//         id: form.id,
		//         taskProgress: tasks[taskIndex].task.progress.toLocaleString('es-ar', { maximumFractionDigits: 0 }),
		//         state: 'en curso',
		//         details: { DontHaveCellphone: messages.dontHaveCellphone }
		//     });
		// tasks[taskIndex].task.state = 'en curso';

		if (index + 1 === messages.MESSAGES.length) {
			informTaskComplete(UserID, io, Task.id, 'Completado', 100, {})
			// tasks[taskIndex].task.state = 'completado';
			// updateUserTaskProgress(UserID, Task.id, 100, io);
			// await delay(500)
			// updateTaskState(UserID, Task.id, 'completado', io);
			// tasks[taskIndex].task.progress = 100;
			// await delay(500)
			// tasks[taskIndex].task.details = {
			//     DontHaveCellphone: messages.dontHaveCellphone,
			// };
			// updateTaskDetails(UserID, Task.id, {DonHaveCellphone: messages.dontHaveCellphone}, io);

			// io.to(tasks[taskIndex].socketID).emit('current task progress', { id: form.id, taskProgress: 100, state: 'completado', details: { DontHaveCellphone: messages.dontHaveCellphone } });
			// spinner.succeed('Todos los mensajes han sido enviados');
		}
	}
};

function ConvertToMessages(Cases: ICase[], form: ITask) {
	const MESSAGES: any[] = [];
	const dontHaveCellphone: ICase[] = [];

	const MESSAGETYPES: any = {
		'Carta de Presentacion': (Debtor: ICase) =>
			new PresentationModel(Debtor, form.UserFullName),
		'Carta de Oferta': (Debtor: ICase) => new PaymentPlanModel(Debtor, form),
		'Carta de Definicion': (Debtor: ICase) => new definitionPayModel(Debtor, form)
	};

	Cases.forEach((Case) => {
		Case.productos.forEach((producto) => {
			if (producto.acuerdo === 'No') {
				const MESSAGE = MESSAGETYPES[form.messageType](Case);

				Case.celulares.forEach((cel) => {
					if (cel.tipo === 'M') {
						if (form.messageType === 'Carta de Oferta') {
							const messageToSend = {
								titular: Case.titular,
								ident_tipo: Case.ident_tipo,
								ident_nro: Case.ident_nro,
								messageType: form.messageType,
								celular: cel.numero,
								message: MESSAGE.getMessage(),
								paymentPlans: [...new Set(MESSAGE.getPaymentPlans())]
							};
							if (!MESSAGES.find((f) => f.celular === cel.numero)) {
								MESSAGES.push(messageToSend);
							}
						} else {
							const messageToSend = {
								titular: Case.titular,
								ident_tipo: Case.ident_tipo,
								ident_nro: Case.ident_nro,
								messageType: form.messageType,
								celular: cel.numero,
								message: MESSAGE.getMessage()
							};
							if (!MESSAGES.find((f) => f.celular === cel.numero)) {
								MESSAGES.push(messageToSend);
							}
						}
					} else {
						if (!dontHaveCellphone.find((e) => e.ident_nro === Case.ident_nro)) {
							dontHaveCellphone.push(Case);
						}
					}
				});
			}
		});
	});

	return {
		MESSAGES,
		dontHaveCellphone
	};
}
