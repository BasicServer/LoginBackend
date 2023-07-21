import Express from 'express';
import session, { Session } from 'express-session';
import * as Crypto from 'crypto';

// TYPES
export type LoginChecker = (username: string, password: string) => boolean;

export interface LoginExtendedSession extends Session {
	username?: string;
	loginDate?: Date;
}

export interface LoginExtendedRequest extends Express.Request {
	session: LoginExtendedSession;
}

export interface LoginConfiguration {
	loginPath: string;
	secureCookies?: boolean;
}

// MAIN
export default function setupLogin(
	expressApp: Express.Express,
	checkLogin: LoginChecker,
	configuration: LoginConfiguration,
) {

	//setup
	expressApp.use(Express.urlencoded({ extended: true }));
	expressApp.use(
		session({
			secret: Crypto.randomBytes(18).toString('hex'),
			resave: false,
			saveUninitialized: true,
			cookie: { secure: configuration.secureCookies ?? false },
		}),
	);

	//routes
	expressApp.post('/login', (req: LoginExtendedRequest, res) => {
		try {
			const { username, password } = req.body as any;

			//ensure credentials
			for (const item of [username, password]) {
				if (typeof item != 'string') throw ``;
			}

			const isAuthenticated = checkLogin(username, password);

			if (isAuthenticated == true) {
				req.session.username = username;
				req.session.loginDate = new Date();

				res.statusCode = 200;
				res.redirect('/whoami');
			} else {
				res.statusCode = 401;
				res.redirect(configuration.loginPath);
			}
		} catch {
			res.statusCode = 400;
			res.redirect(configuration.loginPath);
		}
	});

	expressApp.get('/logout', (req: LoginExtendedRequest, res) => {
		req.session.username = undefined;
		req.session.loginDate = undefined;

		res.redirect(configuration.loginPath);
	});

	//redirect to login page
	expressApp.all('*', (req: LoginExtendedRequest, res, next) => {
		if (typeof req.session.username != 'string' && req.path != configuration.loginPath && checkIsLikelyRequestingHTML(req.path)) {
			res.redirect(configuration.loginPath);
		} else {
			next();
		}
	});

	expressApp.get('/whoami', (req: LoginExtendedRequest, res) => {
		res.send(
			`Username: ${
				req.session.username
			} <br> Logged in: ${req.session.loginDate?.toString()}`,
		);
	});

	expressApp.get(configuration.loginPath, (req: LoginExtendedRequest, res, next) => {
		if (typeof req.session.username == 'string' && req.path != '/') {
			//already logged in
			res.redirect('/');
		} else {
			next();
		}
	});
}

// UTILITY
function checkIsLikelyRequestingHTML(path: string): boolean {
	const [suffix] = path.split('.').reverse();

	return (
		suffix == path || //no suffix
		suffix == 'html'
	)
}
