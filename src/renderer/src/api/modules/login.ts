import Abstract from '../Abstract'
import UserType from './type/login'

class LoginApi extends Abstract {
  constructor() {
    super()
  }

  login(account: string, password: string): Promise<UserType> {
    return this.postReq('/login', { account, password }) as Promise<UserType>
  }

  signIn(account: string, password: string, name: string): Promise<UserType> {
    return this.postReq('/signin', { account, password, name }) as Promise<UserType>
  }
}

export default new LoginApi()
