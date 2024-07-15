import axios, { AxiosInstance } from 'axios';

const url: string = 'https://18bf-36-68-222-140.ngrok-free.app';
const url2: string = 'https://73ba-103-165-209-195.ngrok-free.app/';
const localhost = 'http://localhost:3000';

const axiosInstance: AxiosInstance = axios.create({
    baseURL: url2,
});

export default axiosInstance;
