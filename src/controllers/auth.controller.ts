import { Request, Response } from 'express';
import jwt from "jsonwebtoken";

import { WhiteListUsersArr } from '../whiteListUsers';

export class AuthController {
    constructor() { }

    async singIn(req: Request, res: Response) {
        const { username, password } = req.body;
        const user = WhiteListUsersArr().find(f => f.user === username);

        if (!user) return res.status(400).json({ error: 'No existe usuario o contraseña invalida' });
        const validatePassword = () => {
            if(user.password !== password) return false;
            return true
        } 
        if (!validatePassword) return res.status(400).json({ error: 'No existe usuario o contraseña invalida' });

        const token: string = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET!, {
            expiresIn: '8 hrs',
        })
        res.json({
            token
        })

    }

    // async userProfile(req: Request, res: Response) {
    //     const user = await UserProfile.findOne({user: req.userId});
    //     if (!user) return res.status(404).json('el usuario no existe');
    //     res.json(user)
    // }

    // signOut(req: Request, res: Response) {
    //     res.send('recibido')
    // }
}