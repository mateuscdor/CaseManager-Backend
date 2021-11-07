import { Document, Types } from 'mongoose';
import { ICase } from './CaseMoongose.interface';

export interface IAssignment extends Document{
    DatabaseID: any;
    UserID: any;
    Cases: Types.DocumentArray<ICase>;
    CasesWOContactMethods: Types.DocumentArray<ICase>;
    PaymentPlans: any;
    CasesEnd: Types.DocumentArray<ICase>;
    Cicle: string;
    isDefault: boolean;
}