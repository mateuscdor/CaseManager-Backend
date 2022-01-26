import socketio, { Socket } from "socket.io";

import ora from 'ora';
import chalk from 'chalk';

import { ITask } from "web-socket/interfaces/task.interface";


import { updateTaskUserSocketID } from "../services/Task-Services/taskUsers.service";
import { addTaskToUser, addTaskUser, deleteTask, sendTasksToUser } from "../services/Task-Services/tasks.service";
const spinner = ora();

export function TaskControllers(
    Socket: Socket,
    io: socketio.Server,
    userID: string,
    UserFullName: string) {
    addTaskUser(userID,Socket.id)
    /* Actualizando el socketID de las tareas de cada usuario */
    updateTaskUserSocketID(userID,Socket.id);
    
    /* Nueva tarea recibida */
    Socket.on('create new task', async task => {
        addTaskToUser(task,userID,UserFullName,io);
        // if (task.taskType === 'Verificar numeros en Wsp') {
        //     const verified = await verifyWsp(task.phones, userID)
        //     io.to(Socket.id).emit('Phones Verified', verified);
        // } else {
        //     const newTask = CreateNewTask(task, userID, UserFullName, Socket, io, WhatsappConnection!);
        //     tasks.push({
        //         socketID: Socket.id,
        //         userID,
        //         task: newTask!
        //     });
        //     io.to(Socket.id).emit('new task created', newTask);
        // };
    });
    // io.to(Socket.id).emit('tasks', tasks.filter(f => f.userID === userID).map(e => e.task));
    sendTasksToUser(userID,io);

    Socket.on('delete Task', taskID => {
       deleteTask(userID,taskID,io)
    });
};
