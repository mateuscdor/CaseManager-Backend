import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { tokenValidation } from '../middlewares/verifyToken';

export class AuthRoutes {
	private authRouter: Router;
	private AuthControllers;
	constructor() {
		this.authRouter = Router();
		this.AuthControllers = new AuthController();
	}

	Routes() {
		this.authRouter.post('/signIn', this.AuthControllers.singIn);
		this.authRouter.get(
			'/userProfile',
			[tokenValidation],
			this.AuthControllers.userProfile
		);
		this.authRouter.post('/getAudioBuffer', this.AuthControllers.DownloadMedia);
        this.authRouter.get('/test/:id', this.AuthControllers.test)
		return this.authRouter;
	}
}
