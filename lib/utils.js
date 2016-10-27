const utils = {
    t2str : function(t) {
        if (t < 1000) {
            t = Math.floor(t) + ' ms';
        }
        else if (t >= 1000 && t < 60000) {
            t = Math.floor(t / 1000);
            if (t == 1) {
                t += ' sec';
            }
            else {
                t += ' secs';
            }
        }
        else {
            t = '> ' + Math.floor(t / 60000) + ' min';
        }
        
        
        return t;
    },

    str2t : function(s) {
        var [t, u] = s.split(/ /);
        if (u.substr(0, 3) === 'sec') {
            t = t * 1000;
        }
        else if (u.substr(0, 3) === 'min') {
            t = t * 60 * 1000;
        }
        
        return t;
    }
};

module.exports = utils;