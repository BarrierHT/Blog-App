require('dotenv').config({ path: `development.env` });
const { expect } = require('chai');
const mongoose = require('mongoose');

const User = require('../src/models/user');
const Post = require('../src/models/post');
const feedController = require('../src/controllers/feed');

const mongoUser = process.env.MONGO_USER;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoDatabase = process.env.MONGO_TEST_DATABASE;
const mongoCluster = process.env.MONGO_CLUSTER;
const mongoDBUrl = `mongodb+srv://${mongoUser}:${mongoPassword}@${mongoCluster}.msdnf.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;

describe('Feed controller', () => {

    before((done) => {
        mongoose
            .connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(res => {
                const user = new User({
                    email: 'test2@gmail.com',
                    password: 'Test222',
                    name: 'Test2',
                    posts: [],
                    _id: '61fd1bfb23fbd2d4403dedee'
                });
                return user.save();
            })
            .then(user => done());
    });

    //?beforeEach(done => { done(); }, 5000);
    //?afterEach(done => { done(); }, 7000);

    it('should send a response with a valid user status for an existing user', (done) => {
        const req = {
            userId: '61fd1bfb23fbd2d4403dedee'
        };
        const res = {
            message: null,
            userStatus: null,
            statusCode: 500,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function ({ status }) {
                // this.message = message;
                this.userStatus = status;
                return this;
            }
        };
        feedController.getStatus(req, res, () => { })
            .then(result => {
                // console.log(res);
                expect(res.statusCode).to.be.equal(200);
                expect(res.userStatus).to.be.equal('I am new!');
                done();
            });
    });

    it('should create a post and add it to a creator', (done) => {
        const req = {
            body: {
                title: 'foo',
                content: 'bar'
            },
            file: {
                location: '/aaaa/cd'
            },
            userId: '61fd1bfb23fbd2d4403dedee'
        };

        const res = {
            status: function () {
                return this;
            },
            json: function () { }
        };

        feedController.createPost(req, res, () => { })
            .then(user => {
                // console.log('User: ', user);
                expect(user).to.have.property('posts');
                expect(user.posts).to.have.length(1);
                done();
            });
    });


    after((done) => {
        User.deleteMany({})
            .then(result => {
                return Post.deleteMany({});
            })
            .then(result => mongoose.disconnect())
            .then(result => done());
    });

});

