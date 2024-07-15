import axios, { AxiosInstance } from 'axios';

const url: string = 'https://73ba-103-165-209-195.ngrok-free.app';

const axiosInstance: AxiosInstance = axios.create({
    baseURL: url,
});

export default axiosInstance;
