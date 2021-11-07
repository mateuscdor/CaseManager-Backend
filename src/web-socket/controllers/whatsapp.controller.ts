import socketio, { Socket } from "socket.io";
import { WAConnection, WAConnectionState } from '@adiwajshing/baileys';

import ora from 'ora';
import chalk from 'chalk';

type UserWspStatus = {
    userID: string,
    socketID: string,
    state: WAConnectionState,
    wsp: WAConnection
}

let UsersWspStates: UserWspStatus[] = [];

const findUser = (UserID: string) => {
    const user = UsersWspStates.find(user => user.userID === UserID);
    return user;
};


export function WhatsappControllers(socket: Socket, io: socketio.Server, userID: string) {
    const SocketIO = socket;
    const spinner = ora();
    let WhatsAppConn: WAConnection = new WAConnection();
    WhatsAppConn.version = [2, 2140, 12]
    const WspUser: UserWspStatus = {
        userID,
        socketID: socket.id,
        state: WhatsAppConn.state,
        wsp: WhatsAppConn
    };

    !UsersWspStates.some(wsp => wsp.userID === userID) && UsersWspStates.push(WspUser);
    /* cambiando el id del socket a medida que el usuario se reconecte */
    UsersWspStates = UsersWspStates.map(f => {
        if (f.userID === userID) {
            return {
                ...f,
                socketID: socket.id
            };
        };
        return f
    });

    const connectWSP = async () => {
        spinner.info(`${chalk.blueBright('Iniciando conexion con wsp, enviando qr')}`);
        const user = findUser(userID);
        user?.wsp.on('qr', qr => io.to(socket.id).emit('wsp qr code', qr));

        user?.wsp.on('close', () => {
            const userIndex = UsersWspStates.findIndex(f => f.userID === userID);
            UsersWspStates[userIndex].state = 'close';
            informWSPStatus(UsersWspStates[userIndex].userID);
        });
        await user?.wsp.connect();
        UsersWspStates[userIndex].state = user!.wsp.state;
        informWSPStatus(UsersWspStates[userIndex].userID);
        return user!.wsp;
    };



    const informWSPStatus = (userID: string) => {
        const user = findUser(userID);
        io.to(user!.socketID).emit('wspConnectionState', user!.state);
    };

    SocketIO.on('connectWsp', async () => {
        try {
            await connectWSP();

        } catch (error) {
            spinner.warn(`${chalk.redBright('Error al conectar wsp ')}`);
            console.log(error);
            const WhatsAppConn = new WAConnection();
            WhatsAppConn.version = [2, 2140, 12];
            const user = UsersWspStates.findIndex(f => f.userID === userID);
            UsersWspStates[user].wsp = WhatsAppConn;

            await connectWSP();
        };
    });

    const userIndex = UsersWspStates.findIndex(f => f.userID === userID);
    informWSPStatus(UsersWspStates[userIndex].userID);


    return UsersWspStates[userIndex].wsp;
};
