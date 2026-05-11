class API {
  static getToken() {
    return localStorage.getItem('token');
  }

  static headers(auth = true) {
    const h = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  }

  static async get(url, auth = true) {
    try {
      const res = await fetch(url, { headers: this.headers(auth) });
      return await res.json();
    } catch (e) {
      console.error('API GET error:', e);
      return { success: false, error: 'Ошибка соединения' };
    }
  }

  static async post(url, body, auth = true) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers(auth),
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      console.error('API POST error:', e);
      return { success: false, error: 'Ошибка соединения' };
    }
  }

  static async put(url, body, auth = true) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: this.headers(auth),
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      console.error('API PUT error:', e);
      return { success: false, error: 'Ошибка соединения' };
    }
  }

  static async del(url, auth = true) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.headers(auth)
      });
      return await res.json();
    } catch (e) {
      console.error('API DELETE error:', e);
      return { success: false, error: 'Ошибка соединения' };
    }
  }

  static async patch(url, body, auth = true) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.headers(auth),
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e) {
      console.error('API PATCH error:', e);
      return { success: false, error: 'Ошибка соединения' };
    }
  }
}