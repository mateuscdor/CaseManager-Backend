import { Document } from 'mongoose';

export interface IDatabase extends Document {
    user: string;
    belongToYear: string;
    belongToMonth: string;
    assignment: any[];
}