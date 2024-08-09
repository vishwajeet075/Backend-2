let path= require('path');

module.exports ={
    entry : 'functions/app.js',
    mode :'development',
    output : {
        filename:'main.js',
        path:path.resolve(__dirname,'dist')
    }
};