import { ICase, IProduct } from "interfaces/CaseMoongose.interface";
import { ITask } from "../interfaces/task.interface";

export class PaymentPlanModel {
    private PaymentPlans: any[] = [];
    constructor(private Case: ICase, private options: ITask) { }

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


Tendrá plazo hasta el ${this.options.timeToResponse} para fijar la postura de pago.
Hasta el ${this.options.timeToPay} para realizar el pago


Quedamos a la espera de su respuesta
Saludos cordiales:

${this.Case.operador}
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
                if (el.monto_capital >= 50000) {
                    return 35;
                }
                return 20;
            };
            const CalcBancoUnPago = ({ producto, monto_capital }: IProduct, quita: number): number => {
                // if(producto === 'Mastercard') {
                //     return monto_capital;
                // };
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

            // Si el producto es Mastercard
            // if (el.producto === 'Mastercard') {
            //     unPago = el.monto_capital + honorariosUnPago;
            // } else {
            //     unPago = bancoUnPago + honorariosUnPago;
            // }

            const UnPagoTemplate = this.addPaymentPlan(el, 1, unPago, unPago, bancoUnPago, honorariosUnPago);
            bodyProducts += UnPagoTemplate;


            if (el.monto_capital <= 100000) {
                if (el.monto_capital >= 5000) {
                    /* tiene 3 cuotas */
                    const tresPagos = (bancoCuotas / 3);
                    const tresPagosTemplate = this.addPaymentPlan(el, 3, tresPagos, tresPagos * 3, bancoCuotas, honorariosCuotas);
                    bodyProducts += tresPagosTemplate;
                }
                if (el.monto_capital >= 10000) {
                    /* tiene 6 cuotas */
                    const seisPagos = (bancoCuotas / 6);
                    const seisPagosTemplate = this.addPaymentPlan(el, 6, seisPagos, seisPagos * 6, bancoCuotas, honorariosCuotas);
                    bodyProducts += seisPagosTemplate;
                }
                if (el.monto_capital >= 20000) {
                    /*  tiene 12 cuotas */
                    const docePagos = (bancoCuotas / 12);
                    const docePagosTemplate = this.addPaymentPlan(el, 12, docePagos, docePagos * 12, bancoCuotas, honorariosCuotas);
                    bodyProducts += docePagosTemplate;
                }
                if (el.monto_capital >= 50000) {
                    /*  tiene 18 cuotas */
                    const dieciOchoPagos = (bancoCuotas / 18);
                    const dieciOchoPagosTemplate = this.addPaymentPlan(el, 18, dieciOchoPagos, dieciOchoPagos * 18, bancoCuotas, honorariosCuotas);
                    bodyProducts += dieciOchoPagosTemplate;
                }
            } else {
                /* se activa 24 cuotas */
                const veintiCuatroPagos = (bancoCuotas / 24);
                const veintiCuatroPagosTemplate = this.addPaymentPlan(el, 24, veintiCuatroPagos, veintiCuatroPagos * 24, bancoCuotas, honorariosCuotas);
                bodyProducts += veintiCuatroPagosTemplate;
                if (el.monto_capital >= 130000) {
                    /* se activa 36 cuotas*/
                    const treintaySeisPagos = (bancoCuotas / 36);

                    const treintaySeisPagosTemplate = this.addPaymentPlan(el, 36, treintaySeisPagos, treintaySeisPagos * 36, bancoCuotas, honorariosCuotas);
                    bodyProducts += treintaySeisPagosTemplate;
                }
            }
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
Banco……… ${'$' + result.banco}
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