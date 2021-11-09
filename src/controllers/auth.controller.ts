import { Request, Response } from 'express';
import jwt from "jsonwebtoken";

import { createUser, ValidateUser, getUserProfile } from '../service/users.service';

export class AuthController {
    constructor() { }

    async singIn(req: Request, res: Response) {
        const { username, password } = req.body;
        const user = ValidateUser(username, password);

        if (!user) return res.status(400).json({ error: 'No existe usuario o contraseña invalida' });
        const validatePassword = () => {
            if (user.password !== password) return false;
            return true
        }
        if (!validatePassword) return res.status(400).json({ error: 'No existe usuario o contraseña invalida' });

        const token: string = jwt.sign({ id: user.id, UserfullName: user.fullName }, process.env.TOKEN_SECRET!, {
            expiresIn: '10 hrs',
        })
        res.json({
            token
        })

    }

    async userProfile(req: Request, res: Response) {
        const user = getUserProfile(req.userId)
        try {
            res.json({ fullName: user! })
        } catch (error) {
            console.log('Error al obtener el perfil de usuario');
            if (!user) return res.status(404).json('el usuario no existe');
        }
    }

    // signOut(req: Request, res: Response) {
    //     res.send('recibido')
    // }
}