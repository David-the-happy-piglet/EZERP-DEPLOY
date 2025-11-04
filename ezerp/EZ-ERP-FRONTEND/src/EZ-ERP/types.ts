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
        phone: string;
        address: string;
    };
    items: Array<{
        itemId: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    status: 'BIDDING' | 'PENDING' | 'PROCESSING' | 'CANCELLED' | 'COMPLETED';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    shippingAddress: string;
    dueDate: string;
    notes?: string;
    isRework: boolean;
    reworkReason?: string;
    reworkOrderNumber?: string;
    orderImage?: string;
    createdAt: string;
    updatedAt: string;
} 