import axios, { AxiosInstance } from 'axios';

const url: string = 'https://18bf-36-68-222-140.ngrok-free.app';

const axiosInstance: AxiosInstance = axios.create({
    baseURL: url,
});

export default axiosInstance;
