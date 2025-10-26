export interface Address {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
}

export interface Customer {
    _id: string;
    companyName: string;
    name: string;
    department: string;
    position: string;
    phone?: string;
    address: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Order {
    _id: string;
    orderNumber: string;
    description: string;
    customer: {
        _id: string;
        companyName: string;
        name: string;
        email: string;
        phone: string;
        address: {
            street: string;
            city: string;
            state: string;
            country: string;
            zipCode: string;
        };
    };
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    dueDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
} 