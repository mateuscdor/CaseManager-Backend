import { MessageUpdateType, proto } from '@adiwajshing/baileys-md';
import { GetUserChatsHistory, SaveFile, downloadContent } from './userChatHistory.service';
import socketio, { Socket } from 'socket.io';
import chalk from 'chalk';

export const upsertMessages = async (
	messages: { messages: proto.IWebMessageInfo[]; type: MessageUpdateType },
	userID: string,
	io: socketio.Server,
	socketID: string
) => {
	const UserChatHistory = GetUserChatsHistory(userID);
	
	UserChatHistory.chats.forEach((chat, i) => {
		const IncomingMessages = messages.messages.filter(
			(m) => m.key.remoteJid === chat.id
		);
		const MessagesSaved = UserChatHistory.chats[i].messages;

		IncomingMessages.forEach((im) => {
			const validate = MessagesSaved.find((ms: any) => ms.key.id === im.key.id);
			if (!validate) {
				MessagesSaved.push(im);
			}
		});

		MessagesSaved.sort(
			(a: any, b: any) => Number(a.messageTimestamp) - Number(b.messageTimestamp)
		);
			UserChatHistory.chats[i].messages = UserChatHistory.chats[i].messages.slice(-25);
	});

	// UserChatHistory.chats = await downloadContent(UserChatHistory.chats);
	
	SaveFile(UserChatHistory, userID);
	console.log(chalk.blueBright('[MESSAGES.UPSERT]'));
	io.to(socketID).emit('[GET] Chats', UserChatHistory.chats);
	io.to(socketID).emit('get message update', {
		from: 'MESSAGES-UPSERT',
		data: messages
	});
	
};
