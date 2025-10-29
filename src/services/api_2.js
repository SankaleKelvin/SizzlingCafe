import axios from "axios";
import TokenService from "./TokenService";

const api = axios.create({
    'baseURL':'http://127.0.0.1:8000/api',
    headers: {
        'enctype':'multipart/form-data'
    }
})

api.interceptors.request.use(
  (config) => {
    const token = TokenService.getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)


export default api