import socketio, { Socket } from 'socket.io';

import fs from 'fs';
import path from 'path';

import ora from 'ora';
import chalk from 'chalk';

import { Boom } from '@hapi/boom';
import makeWASocket, {
	DisconnectReason,
	useSingleFileAuthState,
	WASocket,
	WAConnectionState
} from '@adiwajshing/baileys-md';

import { GetUserChatsHistory } from '../services/userChatHistory.service';
import { onChatEvents } from './chatEvents.service';
import { onContactEvents } from './contactEvents.service';
import { onMessagesEvents } from './messageEvents.service';
import { onConnectionChanges } from './connectionEvents.service';

export interface UserWspStatus {
	userID: string;
	socketID: string;
	state: WAConnectionState;
	wsp: WASocket | null;
}

let UsersWspStates: UserWspStatus[] = [];

export const addUser = (user: UserWspStatus) => {
	!UsersWspStates.some((wsp) => wsp.userID === user.userID) && UsersWspStates.push(user);
};

export const getUser = (UserID: string) => {
	const user = UsersWspStates.find((user) => user.userID === UserID);
	return user;
};

export const updateUserWsp = (userID: string, Wsp: WASocket) => {
	const user = UsersWspStates.findIndex(usr => usr.userID === userID);
	UsersWspStates[user].wsp = Wsp;
}

export const updateUserSocketID = (userID: string, socketID: string) => {
	UsersWspStates = UsersWspStates.map((usr) => {
		if (usr.userID === userID) {
			return {
				...usr,
				socketID
			};
		}
		return usr;
	});
};

export const updateUserWspState = (userID: string, state: WAConnectionState) => {
	const userIDX = UsersWspStates.findIndex((user) => user.userID === userID);
	UsersWspStates[userIDX].state = state;
};

export const SendChatsAndContacts = (
	userID: string,
	socketID: string,
	io: socketio.Server
) => {
	let chats: any[];
	let contacts;
	try {
		const db = GetUserChatsHistory(userID);
		chats = db.chats;
		contacts = db.contacts;
	} catch (error) {
		chats = [];
		contacts = [];
	}
	io.to(socketID).emit('[GET] Chats', chats);
	io.to(socketID).emit('[GET] Contacts', contacts);
};

export const emitEvToClient = (
	io: socketio.Server,
	socketID: string,
	ev: string,
	data: any
) => {
	io.to(socketID).emit(ev, data);
};

export const fileAuthState = (userID: string) => {
	const filePath = `${path.join(__dirname, '../controllers/auth', `${userID}.json`)}`;
	const { state, saveState } = useSingleFileAuthState(filePath);
	return { state, saveState };
};

export const initializeWsp = (userID: string, io: socketio.Server) => {
	const user = getUser(userID);
	const spinner = ora();
	// try {
	// 	fs.mkdirSync(`${path.join(__dirname, '../controllers/auth')}`);
	// 	fs.mkdirSync(`${path.join(__dirname, '../controllers/chats')}`);
	// } catch (error) {
	// 	console.log('La carpeta ya existe');
	// }

	// spinner.info(`${chalk.blueBright('Iniciando conexion con wsp')}`);

	/* CONNECTION CHANGES */
	onConnectionChanges(userID, io)
	/* CHAT CHANGES */
	onChatEvents(userID, io);
	/* CONTACT CHANGES */
	onContactEvents(userID, io);
	/* MESSAGES CHANGES */
	onMessagesEvents(userID, io);
};
