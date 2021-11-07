import { ICase } from "interfaces/CaseMoongose.interface";

export class PresentationModel {
    constructor(private debtor: ICase){}

    getMessage(){
        return `
ESTUDIO JURIDICO 
Alonso López & Asociados
 
Estimado/a: ${this.debtor.titular}
Con ${this.debtor.ident_tipo}: ${this.debtor.ident_nro}

Me dirijo a usted en mi calidad de abogado apoderado de Industrial and Commercial Bank of China (Argentina) S.A.U -ICBC- a fin de informarle que se encuentra asignada a este estudio jurídico la deuda que usted posee con la entidad bancaria referida, para la realización de la gestión de cobranza y posterior inicio del juicio correspondiente.
 
Le informamos que existe la posibilidad de llegar a un acuerdo en forma extrajudicial, a fin de que cancele su deuda al contado o bien en cuotas de factible pago.
 
Por todo lo expuesto lo invitamos a comunicarse a la brevedad con ${this.debtor.operador} de lunes a viernes en el horario de 09:00hs a 19:00hs, a los teléfonos 011- 4813-9285 /011- 4815-9509 /011- 4815- 9989 y líneas rotativas para lograr llegar a un acuerdo de pago. Vía e-mail: estudio@alabogados.com.ar o WHATSAPP (011) 11 6722-3127
 
En caso de no registrar llamado alguno, se procederá al inicio de las actuaciones judiciales.
 
Sin más lo saludo atentamente
 
Dr. Pedro U. Alonso López
C.U.I.T.: 20-22964862-5

ESTUDIO JURIDICO ALONSO LOPEZ Y ASOC.
`
    }
}