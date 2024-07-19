import axios, { AxiosInstance } from 'axios';

const url: string = 'https://bad8-103-165-209-195.ngrok-free.app';
// const url: string = 'https://xmatch.ilhamindhi.online';

const axiosInstance: AxiosInstance = axios.create({
    baseURL: url,
});

export default axiosInstance;
