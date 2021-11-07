
export interface ICase{
    titular: string;
    ident_tipo: string;
    ident_nro: number;
    domicilio: string;
    localidad: string;
    operador: string;
    estado: string;
    productos: IProduct[];
    celulares: any[];
};

export interface IProduct {
    producto: string;
    producto_nro: number;
    fecha_mora: string;
    monto_capital: number;
    deuda_act: number;
    acreedor: string;
    cantidad_cuotas: number;
    cuotas_Impagas: number;
    estado: string;
    acuerdo: string;
    ciclo: number;
};
