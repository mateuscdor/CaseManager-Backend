import { ExpresServer } from './app';
import { SocketServer } from './web-socket/init';
import dotenv from "dotenv";

dotenv.config();
const server = new ExpresServer().start();
new SocketServer(server);
