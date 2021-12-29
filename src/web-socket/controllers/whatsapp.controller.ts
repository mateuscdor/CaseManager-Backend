import socketio, { Socket } from 'socket.io';

import {
	UserWspStatus,
	addUser,
	getUser,
	updateUserSocketID,
	initializeWsp,
	SendChatsAndContacts
} from '../services/whatsappConn.service';

export function WhatsappControllers(socket: Socket, io: socketio.Server, userID: string) {
	const WspUser: UserWspStatus = {
		userID,
		socketID: socket.id,
		wsp: null,
		state: 'close'
	};

	addUser(WspUser);
	/* cambiando el id del socket a medida que el usuario se reconecte */
	updateUserSocketID(userID, socket.id);
	const { socketID, state } = getUser(userID)!;

	socket.on('connectWsp', async () => {
		try {
			initializeWsp(userID, io);
		} catch (error) {
			console.log('hubo un error =>', error);
		}
	});

	io.to(socketID).emit('wspConnectionState', state);

	SendChatsAndContacts(userID, socketID, io);
}
