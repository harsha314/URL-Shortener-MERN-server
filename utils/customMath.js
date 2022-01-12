exports.toBase64 = (num) => {
    let ans = '';
    let alpha =
        '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
    while (num > 0) {
        let cur = 0;
        for (let j = 0; j < 6; ++j) {
            cur = 2 * cur + (num & 1);
            num >>= 1;
        }
        ans += alpha[cur];
    }
    if (!ans) ans = '0';
    return ans;
};

exports.generateRandom = (l, r) => {
    return l + Math.floor(Math.random() * (r - l));
};
