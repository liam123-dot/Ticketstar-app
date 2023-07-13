import {CognitoUserPool} from 'amazon-cognito-identity-js';

const poolData = {

  UserPoolId: "eu-west-2_4o6b90A5T",
  ClientId: '1ehc0rh9dcug5djlopnrgfv5bq',
};

export default new CognitoUserPool(poolData);
