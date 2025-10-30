import { ref } from "vue";

const token = ref(localStorage.getItem('token'))

class TokenService {
 
  static setToken(data) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('abilities', JSON.stringify(data.abilities))
  }

  static getToken(){
    return token.value;
  }
  static getUser(){
    const user = localStorage.getItem('user');
    return JSON.parse(user);
  }

  static logout(){
    localStorage.clear();

  }

  static isAuthenticated(){
      return !!token;
    }

}
export default TokenService;
