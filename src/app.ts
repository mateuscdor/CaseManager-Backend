import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan'

import { AuthRoutes } from './routes/auth.routes';

export class ExpresServer {
    private app: Application = express();
    constructor() {
        this.config();
        this.AuthRoutes();
    };

    //Setting
    private config() {
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(morgan('dev'));
        this.app.use(cors());
        this.app.use(express.json({ limit: '5mb' }));
        this.app.use(express.urlencoded({ extended: false }));
    };

    //Routes
    private AuthRoutes() {
        const routes = new AuthRoutes();
        this.app.use('/api/auth', routes.Routes());

    };

    //Function to start the server
    start() {
        const server = this.app.listen(this.app.get('port'),
            () => console.log('server on port: ', this.app.get('port')));
        return server;
    };
}