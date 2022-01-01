let io;

module.exports = {
    init: httpServer => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: [
                    'http://localhost:3000',
                    'https://master.d32vp8t9wfhq83.amplifyapp.com',
                ],
                methods: ['GET', 'POST'],
            },
        });
        return io;
    },
    getIO: () => {
        if (!io) throw new Error('Socket IO Connection was not defined yet');
        return io;
    },
};
