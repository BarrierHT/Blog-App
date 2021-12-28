const authResolver = require('../controllers/authResolver');
const feedResolver = require('../controllers/feedResolver');

module.exports = {
    signup: async (args, req) => {
        return await authResolver.signup(args, req);
    },

    login: async (args, req) => {
        return await authResolver.login(args, req);
    },

    getUser: async (args, req) => {
        return await authResolver.getUser(args, req);
    },

    hello: () => {
        return authResolver.hello();
    },

    updateStatus: async (args, req) => {
        return await feedResolver.updateStatus(args, req);
    },

    getPosts: async (args, req) => {
        return await feedResolver.getPosts(args, req);
    },

    createPost: async (args, req) => {
        return await feedResolver.createPost(args, req);
    },

    editPost: async (args, req) => {
        return await feedResolver.editPost(args, req);
    },

    deletePost: async (args, req) => {
        return await feedResolver.deletePost(args, req);
    },

    getPost: async (args, req) => {
        return await feedResolver.getPost(args, req);
    },
};
