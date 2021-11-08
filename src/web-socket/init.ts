import socketIo, { Socket } from 'socket.io';
import { Server } from 'http';
import { WhatsappControllers } from './controllers/whatsapp.controller';
import { WAConnection } from '@adiwajshing/baileys';
import { TaskControllers } from './controllers/task.controllers';
import ora from 'ora';
import chalk from 'chalk';
import JWT from 'jsonwebtoken';
import { IPayload } from 'interfaces/userMoongose.interface';

export class SocketServer {
    private spinner = ora();
    private users: any[] = [];
    constructor(private HTTPServer: Server) {
        this.start();
    };

    start() {
        const io = new socketIo.Server(this.HTTPServer, {
            cors: {
                origin: 'http://localhost:4200',
                methods: ['GET', 'POST']
            },
        });
        io.on('connection', (socket: Socket) => {
            const user = JWT.decode(socket.handshake.query.token as string) as IPayload;
            if (user) {
                this.spinner.succeed(
                    `${chalk.green(`Nueva conexion, ${chalk.yellowBright(`SocketID: ${socket.id}, UserID: ${user.id}`)}`)}`);
                    console.log(user);
                const WhatsappController = WhatsappControllers(socket, io, user!.id);
                this.AddUser(user.id, socket.id);
                this.users = this.users.map(e => {
                    if (e.UserID !== undefined && e.UserID === user!.id) {
                        return {
                            ...e,
                            SocketID: socket.id
                        };
                    };
                });
                const userIndex = this.users.findIndex(e => e !== undefined && e.UserID === user!.id);
                /* TAREAS */
                TaskControllers(socket, io, user.id, user.UserfullName);

                socket.on('disconnect', () => {
                    this.RemoveUser(user.id);
                    this.spinner.info(`${chalk.red(`Nueva desconexion a socket, id => ${socket.id}`)}`);
                });
            }
        });
    };

    private AddUser(UserID: string, SocketID: string) {
        !this.users.some(user => user.UserID === UserID) &&
            this.users.push({
                UserID,
                SocketID,
            });
    };

    private RemoveUser(UserID: string) {
        this.users = this.users.filter(e => e !== undefined && e.UserID !== UserID);
    }
};
