import { User } from './user.models';

export class Profile {
    id: number;
    meta: any; //document_url, document_verified, gender
    is_verified: number;
    is_online: number;
    assigned: number;
    longitude: string;
    latitude: string;
    user: User;

    constructor() {
        this.user = new User();
        this.meta = {};
    }
}