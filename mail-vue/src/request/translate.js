import axios from '@/axios/index'

export function translate(text) {
    return axios.post('/translate', { text });
}