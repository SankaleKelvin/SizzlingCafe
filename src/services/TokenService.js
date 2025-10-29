class TokenService {
  static setToken(data) {
    localStorage.setItem('token', data.token)
  }

  static getToken(){
    return localStorage.getItem('token')
  }

  static logout(){
    localStorage.clear();
  }

  isAuthenticated(){
      return !!this.getToken();
    }

}
export default TokenService;
