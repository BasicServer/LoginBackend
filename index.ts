import Express from 'express';
import session, { Session } from 'express-session';
import BodyParser from 'body-parser';
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
	homePath: string;
	secureCookies?: boolean;
}

// MAIN
export default function setupLogin(
	expressApp: Express.Express,
	checkLogin: LoginChecker,
	configuration: LoginConfiguration,
) {
	//setup
	expressApp.use(
		session({
			secret: Crypto.randomBytes(18).toString('hex'),
			resave: false,
			saveUninitialized: true,
			cookie: { secure: configuration.secureCookies ?? false },
		}),
	);

	const bodyParser = BodyParser.urlencoded({extended: true});

	//routes
	expressApp.post('/login', bodyParser, (req: LoginExtendedRequest, res) => {
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
				res.redirect(configuration.homePath);
			} else {
				res.statusCode = 401;
				setTimeout(() => res.redirect(configuration.loginPath), 4000);
			}
		} catch {
			console.error('Failed to process login request');
			res.statusCode = 400;
			setTimeout(() => res.redirect(configuration.loginPath), 4000);
		}
	});

	expressApp.post('/logout', (req: LoginExtendedRequest, res) => {
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
