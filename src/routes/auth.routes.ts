import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { tokenValidation } from "../middlewares/verifyToken";

export class AuthRoutes {
    private authRouter: Router;
    private AuthControllers;
    constructor() {
        this.authRouter = Router();
        this.AuthControllers = new AuthController();
    }

    Routes() {
        this.authRouter.post('/signIn', this.AuthControllers.singIn);
        return this.authRouter;
    }
};
