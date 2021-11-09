import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'

import { IPayload } from '../interfaces/userMoongose.interface';
import { WhiteListedUsers } from '../whiteListUsers';

export const tokenValidation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.split(' ')[1];

        if (!token) return res.status(401).json('No token provided');

        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as IPayload;
        const user = WhiteListedUsers.find(e => e.id === decoded.id);

        if (!user) return res.status(404).json({ message: 'user not found' });
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'token expired' });
    }
};
