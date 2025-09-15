import request from '../axios/index';

export function translate(data) {
    return request({
        url: '/translation/translate',
        method: 'post',
        data
    });
}