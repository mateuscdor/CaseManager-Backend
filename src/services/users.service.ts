import { readFileSync, writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'

export interface IUser {
    id: string;
    userName: string;
    password: string;
    fullName: string;
};

export interface IDB {
    WhiteListUsers: IUser[];
}

export const createUser = (UserName: string, Password: string, fullName: string) => {
    const db = readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
    const database = JSON.parse(db) as IDB;
    database.WhiteListUsers.push({
        id: uuidv4(),
        userName: UserName,
        password: Password,
        fullName: fullName
    });

    writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(database));
};


export const getUserProfile = (id: string) => {
    const db = readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
    const database = JSON.parse(db) as IDB;
    const user = database.WhiteListUsers.find(e => e.id === id);

    return user!.fullName;
};

export const getUserById = (ID: string) => {
    const db = readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
    const database = JSON.parse(db) as IDB;
    const user = database.WhiteListUsers.find(e => e.id === ID);
    return user;
}

export const ValidateUser = (userName: string, Password: string) => {
    const db = readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
    const database = JSON.parse(db) as IDB;
    const user = database.WhiteListUsers.find(e => e.userName === userName && e.password === Password);

    return user;
}