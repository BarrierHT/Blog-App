const { expect } = require('chai');
const sinon = require('sinon');

const User = require('../src/models/user');
const authController = require('../src/controllers/auth');


describe('Auth controller - Login', () => {
    it('should throw an error with code 500 if accessing the database fails', (done) => {
        sinon.stub(User, 'findOne').rejects();

        const req = {
            body: {
                email: 'test1@gmail.com',
                password: 'abC32ds'
            }
        };

        authController.login(req, {}, () => { })
            .then(result => {
                console.log('ERR (auth): ', result.statusCode);
                expect(result).to.be.an('error');
                expect(result).to.have.property('statusCode', 500);
                // return result;
                done();
            });


        User.findOne.restore();
    });
});
