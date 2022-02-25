const { isAuth } = require('../src/middlewares/isAuth');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

describe('Auth Middleware', () => {

    it('should throw a error if header Authorization is not provided', () => {
        const req = {
            get: (headerValue) => {
                // console.log(headerValue);
                return null;
            }
        };
        expect(isAuth.bind(this, req, {}, () => { })).to.throw('Not Authenticated');
    });

    it('should throw an error if the Authorization header is only one string', () => {
        const req = {
            get: (headerValue) => {
                return 4;
            }
        };
        expect(isAuth.bind(this, req, {}, () => { })).to.throw();
    });


    it('should not throw an error if an userId is provided by the token', () => {
        const req = {
            get: (headerValue) => {
                return 'Bearer xyz';
            }
        };

        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'xyz' });
        isAuth(req, {}, () => { });                        //*Call the function to get the req with the userId
        expect(req).to.have.property('userId');
        // expect(req).to.have.property('userId', 'xyz');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    });

    it('should throw an error if the token can not be verified', () => {
        const req = {
            get: (headerValue) => {
                return 'Bearer xyz';
            }
        };
        expect(isAuth.bind(this, req, {}, () => { })).to.throw();
    });


});
