import socketio, { Socket } from 'socket.io';
import makeWASocket, {
	DisconnectReason,
	useSingleFileAuthState,
	WASocket,
	WAConnectionState
} from '@adiwajshing/baileys-md';
import fs from 'fs';
import path from 'path';

import ora from 'ora';
import chalk from 'chalk';
import { Boom } from '@hapi/boom';

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

export function WhatsappControllers(
	socket: Socket,
	io: socketio.Server,
	userID: string
) {
	const SocketIO = socket;
	const spinner = ora();

	const WspUser: UserWspStatus = {
		userID,
		socketID: socket.id,
		wsp: null,
		state: 'close'
	};

	!UsersWspStates.some((wsp) => wsp.userID === userID) &&
		UsersWspStates.push(WspUser);
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
		// './auth_info_multi.json'
		`${path.join(__dirname, 'auth', `${userID}.json`)}`
	);
	const user = findUser(userID);

	const connectWSP = async () => {
		try {
			fs.mkdir(`${path.join(__dirname, 'auth')}`, (e) => {
				console.log(e);
			})
		} catch (error) {
			console.log('La carpeta ya existe, Error: ', error);
		}


		spinner.info(`${chalk.blueBright('Iniciando conexion con wsp')}`);

		UsersWspStates[user.index].wsp = makeWASocket({
			printQRInTerminal: false,
			auth: state
		});
		UsersWspStates[user.index].wsp!.ev.on(
			'connection.update',
			(ConnState) => {
				const { connection, lastDisconnect, qr } = ConnState;
				if (qr != null) {
					io.to(user.user!.socketID).emit('wsp qr code', qr);
				}
				spinner.info(
					`${chalk.redBright(
						'ESTADO DE LA CONEXION: '
					)} ${chalk.greenBright(connection)}`
				);
				if (connection != null) {
					io.to(user.user!.socketID).emit(
						'wspConnectionState',
						connection
					);
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
							`${chalk.redBright(
								'ESTADO DE LA CONEXION: '
							)} ${chalk.greenBright(connection)}`
						);
					} else {
						console.log('Conexion Cerrada');
					}
				}
			}
		);
		UsersWspStates[user.index].wsp!.ev.on('creds.update', saveState);
	};

	SocketIO.on('connectWsp', async () => {
		try {
			await connectWSP();
		} catch (error) {
			console.log('hubo un error =>', error);
		}
	});
	io.to(UsersWspStates[user.index].socketID).emit(
		'wspConnectionState',
		UsersWspStates[user.index].state
	);
}
