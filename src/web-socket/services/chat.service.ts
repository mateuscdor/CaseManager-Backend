import {
	Chat,
	proto,
	WASocket,
	downloadContentFromMessage
} from '@adiwajshing/baileys-md';
import { GetUserChatsHistory, SaveFile } from './userChatHistory.service';

export const updateChat = (chatUpdate: Partial<Chat>[], userID: string) => {
	const UserChatHistory = GetUserChatsHistory(userID);

	const chatToUpdate = UserChatHistory.chats.findIndex((c) => c.id === chatUpdate[0].id);
	if (chatToUpdate !== -1) {
		const Timestamp = UserChatHistory.chats[chatToUpdate]!.conversationTimestamp.low;
		const NewTimestamp = chatUpdate[0].conversationTimestamp;
		if (Timestamp < NewTimestamp!) {
			UserChatHistory.chats[chatToUpdate].conversationTimestamp.low =
				chatUpdate[0].conversationTimestamp;
		}
	}
	SaveFile(UserChatHistory, userID);
};

export const chatUpsert = (Chat: Chat[]) => {};

export const loadContentMessage = async (message: proto.IWebMessageInfo) => {
	const audioM = message.message!.audioMessage!
	const stream = await downloadContentFromMessage(audioM as any, 'audio')
	let buffer = Buffer.from([])
	for await(const chunk of stream) {
		buffer = Buffer.concat([buffer, chunk])
	}
	return buffer
};

export const setChat = async (
	chats: { chats: Chat[]; messages: proto.IWebMessageInfo[] },
	userID: string,
	whatsapp: WASocket
) => {
	const UserChatHistory = GetUserChatsHistory(userID);
	UserChatHistory.chats = chats.chats;
	UserChatHistory.chats.sort(
		(a: any, b: any) => b.conversationTimestamp.low - a.conversationTimestamp.low
	);
	const userImgPreviewProfiles = await Promise.all(
		UserChatHistory.chats.map(async (chat) => {
			let profileIMG = '';
			try {
				const url = await whatsapp.profilePictureUrl(chat.id, 'preview');
				profileIMG = url;
			} catch (error) {
				profileIMG = '';
			}
			return profileIMG;
		})
	);

	UserChatHistory.chats = UserChatHistory.chats.map((chat, i) => {
		return {
			...chat,
			profilePreviewImg: userImgPreviewProfiles[i],
			messages: chats.messages.filter((m) => m.key.remoteJid === chat.id)
		};
	});
	SaveFile(UserChatHistory, userID);
};
