import socketio, { Socket } from 'socket.io';
import makeWASocket, {
	DisconnectReason,
	useSingleFileAuthState,
	WASocket,
	WAConnectionState,
	proto
} from '@adiwajshing/baileys-md';
import fs from 'fs';
import path from 'path';

import ora from 'ora';
import chalk from 'chalk';
import { Boom } from '@hapi/boom';
import { GetUserChatsHistory } from '../services/userChatHistory.service';
import { setChat, updateChat } from '../services/chat.service';
import { upsertContacts } from '../services/conctact.service';
import { upsertMessages } from '../services/messages.service';

interface UserWspStatus {
	userID: string;
	socketID: string;
	state: WAConnectionState;
	wsp: WASocket | null;
}

export let UsersWspStates: UserWspStatus[] = [];

const findUser = (UserID: string) => {
	const user = UsersWspStates.find((user) => user.userID === UserID);
	const index = UsersWspStates.findIndex((user) => user.userID === UserID);
	return {
		user,
		index
	};
};

export function WhatsappControllers(socket: Socket, io: socketio.Server, userID: string) {
	const SocketIO = socket;
	const spinner = ora();

	const WspUser: UserWspStatus = {
		userID,
		socketID: socket.id,
		wsp: null,
		state: 'close'
	};

	!UsersWspStates.some((wsp) => wsp.userID === userID) && UsersWspStates.push(WspUser);
	/* cambiando el id del socket a medida que el usuario se reconecte */
	UsersWspStates = UsersWspStates.map((f) => {
		if (f.userID === userID) {
			return {
				...f,
				socketID: socket.id
			};
		}
		return f;
	});
	const { state, saveState } = useSingleFileAuthState(
		`${path.join(__dirname, 'auth', `${userID}.json`)}`
	);
	const user = findUser(userID);

	const connectWSP = () => {
		try {
			fs.mkdirSync(`${path.join(__dirname, 'auth')}`);
			fs.mkdirSync(`${path.join(__dirname, 'chats')}`);
		} catch (error) {
			console.log('La carpeta ya existe');
		}

		spinner.info(`${chalk.blueBright('Iniciando conexion con wsp')}`);

		UsersWspStates[user.index].wsp = makeWASocket({
			printQRInTerminal: false,
			auth: state,
			browser: ['Gestor de mensajeria', 'Gestor de mensajeria', 'Gestor de mensajeria']
		});
		UsersWspStates[user.index].wsp!.ev.on('connection.update', (ConnState) => {
			const { connection, lastDisconnect, qr } = ConnState;
			if (qr != null) {
				io.to(user.user!.socketID).emit('wsp qr code', qr);
			}
			spinner.info(
				`${chalk.redBright('ESTADO DE LA CONEXION: ')} ${chalk.greenBright(
					connection
				)}`
			);
			if (connection != null) {
				io.to(user.user!.socketID).emit('wspConnectionState', connection);
				UsersWspStates[user.index].state = connection;
			}

			if (connection === 'close') {
				// reconnect if not logged out
				if (
					(lastDisconnect!.error as Boom)?.output?.statusCode !==
					DisconnectReason.loggedOut
				) {
					connectWSP();
					spinner.succeed(
						`${chalk.redBright('ESTADO DE LA CONEXION: ')} ${chalk.greenBright(
							connection
						)}`
					);
				} else {
					console.log('Conexion Cerrada');
				}
			}
		});
		UsersWspStates[user.index].wsp!.ev.on('creds.update', saveState);
		/* TODO: CHAT CHANGES */
		/* CHAT UPDATE */
		UsersWspStates[user.index].wsp!.ev.on('chats.update', (chatUpdate) => {
			console.log(chalk.greenBright('[CHAT.UPDATE] '));
			io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
				from: 'CHAT-UPDATE',
				data: chatUpdate
			});
			updateChat(chatUpdate, userID);
		});
		/* CHAT UPSERT */
		UsersWspStates[user.index].wsp!.ev.on('chats.upsert', (chatUpsert) => {
			console.log(chalk.blueBright('[CHAT.UPSERT] '));
			io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
				from: 'CHAT-UPSERT',
				data: chatUpsert
			});
		});
		/* CHAT SET */
		UsersWspStates[user.index].wsp!.ev.on('chats.set', async (chatSet) => {
			console.log(chalk.yellowBright('[CHAT.SET] '));
			io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
				from: 'CHAT-SET',
				data: chatSet
			});
			const userWsp = UsersWspStates[user.index].wsp!;
			setChat(chatSet, userID, userWsp);
		});
		/* CHAT DELETE */
		UsersWspStates[user.index].wsp!.ev.on('chats.delete', (delChat) => {
			io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
				from: 'CHAT-delete',
				data: delChat
			});
		});

		/* TODO: CONTACT CHANGES */
		/* CONTACTS UPDATE */
		UsersWspStates[user.index].wsp!.ev.on('contacts.update', (contactsUpdate) => {
			if (!contactsUpdate[0].notify) {
				io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
					from: 'CONTACTS-UPDATE',
					data: contactsUpdate
				});
			}
		});
		/* CONTACT UPSERT */
		UsersWspStates[user.index].wsp!.ev.on('contacts.upsert', (contactsUpsert) => {
			io.to(UsersWspStates[user.index].socketID).emit('get chats changes', {
				from: 'CONTACTS-UPSERT',
				data: contactsUpsert
			});
			upsertContacts(contactsUpsert, userID);
			SendChatsAndContacts();
		});
		/*TODO: MESSAGES CHANGES*/
		/* MESSAGES UPDATE */
		UsersWspStates[user.index].wsp!.ev.on('messages.update', (messageUpdate) => {
			console.log(chalk.greenBright('[MESSAGES.UPDATE] '));
			io.to(UsersWspStates[user.index].socketID).emit('get message update', {
				from: 'MESSAGES-UPDATE',
				data: messageUpdate
			});
		});
		/* MESSAGES UPSERT */
		UsersWspStates[user.index].wsp!.ev.on('messages.upsert', (messagesUpsert) => {
			upsertMessages(messagesUpsert, userID, io, UsersWspStates[user.index].socketID);
		});
		/* MESSAGE-INFO UPDATE */
		UsersWspStates[user.index].wsp!.ev.on(
			'message-info.update',
			(messageInfoUpdate) => {
				console.log(chalk.yellowBright('[MESSAGE-INFO.UPDATE] '));
				io.to(UsersWspStates[user.index].socketID).emit('get message update', {
					from: 'MESSAGES-INFO-UPDATE',
					data: messageInfoUpdate
				});
			}
		);
	};

	SocketIO.on('connectWsp', async () => {
		try {
			connectWSP();
		} catch (error) {
			console.log('hubo un error =>', error);
		}
	});

	io.to(UsersWspStates[user.index].socketID).emit(
		'wspConnectionState',
		UsersWspStates[user.index].state
	);

	const SendChatsAndContacts = () => {
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
		io.to(UsersWspStates[user.index].socketID).emit('[GET] Chats', chats);
		io.to(UsersWspStates[user.index].socketID).emit('[GET] Contacts', contacts);
	};
	SendChatsAndContacts();
	
}
