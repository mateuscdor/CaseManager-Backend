import { Contact } from '@adiwajshing/baileys-md';
import { GetUserChatsHistory, SaveFile } from './userChatHistory.service';

export const upsertContacts = (Contacts: Contact[], userID: string) => {
	const UserChatHistory = GetUserChatsHistory(userID);
	if (UserChatHistory.contacts.length <= 0) {
		UserChatHistory.contacts = Contacts;
	}
	SaveFile(UserChatHistory, userID);
};
