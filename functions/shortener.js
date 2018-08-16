/**
 *
 * Based on https://github.com/delight-im/ShortURL/blob/master/JavaScript/ShortURL.js
 *
 * encode() takes an ID and turns it into a short string
 * decode() takes a short string and turns it into an ID
 *
 * Features:
 * + large alphabet (51 chars) and thus very short resulting strings
 * + proof against offensive words (removed 'a', 'e', 'i', 'o' and 'u')
 * + unambiguous (removed 'I', 'l', '1', 'O' and '0')
 *
 * Example output:
 * 123456789 <=> pgK8p
 */

module.exports = {
    encode: (num) => {
        let str = '';
        while (num > 0) {
            str = _alphabet.charAt(num % _base) + str;
            num = Math.floor(num / _base);
        }
        return str;
    },
    decode: (str) => {
        let num = 0;
        for (let i = 0; i < str.length; i++) {
            num = num * _base + _alphabet.indexOf(str.charAt(i));
        }
        return num;
    }
};

let _alphabet = '23456789bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ-_';
let  _base = _alphabet.length;