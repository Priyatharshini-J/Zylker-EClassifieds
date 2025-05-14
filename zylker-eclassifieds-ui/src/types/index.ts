export interface Product {
    id: string;
    name: string;
    code: string;
    price: number;
    description: string;
    images: string[];
  }
  
  export interface CartItem extends Product {
    quantity: number;
  }
  
  export interface User {
    userId: string;
    name: string;
    email: string;
  }

  export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }

  export interface OrderResponse {
    orderId: string;
    status: string;
    total: number;
    items: OrderItem[];
  }

  export interface Order {
    userId: string;
    orderId: string;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
    items: OrderItem[];
    total: number;
    address: string;
    createdAt: string;
  }