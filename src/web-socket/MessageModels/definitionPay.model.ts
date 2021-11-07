import { ICase } from '../../interfaces/CaseMoongose.interface';
import { ITask } from '../interfaces/task.interface';
export class definitionPayModel {
    constructor(private Case: ICase, private form: ITask) { }

    getMessage(): string {
        return `*ESTUDIO JURIDICO*
*Alonso Lopez & Asociados*
*Estimado/a: ${this.Case.titular}*                            
*Con* *${this.Case.ident_tipo}*  *${this.Case.ident_nro}*


*Nos contactamos con Ud. en virtud de la propuesta efectuada para la cancelación de la deuda que registra con Industrial and Commercial Bank Of China (Argentina) S.A.U -ICBC-*
*por el/los producto/s ${this.getproducts()}.*

*A fin de recordarle que necesitamos URGENTE DEFINCIÓN. De no tener respuesta alguna, se dará curso a las acciones judiciales correspondiente a su caso*


*LE INFORMAMOS QUE LAS PROPUESTAS ENVIADAS CONTINUARAN VIGENTES HASTA EL ${this.form.timeToResponse} Y PODRA REALIZAR EL PAGO HASTA EL ${this.form.timeToPay}*

*Saludos cordiales.*

*Estudio Jurídico Alonso López & Asociados*
*Dr. Pedro Ubaldo Alonso López*
*C.U.I.T.: 20-22964862-5*
*Tel : (011) 4813-9285 / 4815-9509/9989*
*e-mail: estudio@alabogados.com.ar*
*Marcelo T. de Alvear 1381 P.1º Of. 11 / 12.-*
`
    }

    private getproducts(): string {
        const productos = this.Case.productos.filter(el => el.acuerdo === 'No').map(res => res.producto).toString();
        return productos;
    }
}