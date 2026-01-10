import { auth } from './firebase';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return await user.getIdToken();
  }

  async createUser(email: string, password: string, name: string, role: 'admin' | 'staff') {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, password, name, role })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    return data;
  }

  async deleteUser(uid: string) {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return data;
  }
}

export const apiService = new ApiService();