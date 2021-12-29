import socketio from 'socket.io';
import { setChat, updateChat } from './chat.service';
import { emitEvToClient, getUser } from './whatsappConn.service';

export const onChatEvents = (userID: string, io: socketio.Server) => {
	const { wsp, socketID } = getUser(userID)!;

	/* CHAT SET */
	wsp!.ev.on('chats.set', async (chatSet) => {
		// console.log(chalk.yellowBright('[CHAT.SET] '));
		const data = {
			from: 'CHAT-SET',
			data: chatSet
		};
		emitEvToClient(io, socketID, 'get chats changes', data);
		setChat(chatSet, userID, wsp!);
	});
	/* CHAT UPDATE */
	wsp!.ev.on('chats.update', (chatUpdate) => {
		// console.log(chalk.greenBright('[CHAT.UPDATE] '));
		const data = {
			from: 'CHAT-UPDATE',
			data: chatUpdate
		};
		emitEvToClient(io, socketID, 'get chats changes', data);
		updateChat(chatUpdate, userID);
	});
	/* CHAT UPSERT */
	wsp!.ev.on('chats.upsert', (chatUpsert) => {
		// console.log(chalk.blueBright('[CHAT.UPSERT] '));
		const data = {
			from: 'CHAT-UPSERT',
			data: chatUpsert
		};
		emitEvToClient(io, socketID, 'get chats changes', data);
	});

	/* CHAT DELETE */
	wsp!.ev.on('chats.delete', (delChat) => {
		const data = {
			from: 'CHAT-delete',
			data: delChat
		};
		emitEvToClient(io, socketID, 'get chats changes', data);
	});
};
