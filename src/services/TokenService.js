class TokenService {
  static setToken(data) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('abilities', JSON.stringify(data.abilities))
  }

  static getToken(){
    return localStorage.getItem('token')
  }
  static getUser(){
    const user = localStorage.getItem('user');
    return JSON.parse(user);
  }

  static logout(){
    localStorage.clear();
  }

  static isAuthenticated(){
      return !!this.getToken();
    }

}
export default TokenService;
