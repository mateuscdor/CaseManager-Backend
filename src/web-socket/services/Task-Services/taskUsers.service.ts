import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
import socketio from 'socket.io';

import { ITask } from '../../interfaces/task.interface';

export interface IUserTask {
	socketID: string;
	userID: string;
	tasks: ITask[];
}

// let users: IUserTask[] = [];

const saveTaskFile = (changes: any[]) => {
    const filePath = `${path.join(__dirname, '/db/taskUsers.json')}`;
	writeFileSync(filePath, JSON.stringify(changes));
};

const getTaskUsers = () => {
	const filePath = `${path.join(__dirname, '/db/taskUsers.json')}`;
	const buffer = readFileSync(filePath, 'utf-8');
	const TaskUsers = JSON.parse(buffer) as IUserTask[];
	// const TaskUsers = users;
	return TaskUsers;
};

export const getTaskUser = (userID: string) => {
	const users = getTaskUsers();
	const user = users.find((usr) => usr.userID === userID);
	return user;
};

export const AddUserForTasks = (user: IUserTask) => {
	const users = getTaskUsers();
	!users.some((usr) => usr.userID === user.userID) && users.push(user);
	saveTaskFile(users);
};

export const SendTasks = (userID: string, io: socketio.Server) => {
	const user = getTaskUser(userID);
	io.to(user!.socketID).emit('tasks', user!.tasks);
};

export const updateTaskUserSocketID = (userID: string, newSocketID: string) => {
	let users = getTaskUsers();
	users = users.map((u) => {
		if (u.userID === userID) {
			return {
				...u,
				socketID: newSocketID
			};
		}

		return u;
	});
	saveTaskFile(users);
};

export const addTask = (userID: string, task: ITask) => {
	let users = getTaskUsers();
	// const idx = users.findIndex((u) => u.userID === userID);
	// users[idx].tasks.push(task);
	users = users.map((u) => {
		if (u.userID === userID) {
			u.tasks.push(task);
			return u;
		}
		return u;
	});
	saveTaskFile(users);
};

export const deleteTaskToUser = (userID: string, taskID: string, io: socketio.Server) => {
	let users = getTaskUsers();
	// const idx = users.findIndex((u) => u.userID === userID);
	// users[idx].tasks.filter((t) => t.id !== taskID);
	users = users.map(u => {
	    if (u.userID === userID) {
	        return {
	            ...u,
	            tasks: u.tasks.filter(t => t.id !== taskID)
	        }
	    };
	    return u;
	});
	SendTasks(userID, io);
	saveTaskFile(users);
};

export const updateTaskProgress = (
	userID: string,
	taskID: string,
	progress: number,
	io: socketio.Server
) => {
	let users = getTaskUsers();
	const idx = users.findIndex((u) => u.userID === userID);
	const taskIDX = users[idx].tasks.findIndex((t) => t.id === taskID);
	const user = getTaskUser(userID);

	users[idx].tasks[taskIDX].progress = progress;

	saveTaskFile(users);
	io.to(user!.socketID).emit('[TASKS] Progress', {
		taskID,
		taskProgress: progress.toLocaleString('es-ar', { maximumFractionDigits: 0 })
	});
};

export const updateTaskState = (
	userID: string,
	taskID: string,
	newTaskState: string,
	io: socketio.Server
) => {
	let users = getTaskUsers();
	const idx = users.findIndex((u) => u.userID === userID);
	const taskIDX = users[idx].tasks.findIndex((t) => t.id === taskID);
	const user = getTaskUser(userID);

	users[idx].tasks[taskIDX].state = newTaskState;

	// users = users.map((u) => {
	// 	if (u.userID === userID) {
	// 		u.tasks = u.tasks.map((t) => {
	// 			if (t.id === taskID) {
	// 				return {
	// 					...t,
	// 					state: newTaskState
	// 				};
	// 			}
	// 			return t;
	// 		});
	// 	}
	// 	return u;
	// });
	saveTaskFile(users);
	io.to(user!.socketID).emit('[TASKS] State', {
		taskID,
		state: newTaskState
	});
};

export const updateDetails = (
	userID: string,
	taskID: string,
	taskDetails: any,
	io: socketio.Server
) => {
	let users = getTaskUsers();
	const idx = users.findIndex((u) => u.userID === userID);
	const taskIDX = users[idx].tasks.findIndex((t) => t.id === taskID);
	// const user = getTaskUser(userID);

	users[idx].tasks[taskIDX].details = taskDetails;

	// users = users.map((u) => {
	// 	if (u.userID === userID) {
	// 		u.tasks = u.tasks.map((t) => {
	// 			if (t.id === taskID) {
	// 				return {
	// 					...t,
	// 					details: taskDetails
	// 				};
	// 			}
	// 			return t;
	// 		});
	// 	}
	// 	return u;
	// });
};

export const informTaskComplete = (
	userID: string,
	io: socketio.Server,
	taskID: string,
	state: string,
	progress: number,
	details: any
) => {
	updateTaskProgress(userID, taskID, progress, io);
	updateTaskState(userID, taskID, state, io);
	updateDetails(userID, taskID, details, io);
};
