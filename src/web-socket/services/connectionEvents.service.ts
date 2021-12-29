import makeWASocket, { DisconnectReason } from '@adiwajshing/baileys-md';
import { Boom } from '@hapi/boom';
import socketio from 'socket.io';
import {
	emitEvToClient,
	getUser,
	initializeWsp,
	updateUserWspState,
	fileAuthState,
	updateUserWsp
} from './whatsappConn.service';

export const onConnectionChanges = (userID: string, io: socketio.Server) => {
	const { state, saveState } = fileAuthState(userID);
	const newWsp = makeWASocket({
		printQRInTerminal: false,
		auth: state,
		browser: ['Gestor de mensajeria', 'Gestor de mensajeria', 'Gestor de mensajeria']
	});
	updateUserWsp(userID, newWsp);
    
    let { wsp, socketID } = getUser(userID)!;

	wsp!.ev.on('connection.update', (ConnState) => {
		const { connection, lastDisconnect, qr } = ConnState;
		if (qr != null) {
			emitEvToClient(io, socketID, 'wsp qr code', qr);
		}
		// spinner.info(
		// 	`${chalk.redBright('ESTADO DE LA CONEXION: ')} ${chalk.greenBright(connection)}`
		// );
		if (connection != null) {
			emitEvToClient(io, socketID, 'wspConnectionState', connection);
			updateUserWspState(userID, connection);
		}

		if (connection === 'close') {
			// reconnect if not logged out
			if (
				(lastDisconnect!.error as Boom)?.output?.statusCode !==
				DisconnectReason.loggedOut
			) {
				initializeWsp(userID, io);
				// spinner.succeed(
				// 	`${chalk.redBright('ESTADO DE LA CONEXION: ')} ${chalk.greenBright(
				// 		connection
				// 	)}`
				// );
			} else {
				console.log('Conexion Cerrada');
			}
		}
	});
	wsp!.ev.on('creds.update', saveState);
};
