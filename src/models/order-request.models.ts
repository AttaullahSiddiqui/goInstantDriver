import { Order } from './order.models';
import { Profile } from './profile.models';

export class OrderRequest {
    id: number;
    order: Order;
    delivery_profile_id: number;
    delivery: Profile;
    status: string;
    created_at: string;
    updated_at: string;
}