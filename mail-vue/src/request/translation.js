import request from './index';

export function translate(data) {
    return request({
        url: '/translation/translate',
        method: 'post',
        data
    });
}