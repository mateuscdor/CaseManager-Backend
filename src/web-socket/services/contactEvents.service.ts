import socketio from 'socket.io';
import { upsertContacts } from './conctact.service';
import { emitEvToClient, getUser, SendChatsAndContacts } from "./whatsappConn.service";

export const onContactEvents = (userID: string, io: socketio.Server) => {
    const { wsp, socketID } = getUser(userID)!;
    /* CONTACTS UPDATE */
	wsp!.ev.on('contacts.update', (contactsUpdate) => {
		const data = {
			from: 'CONTACTS-UPDATE',
			data: contactsUpdate
		};
		emitEvToClient(io, socketID, 'get chats changes', data);
	});

    /* CONTACT UPSERT */
	wsp!.ev.on('contacts.upsert', (contactsUpsert) => {
		const data = {
			from: 'CONTACTS-UPSERT',
			data: contactsUpsert
		}
		upsertContacts(contactsUpsert, userID);
		emitEvToClient(io, socketID, 'get chats changes', data);
		SendChatsAndContacts(userID, socketID, io);
	});
}