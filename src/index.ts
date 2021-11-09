import { ExpresServer } from './app';
import { SocketServer } from './web-socket/init';
import dotenv from "dotenv";
import './whiteListUsers';

dotenv.config();
const server = new ExpresServer().start();
new SocketServer(server);
