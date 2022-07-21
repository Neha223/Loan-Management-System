export interface User {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    contactNo: number;
    customerType: CUSTOMERTYPE;
    address: string;
}

export enum CUSTOMERTYPE {
    LENDER,
    BORROWER
}
  