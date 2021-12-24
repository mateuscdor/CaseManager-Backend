import fs from 'fs';
import path from 'path';
import { loadContentMessage } from './chat.service';

export type ChatHistory = {
	chats: any[];
	messages: any[];
	contacts: any[];
};

function getDestination(userID: string) {
	const destination = `${path.join(
		__dirname,
		'../controllers',
		'chats',
		`chat-history-${userID}.json`
	)}`;
	return destination;
}

export const GetUserChatsHistory = (userID: string): ChatHistory => {
	const buffer = fs.readFileSync(getDestination(userID), 'utf-8');
	const userChathistory: ChatHistory = JSON.parse(buffer);
	return userChathistory;
};

export const SaveFile = (file: any, userID: string) => {
	fs.writeFileSync(getDestination(userID), JSON.stringify(file));
};

export const downloadContent = async (chats: any[]) => {
	const chatsReceive = chats;
	try {
		for await (const [i, chat] of chatsReceive.entries()) {
			for await (const [v, message] of chat.messages.entries()) {
				if (message.message != undefined && message.message.audioMessage) {
						const buf = await loadContentMessage(message);
						chats[i].messages[v] = {
							...message,
							audioBuffer: buf
						};
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
	return chatsReceive;
};
