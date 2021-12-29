import socketio from 'socket.io';
import { upsertMessages } from './messages.service';
import { emitEvToClient, getUser } from './whatsappConn.service';

export const onMessagesEvents = (userID: string, io: socketio.Server) => {
	const { wsp, socketID } = getUser(userID)!;
	/* MESSAGES UPDATE */
	wsp!.ev.on('messages.update', (messageUpdate) => {
		const data = {
			from: 'MESSAGES-UPDATE',
			data: messageUpdate
		};
		emitEvToClient(io, socketID, 'get message update', data);
	});

	/* MESSAGES UPSERT */
	wsp!.ev.on('messages.upsert', (messagesUpsert) => {
		upsertMessages(messagesUpsert, userID, io, socketID);
	});
	/* MESSAGE-INFO UPDATE */
	wsp!.ev.on('message-info.update', (messageInfoUpdate) => {
		// console.log(chalk.yellowBright('[MESSAGE-INFO.UPDATE] '));
		const data = {
			from: 'MESSAGES-INFO-UPDATE',
			data: messageInfoUpdate
		};
		emitEvToClient(io, socketID, 'get message update', data);
	});
};
