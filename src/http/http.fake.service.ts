import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

@Injectable()
export class FakeHttpService {
    private readonly axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            headers: {
                'Content-Type': 'application/json',
            },
            baseURL: 'https://httpbin.org/status',
        });

        this.axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        axiosRetry(this.axiosInstance, {
            retries: 5,
            retryDelay: (retryCount) => {
                return retryCount * 1000;
            },
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error);
            },
            onRetry(retryCount, error, requestConfig) {
                console.log(`tentativa: ${retryCount}, url: ${error?.config?.url} |`, error.response?.status, error.response?.data || error?.message);
            },
        });
    }

    get axios(): AxiosInstance {
        return this.axiosInstance;
    }
}
