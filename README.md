# LoginBackend
Simple login for express

- Written in TypeScript
- Authentication in your hands

## Usage Example
```TypeScript
import Express from 'express';
import setupLogin from '@basicserver/login-backend';

const App = Express();

setupLogin(App, (username, password) => {
	return (username == 'admin' && password == 'password');
}, {
	loginPath: '/login.html',
});

App.use(Express.static('site'));

App.listen(8080);
```

## Configuration
- loginPath: string
    - Path to redirect to for login
- homePath: string
    - Path to redirect to when logged in
- secureCookies: string = false
    - Use secure cookies (works only on HTTPS)

## Requests
- `POST /login`
    - Used to log in
    - Body: { username: string, password: string }
    - (Compatible with HTML form)
- `POST /logout`
    - Logs out
- `ALL *`
    - Redirects to login path if not logged in
- `GET /whoami`
    - Shows username and loginDate

## Types
- LoginExtendedSession extends Session
    - username?: string
    - loginDate?: Date

- LoginExtendedRequest extends Request
    - session: LoginExtendedSession
