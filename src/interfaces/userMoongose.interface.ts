import { Document } from 'mongoose';
import { IDatabase } from './databaseMongoose.interface';

export interface IUser extends Document {
    username: string,
    password: string,
    profile: { _id: string, user: string, fullName: string };
    roles: string[],
    encryptPassword(password: string): Promise<string>;
    validatePassword(password: string): Promise<boolean>;
    databases: IDatabase[];
}

export interface IPayload {
    id: string;
    iat: number;
    exp: number;
}