import { ICase, IProduct } from "interfaces/CaseMoongose.interface";
import { ITask } from "../interfaces/task.interface";

export class PaymentPlanModel {
    private PaymentPlans: any[] = [];
    constructor(private Case: ICase, private taskForm: ITask) { }

    private header(): string {
        return `
ESTUDIO JURIDICO
Alonso Lopez & Asociados

Estimado/a: ${this.Case.titular}
Con ${this.Case.ident_tipo} : ${this.Case.ident_nro}
Por el presente le informamos que Ud. posee una deuda con Industrial and Commercial Bank of China (Argentina) S.A.U -ICBC- proveniente de el o los productos siguientes:
**************************
${this.headerProducts()}
**************************
A continuación, ponemos a su disposición las posibilidades de pago para regularizar su deuda:
**************************
${this.bodyProducts()}
**************************

Las propuestas detalladas quedan sujetas a la aprobación de Industrial and Commercial Bank of China (Argentina) S.A.


Tendrá plazo hasta el ${this.taskForm.timeToResponse} para fijar la postura de pago.
Hasta el ${this.taskForm.timeToPay} para realizar el pago


Quedamos a la espera de su respuesta
Saludos cordiales: ${this.taskForm.UserFullName}

Estudio Jurídico Alonso López y Asociados
Dr. Pedro Ubaldo Alonso López
C.U.I.T.: 20-22964862-5
Marcelo T. de Alvear 1381 Piso 1 Of. 11 y 12 C.A.B.A.
Tel.: 011 4813-9285/4815-9509/9989
e-mail: estudio@alabogados.com.ar

`

    }

    private headerProducts(): string {
        let headerProducts = ``;
        this.Case.productos.forEach(el => {
            const product = `
${el.producto}  operación ${el.producto_nro}; cuya fecha de mora es ${el.fecha_mora}. Registra un monto capital de ${'$' + el.monto_capital.toLocaleString('es-ar')} siendo el saldo actualizado a la fecha de ${'$' + el.deuda_act.toLocaleString('es-ar')} 
`;
            headerProducts += product;
        });
        return headerProducts;
    }

    private bodyProducts() {
        let bodyProducts: string = ``;
        this.Case.productos.forEach(el => {
            /* QUITA */
            
            const calcQuita = (): number => {
                const Quita = this.taskForm.options.quitas[0];
                const QuitasPorDefecto = () => {
                    console.log('Se aplicaran quitas por defecto');
                    if (el.monto_capital >= 50000) {
                        return 35;
                    };
                    return 20;
                };

                const CalcQuitasFromUser = (quita: {
                    condicion: number,
                    valorQuita: number,
                    SiNoCumple: number
                }): number => {
                    if (el.monto_capital >= quita.condicion) {
                        console.log('Se aplicara una quita del: ', quita.valorQuita);
                        return quita.valorQuita;
                    };
                    console.log('Se aplicara una quita del: ', quita.SiNoCumple);
                    return quita.SiNoCumple;
                };
                return this.taskForm.options.quitas.length > 0 ? CalcQuitasFromUser(Quita) : QuitasPorDefecto();
            };
            
            const CalcBancoUnPago = ({ monto_capital }: IProduct, quita: number): number => {
                return monto_capital - quita;
            };

            const quita = (el.monto_capital * calcQuita()) / 100;
            let bancoUnPago = CalcBancoUnPago(el, quita);
            /* honorarios un pago */
            const honorariosUnPagoSinIva = (bancoUnPago * 18) / 100;
            const honorariosUnPagoIva = (honorariosUnPagoSinIva * 21) / 100;
            const honorariosUnPago = honorariosUnPagoSinIva + honorariosUnPagoIva;
            /* honoriarios cuotas */
            const honorariosCuotasSinIva = (el.deuda_act * 18) / 100;
            const honorariosCuotasIva = (honorariosCuotasSinIva * 21) / 100;
            const honorariosCuotas = honorariosCuotasSinIva + honorariosCuotasIva;
            const bancoCuotas = el.deuda_act + honorariosCuotas;

            let unPago = bancoUnPago + honorariosUnPago;

            const UnPagoTemplate = this.addPaymentPlan(el, 1, unPago, unPago, bancoUnPago, honorariosUnPago);
            bodyProducts += UnPagoTemplate;

            const cuotas = this.taskForm.options.cuotas.filter(e => bancoCuotas >= e.condicion);
            console.log(`Monto: ${bancoCuotas} cuotas disponibles: `, cuotas);

            if (cuotas) {
                cuotas.forEach(cuotasDisponibles => {
                    const planDePago = (bancoCuotas / cuotasDisponibles.cantidadDeCuotas);
                    const planDePagoTemplate = this.addPaymentPlan(el, cuotasDisponibles.cantidadDeCuotas, planDePago, planDePago * cuotasDisponibles.cantidadDeCuotas, bancoCuotas, honorariosCuotas);
                    bodyProducts += planDePagoTemplate;
                });
            };
        });
        return bodyProducts;
    };

    private addPaymentPlan(producto: IProduct, cuotas: number, montoCuota: number, montoTotal: number, banco: number, honorarios: number) {
        const result = {
            producto: producto.producto,
            producto_nro: producto.producto_nro,
            monto_capital: producto.monto_capital.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            montoCuota: montoCuota.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            plan: cuotas,
            banco: banco.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            montoTotal: montoTotal.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            fecha_mora: producto.fecha_mora,
            deuda_act: producto.deuda_act.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            honorarios: honorarios.toLocaleString('es-ar', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };
        this.PaymentPlans.push(result);

        if (cuotas === 1) {
            const UnPagoTemplate = `
${producto.producto}
Cancelación en un pago único de ${'$' + result.montoTotal}
Banco……… ${'$' + result.banco}
Honorarios 18% más IVA……… ${'$' + result.honorarios} 
            `;
            return UnPagoTemplate;
        } else {
            const variosPagosTemplate = `
Acuerdo de pago de ${cuotas} cuotas de ${'$' + result.montoCuota} cada una.
Banco……… ${'$' + result.deuda_act}
Honorarios 18% más IVA … ${'$' + result.honorarios}
Total del acuerdo……${'$' + result.montoTotal}
            `;
            return variosPagosTemplate;
        }
    };

    getMessage() {
        return this.header();
    };
    getPaymentPlans() {
        const paymentPlans = [... new Set(this.PaymentPlans)];
        return paymentPlans;
    };

}