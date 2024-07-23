import Conf from "conf";
import jwt from "jsonwebtoken"
import { API_URL } from "./constants";
class SafeStorage {
	private config: Conf;

	constructor(name: string) {
		this.config = new Conf({
			projectName: name,
			encryptionKey: 'test123', // Replace with a secure, randomly generated key
		});
	}
	getAuthToken(): string {
		return this.get('token');
	}
	async checkIfLoggedIn(): Promise<boolean> {
		const token = this.get('token');
		const res = await fetch(`${API_URL}/cli/user`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		})
		return res.status === 200;


	}
	set(key: string, value: any): void {
		this.config.set(key, value);
	}

	get(key: string): any {
		return this.config.get(key);
	}

	delete(key: string): void {
		this.config.delete(key);
	}

	clear(): void {
		this.config.clear();
	}
}
export const storage = new SafeStorage('fabriclaunch');